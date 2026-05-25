const Adpost = require("../../../../models/advertismentPost/advertisementPost");
const reporterAdProof = require("../../../../models/reporterAdProof/reporterAdProof");
const User = require("../../../../models/userModel/userModel");
const Wallet = require("../../../../models/Wallet/walletSchema");
const mongoose = require("mongoose");

const markAdvertisementCompleted = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { adId } = req.params;
    const { shouldRefund = true } = req.body; // Admin can choose whether to refund or not
    const adminId = req.user.id;
    const adminName = req.user.name;

    if (!adId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Advertisement ID is required"
      });
    }

    console.log("🚀 Marking advertisement as completed:", adId);
    console.log("👤 Admin:", adminName, "ID:", adminId);
    console.log("💰 Refund choice:", shouldRefund ? "Yes, process refund" : "No, skip refund");

    // Find the advertisement
    const advertisement = await Adpost.findById(adId)
      .populate('owner', 'name email organization mobile iinsafId role')
      .populate('acceptRejectReporterList.reporterId', 'name email iinsafId role');

    if (!advertisement) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Advertisement not found"
      });
    }

    console.log("📊 Advertisement found:", advertisement._id);

    // Find all proofs for this advertisement
    const allProofs = await reporterAdProof.find({ adId: adId });

    console.log("📋 Total proofs found:", allProofs.length);
    console.log("📋 Total assigned reporters:", advertisement.acceptRejectReporterList?.length || 0);

    const completionResults = {
      adId: advertisement._id,
      totalReporters: advertisement.requiredReporter || 0,
      completedReporters: 0,
      rejectedReporters: 0,
      refundedReporters: 0,
      totalRefundAmount: 0,
      refundDetails: [],
      rejectedDetails: []
    };

    // Process only the required number of reporters (take first N reporters from the list)
    const requiredReporters = (advertisement.acceptRejectReporterList || []).slice(0, advertisement.requiredReporter || 0);

    console.log("📋 Required reporters:", advertisement.requiredReporter);
    console.log("📋 Total assigned reporters:", advertisement.acceptRejectReporterList?.length || 0);
    console.log("📋 Processing first", requiredReporters.length, "reporters");

    for (const assignedReporter of requiredReporters) {
      // Find if this reporter has submitted any proof
      let reporterProof = null;
      for (const proofDoc of allProofs) {
        reporterProof = proofDoc.proofs.find(p =>
          p.reporterId && p.reporterId._id.toString() === assignedReporter.reporterId.toString()
        );
        if (reporterProof) break;
      }

      const reporterName = assignedReporter.reporterId?.name || 'Unknown';
      const reporterEmail = assignedReporter.reporterId?.email || 'Unknown';
      const refundAmount = advertisement.finalReporterPrice || 0;

      // Check completion status - ONLY completed and admin approved work is considered complete
      if (reporterProof && reporterProof.status === "completed" && reporterProof.adminApprovedAt) {
        completionResults.completedReporters++;
        console.log(`✅ Reporter ${reporterName} completed work successfully`);
      } else {
        // ALL other statuses are considered incomplete and need refund
        completionResults.rejectedReporters++;

        let rejectReason = "";
        if (!reporterProof) {
          rejectReason = "No proof submitted - incomplete task";
        } else if (reporterProof.status === "rejected") {
          rejectReason = "Work rejected by admin - incomplete task";
        } else if (reporterProof.status === "submitted" && !reporterProof.adminApprovedAt) {
          rejectReason = "Proof submitted but not approved by admin - incomplete task";
        } else if (reporterProof.status === "accepted") {
          rejectReason = "Initial proof accepted but completion work not submitted - incomplete task";
        } else if (reporterProof.status === "pending") {
          rejectReason = "Initial proof submitted but completion work not submitted - incomplete task";
        } else {
          rejectReason = "No proof submitted - incomplete task";
        }

        // Update proof status to rejected (only if proof exists)
        if (reporterProof) {
          await reporterAdProof.updateOne(
            {
              adId: adId,
              "proofs.reporterId": assignedReporter.reporterId
            },
            {
              $set: {
                "proofs.$.status": "rejected",
                "proofs.$.adminRejectedAt": new Date(),
                "proofs.$.adminRejectedBy": adminId,
                "proofs.$.adminRejectedByName": adminName,
                "proofs.$.adminRejectNote": `Advertisement marked as completed. ${rejectReason}.`
              }
            },
            { session }
          );
        }

        // Update Adpost status
        await Adpost.updateOne(
          {
            _id: adId,
            "acceptRejectReporterList.reporterId": assignedReporter.reporterId
          },
          {
            $set: {
              "acceptRejectReporterList.$.postStatus": "rejected",
              "acceptRejectReporterList.$.rejectedAt": new Date(),
              "acceptRejectReporterList.$.adminRejectedBy": adminId,
              "acceptRejectReporterList.$.adminRejectedByName": adminName,
              "acceptRejectReporterList.$.rejectNote": `Advertisement marked as completed. ${rejectReason}.`
            }
          },
          { session }
        );

        completionResults.refundedReporters++;
        completionResults.totalRefundAmount += refundAmount;
        completionResults.refundDetails.push({
          reporterId: assignedReporter.reporterId,
          reporterName: reporterName,
          reporterEmail: reporterEmail,
          amount: refundAmount,
          reason: rejectReason
        });

        console.log(`💰 Will refund ₹${refundAmount} to advertiser for incomplete work by ${reporterName}`);

        completionResults.rejectedDetails.push({
          reporterId: assignedReporter.reporterId,
          reporterName: reporterName,
          reporterEmail: reporterEmail,
          reason: rejectReason
        });
      }
    }

    // ✅ ADDED: Handle Unfilled Slots (Reporters who never even accepted)
    const unfilledSlots = (advertisement.requiredReporter || 0) - requiredReporters.length;
    if (unfilledSlots > 0) {
      console.log(`⚠️ Handling ${unfilledSlots} unfilled slots (never accepted by any reporter)`);
      const unfilledRefundAmount = unfilledSlots * (advertisement.finalReporterPrice || 0);

      completionResults.refundedReporters += unfilledSlots;
      completionResults.totalRefundAmount += unfilledRefundAmount;
      completionResults.refundDetails.push({
        reporterId: null,
        reporterName: "N/A (Unfilled Slot)",
        amount: unfilledRefundAmount,
        reason: "No reporter accepted this slot within 24 hours"
      });

      console.log(`💰 Will refund extra ₹${unfilledRefundAmount} for ${unfilledSlots} unfilled slots`);
    }

    // Process refunds to advertiser wallet if any (only if admin chose to refund)
    let refundProcessed = false;
    if (completionResults.totalRefundAmount > 0 && shouldRefund) {
      try {
        console.log(`💰 Processing total refund of ₹${completionResults.totalRefundAmount} to advertiser`);

        // Find or create advertiser wallet
        let advertiserWallet = await Wallet.findOne({ userId: advertisement.owner._id });

        if (!advertiserWallet) {
          advertiserWallet = new Wallet({
            userId: advertisement.owner._id,
            userType: "Advertiser",
            balance: 0,
            transactions: []
          });
        }

        // Add refund transaction
        advertiserWallet.balance += completionResults.totalRefundAmount;
        advertiserWallet.transactions.push({
          type: "credit",
          amount: completionResults.totalRefundAmount,
          description: `Refund for incomplete work by ${completionResults.refundedReporters} reporter(s) in advertisement ${advertisement._id}`,
          date: new Date(),
          status: "success"
        });

        await advertiserWallet.save({ session });
        refundProcessed = true;

        console.log(`✅ Successfully refunded ₹${completionResults.totalRefundAmount} to advertiser wallet`);
        console.log(`💰 New wallet balance: ₹${advertiserWallet.balance}`);

      } catch (refundError) {
        console.error(`❌ Error processing refund to advertiser wallet:`, refundError);
        // Don't fail the entire operation if refund fails
      }
    } else if (completionResults.totalRefundAmount > 0 && !shouldRefund) {
      console.log(`⚠️ Refund skipped by admin choice (Amount: ₹${completionResults.totalRefundAmount})`);
    }

    // Mark advertisement as completed
    await Adpost.updateOne(
      { _id: adId },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          completedBy: adminId,
          completedByName: adminName,
          completionDetails: {
            totalReporters: completionResults.totalReporters,
            completedReporters: completionResults.completedReporters,
            rejectedReporters: completionResults.rejectedReporters,
            refundedReporters: completionResults.refundedReporters,
            totalRefundAmount: completionResults.totalRefundAmount,
            refundProcessed: refundProcessed,
            shouldRefund: shouldRefund,
            adminRefundDecision: shouldRefund ? "refund_processed" : "refund_skipped"
          }
        }
      },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    const response = {
      success: true,
      message: "Advertisement marked as completed successfully",
      data: {
        ...completionResults,
        refundProcessed: refundProcessed,
        shouldRefund: shouldRefund,
        refundSkipped: completionResults.totalRefundAmount > 0 && !shouldRefund ? {
          amount: completionResults.totalRefundAmount,
          reason: `Admin chose not to refund for incomplete work`,
          incompleteReporters: completionResults.refundedReporters,
          adminDecision: "no_refund"
        } : null,
        advertisement: {
          adId: advertisement._id,
          status: "completed",
          completedAt: new Date(),
          completedBy: adminId,
          completedByName: adminName
        }
      }
    };

    console.log("✅ Advertisement completion results:", {
      totalReporters: completionResults.totalReporters,
      completedReporters: completionResults.completedReporters,
      rejectedReporters: completionResults.rejectedReporters,
      refundedReporters: completionResults.refundedReporters,
      totalRefundAmount: completionResults.totalRefundAmount,
      refundProcessed: refundProcessed,
      shouldRefund: shouldRefund
    });

    // 📱 Send WhatsApp campaign completed notification [47campaign_completed]
    if (advertisement && advertisement.owner && advertisement.owner.mobile) {
      try {
        const notifyOnWhatsapp = require("../../../../utils/notifyOnWhatsapp");
        const Templates = require("../../../../utils/whatsappTemplates");
        await notifyOnWhatsapp(String(advertisement.owner.mobile), Templates.CAMPAIGN_COMPLETED, []);
        console.log(`📱 Sent WhatsApp campaign completed notification [47campaign_completed] to ${advertisement.owner.name} (${advertisement.owner.mobile})`);
      } catch (whatsappErr) {
        console.error("❌ Failed to send WhatsApp campaign completed notification:", whatsappErr.message);
      }
    }

    res.status(200).json(response);

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error marking advertisement as completed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

module.exports = markAdvertisementCompleted;
