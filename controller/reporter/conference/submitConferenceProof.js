const ReporterConference = require("../../../models/reporterConference/reporterConference");

const submitConferenceProof = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const { videoLink, channelName, platform, duration } = req.body;
    const reporterId = req.user._id;
    
    // Get the uploaded file from multer
    const screenshot = req.file ? req.file.filename : null;
    
    console.log("Conference proof submission request:", {
      conferenceId,
      videoLink,
      channelName,
      platform,
      duration,
      screenshot,
      reporterId
    });

    // Validate required fields
    if (!videoLink) {
      return res.status(400).json({
        success: false,
        message: "Video link is required",
      });
    }

    if (!channelName) {
      return res.status(400).json({
        success: false,
        message: "Channel name is required",
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: "Platform is required",
      });
    }

    if (!duration) {
      return res.status(400).json({
        success: false,
        message: "Duration is required",
      });
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
    const isValidYouTubeUrl = youtubeRegex.test(videoLink);

    if (!isValidYouTubeUrl) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid YouTube URL",
      });
    }

    // Helper function to parse date and time strings into a Date object
    const getConferenceDateTime = (dateStr, timeStr, periodStr) => {
      try {
        const parts = dateStr.replace(/\//g, "-").split("-").map(Number);
        let year, month, day;
        if (parts[0] > 1000) {
          [year, month, day] = parts;
        } else {
          [day, month, year] = parts;
        }

        let [hours, minutes] = timeStr.split(":").map(Number);
        const period = String(periodStr).trim().toUpperCase();
        if (period === "PM" && hours < 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
        return new Date(year, month - 1, day, hours, minutes);
      } catch (err) {
        console.error("Error parsing conference date/time:", err);
        return null;
      }
    };

    // Find the reporter conference
    const reporterConference = await ReporterConference.findOne({
      conferenceId: conferenceId,
      reporterId: reporterId,
      status: "accepted"
    });

    if (!reporterConference) {
      // Debug: Check if any record exists for this conference and reporter
      const anyRecord = await ReporterConference.findOne({
        conferenceId: conferenceId,
        reporterId: reporterId
      });
      
      console.log("Debug - Looking for conference:", {
        conferenceId,
        reporterId: reporterId.toString(),
        foundAccepted: !!reporterConference,
        foundAny: !!anyRecord,
        anyRecordStatus: anyRecord?.status
      });
      
      if (anyRecord) {
        return res.status(400).json({
          success: false,
          message: `Conference found but status is '${anyRecord.status}'. Only accepted conferences can submit proof.`,
        });
      }
      
      return res.status(404).json({
        success: false,
        message: "Accepted conference not found. Please make sure you have accepted this conference first.",
      });
    }

    // Check 72 hours expiry after conference date/time
    if (reporterConference.conferenceDetails) {
      const { conferenceDate, conferenceTime, timePeriod } = reporterConference.conferenceDetails;
      if (conferenceDate && conferenceTime && timePeriod) {
        const confDateObj = getConferenceDateTime(conferenceDate, conferenceTime, timePeriod);
        if (confDateObj) {
          const now = new Date();
          const diffInMs = now - confDateObj;
          const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days (72 hours)
          if (diffInMs > threeDaysInMs) {
            console.log("❌ Free Conference Missed: Reporter exceeded 72 hours limit after conference date/time");

            // Mark status as rejected
            reporterConference.status = "rejected";
            reporterConference.rejectNote = "Missed conference session: Proof not submitted within 72 hours after conference date/time.";
            await reporterConference.save();

            // 📱 Send WhatsApp notification for Free Conf Missed [63free_conf_missed]
            try {
              const User = require("../../../models/userModel/userModel");
              const reporterUser = await User.findById(reporterId);
              if (reporterUser && reporterUser.mobile) {
                const notifyOnWhatsapp = require("../../../utils/notifyOnWhatsapp");
                const Templates = require("../../../utils/whatsappTemplates");
                await notifyOnWhatsapp(reporterUser.mobile, Templates.FREE_CONF_MISSED, []);
                console.log(`📱 Sent WhatsApp free conference missed notification [63free_conf_missed] to ${reporterUser.name} (${reporterUser.mobile})`);
              }
            } catch (whatsappErr) {
              console.error("❌ Failed to send WhatsApp free conference missed notification:", whatsappErr.message);
            }

            return res.status(403).json({
              success: false,
              message: "You missed this conference session: You did not submit proof within the 72-hour limit after the conference date and time."
            });
          }
        }
      }
    }

    // Check if proof already submitted and not rejected
    if (reporterConference.proofSubmitted && !reporterConference.proofDetails.adminRejectNote) {
      return res.status(400).json({
        success: false,
        message: "Proof already submitted for this conference",
      });
    }

    // Update proof details
    reporterConference.proofSubmitted = true;
    reporterConference.proofDetails = {
      channelName: channelName || "",
      platform: platform || "YouTube",
      videoLink: videoLink,
      duration: duration || "",
      screenshot: screenshot || "", // This will be the filename from multer
      submittedAt: new Date(),
      // Clear rejection note on resubmission
      adminRejectNote: "",
      rejectedAt: null,
    };

    await reporterConference.save();

    res.status(200).json({
      success: true,
      message: "Proof submitted successfully",
      data: {
        conferenceId: reporterConference.conferenceId,
        proofSubmitted: reporterConference.proofSubmitted,
        proofDetails: reporterConference.proofDetails,
      },
    });
  } catch (error) {
    console.error("Error submitting conference proof:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting proof",
    });
  }
};

// Get proof details for a specific conference
const getConferenceProof = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const reporterId = req.user._id;

    const reporterConference = await ReporterConference.findOne({
      conferenceId: conferenceId,
      reporterId: reporterId,
      status: "accepted"
    });

    if (!reporterConference) {
      return res.status(404).json({
        success: false,
        message: "Accepted conference not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Proof details fetched successfully",
      data: {
        proofSubmitted: reporterConference.proofSubmitted,
        proofDetails: reporterConference.proofDetails,
        conferenceDetails: reporterConference.conferenceDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching conference proof:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching proof details",
    });
  }
};

module.exports = {
  submitConferenceProof,
  getConferenceProof,
};
