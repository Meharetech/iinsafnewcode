const PaidConference = require("../../../models/pressConference/paidConference");
const User = require("../../../models/userModel/userModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const ensureUploadDir = () => {
  const uploadDir = "uploads/conference-proofs/";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created upload directory:", uploadDir);
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir(); // Ensure directory exists
    cb(null, "uploads/conference-proofs/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "proof-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Middleware to handle file upload
const uploadProof = upload.single("screenshot");

// Submit proof for paid conference
const submitPaidConferenceProof = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const reporterId = req.user._id;

    console.log(`Submitting proof for paid conference: ${conferenceId} by reporter: ${reporterId}`);

    // Handle file upload
    uploadProof(req, res, async (err) => {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed"
        });
      }

      try {
        const { channelName, videoLink, platform, duration } = req.body;

        // Validate required fields
        if (!channelName || !videoLink || !platform || !duration) {
          return res.status(400).json({
            success: false,
            message: "All fields are required"
          });
        }

        // YouTube URL validation
        const youtubePattern = /^(https?:\/\/)?(www\.)?(youtu\.be\/|youtube\.com\/(watch\?|embed\/|v\/|shorts\/)?)/i;
        if (!youtubePattern.test(videoLink)) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid YouTube video link"
          });
        }

        // Disallow shorts and channel links
        if (/youtube\.com\/shorts\//i.test(videoLink) || 
            /youtube\.com\/(channel|c|user|@)\//i.test(videoLink) ||
            /youtube\.com\/@/i.test(videoLink)) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid YouTube video link, not shorts or channel links"
          });
        }

        // Find the paid conference
        const conference = await PaidConference.findOne({ conferenceId });
        if (!conference) {
          return res.status(404).json({
            success: false,
            message: "Conference not found"
          });
        }

        console.log("Found conference:", {
          conferenceId: conference.conferenceId,
          status: conference.status,
          acceptedReporters: conference.acceptedReporters?.length || 0,
          acceptedReportersData: conference.acceptedReporters || []
        });

        // Check if reporter has accepted this conference
        const acceptedReporters = conference.acceptedReporters || [];
        console.log("Looking for reporter:", {
          reporterId: reporterId.toString(),
          acceptedReportersCount: acceptedReporters.length,
          acceptedReportersIds: acceptedReporters.map(r => r.reporterId.toString())
        });
        
        const acceptedReporter = acceptedReporters.find(
          (user) => user.reporterId.toString() === reporterId.toString()
        );

        if (!acceptedReporter) {
          return res.status(403).json({
            success: false,
            message: "You have not accepted this conference"
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

        // Check 72 hours expiry after conference date/time
        if (conference.conferenceDate && conference.conferenceTime && conference.timePeriod) {
          const confDateObj = getConferenceDateTime(conference.conferenceDate, conference.conferenceTime, conference.timePeriod);
          if (confDateObj) {
            const now = new Date();
            const diffInMs = now - confDateObj;
            const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days (72 hours)
            if (diffInMs > threeDaysInMs) {
              console.log("❌ Paid Conference Missed: Reporter exceeded 72 hours limit after conference date/time");

              // Mark reporter status as rejected/missed
              acceptedReporter.status = "rejected";
              acceptedReporter.proofSubmitted = false;
              acceptedReporter.proof = {
                status: "rejected",
                adminNote: "Missed conference session: Proof not submitted within 72 hours after conference date/time.",
                rejectedAt: new Date()
              };

              await conference.save();

              // 📱 Send WhatsApp notification for Paid Conf Missed [64paid_conf_missed]
              try {
                const User = require("../../../models/userModel/userModel");
                const reporterUser = await User.findById(reporterId);
                if (reporterUser && reporterUser.mobile) {
                  const notifyOnWhatsapp = require("../../../utils/notifyOnWhatsapp");
                  const Templates = require("../../../utils/whatsappTemplates");
                  await notifyOnWhatsapp(reporterUser.mobile, Templates.PAID_CONF_MISSED, []);
                  console.log(`📱 Sent WhatsApp paid conference missed notification [64paid_conf_missed] to ${reporterUser.name} (${reporterUser.mobile})`);
                }
              } catch (whatsappErr) {
                console.error("❌ Failed to send WhatsApp paid conference missed notification:", whatsappErr.message);
              }

              return res.status(403).json({
                success: false,
                message: "You missed this conference session: You did not submit proof within the 72-hour limit after the conference date and time."
              });
            }
          }
        }

        // Check if proof is already submitted and not rejected
        if (acceptedReporter.proofSubmitted && acceptedReporter.proof?.status !== "rejected") {
          return res.status(400).json({
            success: false,
            message: "Proof already submitted for this conference"
          });
        }

        // Prepare proof data
        const proofData = {
          channelName,
          videoLink,
          platform,
          duration,
          submittedAt: new Date(),
          status: "pending"
        };

        // Add screenshot if uploaded
        if (req.file) {
          proofData.screenshot = req.file.filename;
          console.log("Screenshot uploaded:", {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            path: req.file.path
          });
        } else {
          console.log("No screenshot uploaded");
        }

        // Update the accepted reporter's proof
        acceptedReporter.proofSubmitted = true;
        acceptedReporter.proof = proofData;

        await conference.save();

        console.log(`Proof submitted successfully for paid conference: ${conferenceId}`);

        res.status(200).json({
          success: true,
          message: "Proof submitted successfully",
          data: {
            conferenceId,
            proof: proofData
          }
        });

      } catch (error) {
        console.error("Error submitting paid conference proof:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    });

  } catch (error) {
    console.error("Error in submitPaidConferenceProof:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  submitPaidConferenceProof
};
