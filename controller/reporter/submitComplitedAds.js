const Adpost = require("../../models/advertismentPost/advertisementPost");
const reporterAdProof = require("../../models/reporterAdProof/reporterAdProof");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const fs = require("fs");

const getYouTubeViewCount = require("../../utils/getYouTubeViewCount");
const getFacebookViewCount = require("../../utils/getFacebookViewCount");

const submitComplitedAds = async (req, res) => {
  try {
    console.log("🚀 submitComplitedAds called");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    const reporterId = req.user._id;
    const { platform, videoUrl, adId } = req.body;
    const screenshotFile = req.file;

    console.log("Extracted data:", {
      reporterId,
      platform,
      videoUrl,
      adId,
      hasScreenshotFile: !!screenshotFile
    });

    // ✅ Validate required fields
    if (!platform || !videoUrl || !adId || !screenshotFile) {
      console.error("❌ Missing required fields:", {
        platform: !!platform,
        videoUrl: !!videoUrl,
        adId: !!adId,
        hasScreenshotFile: !!screenshotFile
      });
      return res.status(400).json({ message: "Platform, videoUrl, adId, and screenshot are required" });
    }

    // ✅ Handle local file storage instead of Cloudinary for high performance
    let screenshotUrl = null;
    if (screenshotFile) {
      // Use the local server URL. In production, this would be your domain.
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
      screenshotUrl = `${baseUrl}/upload/${screenshotFile.filename}`;
      console.log("✅ Final Proof stored locally on server:", screenshotUrl);
    } else {
      return res.status(400).json({ message: "Screenshot file is required" });
    }

    // ✅ 1. Get Ad post details
    const adPost = await Adpost.findById(adId);
    if (!adPost) {
      return res.status(404).json({ message: "Ad not found" });
    }

    const baseView = adPost.baseView;
    if (!baseView || isNaN(baseView)) {
      return res.status(400).json({ message: "Invalid base view in Adpost" });
    }

    // ✅ Check 3-day expiry from acceptedAt (72 hours limit for completion)
    const reporterEntry = adPost.acceptRejectReporterList.find(
      (r) => r.reporterId.toString() === reporterId.toString()
    );

    if (reporterEntry && reporterEntry.acceptedAt) {
      const acceptedAt = new Date(reporterEntry.acceptedAt);
      const now = new Date();
      const diffInMs = now - acceptedAt;
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days (72 hours)

      if (diffInMs > threeDaysInMs) {
        console.log("❌ Task expired: User exceeded 3 days limit");

        // 1. Mark as rejected in Adpost
        await Adpost.updateOne(
          { _id: adId, "acceptRejectReporterList.reporterId": reporterId },
          {
            $set: {
              "acceptRejectReporterList.$.postStatus": "rejected",
              "acceptRejectReporterList.$.accepted": false,
              "acceptRejectReporterList.$.adProof": false,
              "acceptRejectReporterList.$.rejectNote": "Ad rejected: Task not completed within 3 days limit.",
            },
          }
        );

        // 2. Mark as rejected in ReporterAdProof if exists
        await reporterAdProof.updateOne(
          { adId, "proofs.reporterId": reporterId },
          {
            $set: {
              "proofs.$.status": "rejected",
              "proofs.$.adminRejectNote": "Ad rejected: Task not completed within 3 days limit."
            }
          }
        );

        // 📱 Send WhatsApp notification for Ads Expired [61ads_expired]
        if (req.user && req.user.mobile) {
          try {
            const notifyOnWhatsapp = require("../../utils/notifyOnWhatsapp");
            const Templates = require("../../utils/whatsappTemplates");
            await notifyOnWhatsapp(req.user.mobile, Templates.ADS_EXPIRED, []);
            console.log(`📱 Sent WhatsApp ad expired notification [61ads_expired] to ${req.user.name} (${req.user.mobile})`);
          } catch (whatsappErr) {
            console.error("❌ Failed to send WhatsApp ad expired notification:", whatsappErr.message);
          }
        }

        return res.status(403).json({
          success: false,
          message: "Ad rejected: You did not complete the task within the 3-day time limit."
        });
      }
    }
    console.log("📊 Fetching current views for platform:", platform);
    let currentViews = null;
    try {
      if (platform.toLowerCase() === "youtube") {
        console.log("📺 Fetching YouTube views for:", videoUrl);
        currentViews = await getYouTubeViewCount(videoUrl, process.env.YOUTUBE_API_KEY);
        console.log("📺 YouTube views result:", currentViews);
      } else if (platform.toLowerCase() === "facebook") {
        console.log("📘 Fetching Facebook views for:", videoUrl);
        // Pass returnNumeric=true to get numeric value directly
        currentViews = await getFacebookViewCount(videoUrl, 0, true);
        console.log("📘 Facebook views result:", currentViews);
      } else {
        console.error("❌ Unsupported platform:", platform);
        return res.status(400).json({ message: "Unsupported platform" });
      }
    } catch (viewError) {
      console.error("❌ Error fetching views:", viewError);
      return res.status(500).json({ message: "Failed to fetch current view count: " + viewError.message });
    }

    if (!currentViews || isNaN(currentViews)) {
      console.error("❌ Invalid view count:", currentViews);
      return res.status(500).json({ message: "Failed to fetch current view count" });
    }

    // ✅ 3. Compare views with base view
    if (currentViews < baseView) {
      return res.status(200).json({
        success: false,
        message: `Current views (${currentViews}) are less than required base view (${baseView}). Task not yet completed.`,
      });
    }

    // ✅ 4. Update proof with completion screenshot but keep status as "submitted" for admin review
    console.log("💾 Updating proof in database:", {
      adId,
      reporterId,
      screenshotUrl
    });

    // ✅ Check if initial proof was approved - only allow final proof submission if initial proof is approved
    const existingProof = await reporterAdProof.findOne({
      adId,
      "proofs.reporterId": reporterId
    });

    if (!existingProof) {
      return res.status(404).json({ message: "Proof not found. Please submit initial proof first." });
    }

    const reporterProof = existingProof.proofs.find(
      (p) => p.reporterId.toString() === reporterId.toString()
    );

    if (!reporterProof) {
      return res.status(404).json({ message: "Proof not found. Please submit initial proof first." });
    }

    // ✅ CRITICAL: Only allow final proof submission if initial proof is APPROVED
    // Check if initial proof was approved by checking:
    // 1. Status is "approved" (initial proof approved)
    // 2. OR initialProofApprovedAt field exists (backward compatibility)
    const isInitialProofApproved =
      reporterProof.status === "approved" ||
      (reporterProof.initialProofApprovedAt !== null && reporterProof.initialProofApprovedAt !== undefined);

    console.log("🔍 Checking initial proof approval status:", {
      reporterId: reporterId.toString(),
      currentStatus: reporterProof.status,
      hasInitialProofApprovedAt: !!reporterProof.initialProofApprovedAt,
      initialProofApprovedAt: reporterProof.initialProofApprovedAt,
      isInitialProofApproved: isInitialProofApproved
    });

    if (!isInitialProofApproved) {
      // Initial proof has not been approved yet
      if (reporterProof.status === "pending") {
        return res.status(400).json({
          message: "Initial proof is still pending admin approval. Please wait for admin to approve your initial proof before submitting the final proof."
        });
      }

      if (reporterProof.status === "rejected" && reporterProof.initialProofRejectNote) {
        return res.status(400).json({
          message: "Your initial proof was rejected. Please resubmit your initial proof first on the Accepted Ads page before submitting the final proof."
        });
      }

      // Generic message for other cases
      return res.status(400).json({
        message: "Initial proof must be approved before submitting final proof. Please wait for admin approval or resubmit your initial proof if it was rejected."
      });
    }

    // ✅ Initial proof is approved - check if we can submit final proof
    // If status is "rejected" but initial proof is approved, it means final proof was rejected - allow resubmission
    // If status is "submitted" or "completed", don't allow resubmission
    if (reporterProof.status === "submitted") {
      return res.status(400).json({
        message: "Final proof has already been submitted and is pending admin approval."
      });
    }

    if (reporterProof.status === "completed") {
      return res.status(400).json({
        message: "This task has already been completed and approved."
      });
    }

    // ✅ Allow submission if:
    // - Status is "approved" (initial proof approved, ready for final proof)
    // - Status is "rejected" but initial proof is approved (final proof was rejected, allow resubmission)
    // The database update query will handle the status check

    // ✅ Update query: Allow if status is "approved" OR if status is "rejected" but initial proof is approved (final proof rejection)
    // Also allow if status is "approved" (most common case after initial proof approval)
    const updateQuery = {
      adId,
      "proofs.reporterId": reporterId,
      $or: [
        { "proofs.status": "approved" }, // Initial proof approved, ready for final proof
        {
          "proofs.status": "rejected",
          "proofs.initialProofApprovedAt": { $exists: true, $ne: null } // Final proof rejected but initial proof is approved
        }
      ]
    };

    console.log("💾 Attempting database update with query:", JSON.stringify(updateQuery, null, 2));

    const updatedDoc = await reporterAdProof.findOneAndUpdate(
      updateQuery,
      {
        $set: {
          "proofs.$.completedTaskScreenshot": screenshotUrl, // ✅ Use Cloudinary URL
          "proofs.$.completionSubmittedAt": new Date(),
          "proofs.$.status": "submitted", // ✅ Set status to "submitted" for admin review
        }
      },
      { new: true }
    );

    console.log("💾 Database update result:", updatedDoc ? "Success" : "Failed");
    if (updatedDoc) {
      const updatedProof = updatedDoc.proofs.find(p => p.reporterId.toString() === reporterId.toString());
      console.log("📊 Updated proof data:", {
        status: updatedProof?.status,
        hasCompletionScreenshot: !!updatedProof?.completedTaskScreenshot,
        completionSubmittedAt: updatedProof?.completionSubmittedAt
      });
    } else {
      console.error("❌ Proof not found or query didn't match. Current proof status:", reporterProof.status);
    }

    if (!updatedDoc) {
      console.error("❌ Proof update failed. Current proof status:", reporterProof.status);
      return res.status(400).json({
        message: "Cannot submit final proof. Please ensure your initial proof is approved and you haven't already submitted the final proof."
      });
    }

    // ✅ Update reporter's status in the ad to show proof is submitted
    await Adpost.updateOne(
      { _id: adId, "acceptRejectReporterList.reporterId": reporterId },
      {
        $set: {
          "acceptRejectReporterList.$.postStatus": "proof_submitted",
          "acceptRejectReporterList.$.submittedAt": new Date(),
        },
        $unset: {
          "acceptRejectReporterList.$.rejectedAt": 1,
          "acceptRejectReporterList.$.rejectNote": 1,
          "acceptRejectReporterList.$.adminRejectedBy": 1,
          "acceptRejectReporterList.$.adminRejectedByName": 1,
        },
      }
    );

    // 📱 Send WhatsApp notification for proof submission
    if (req.user && req.user.mobile) {
      try {
        const notifyOnWhatsapp = require("../../utils/notifyOnWhatsapp");
        const Templates = require("../../utils/whatsappTemplates");
        await notifyOnWhatsapp(req.user.mobile, Templates.ADS_FINAL_PROOF_SUBMITTED, []);
        console.log(`📱 Sent WhatsApp proof submission notification [30ads_final_proof_submitted] to ${req.user.name} (${req.user.mobile})`);
      } catch (whatsappErr) {
        console.error("❌ Failed to send WhatsApp proof submission notification:", whatsappErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Completion screenshot submitted successfully. Admin will review and approve to mark as completed.",
      data: updatedDoc,
    });

  } catch (error) {
    console.error("submitComplitedAds Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while marking task as completed",
    });
  }
};

module.exports = submitComplitedAds;
