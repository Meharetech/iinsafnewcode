require('dotenv').config();
const notifyOnWhatsapp = require('./utils/notifyOnWhatsapp');
const Templates = require('./utils/whatsappTemplates');

const runTest = async () => {
  console.log("🚀 Starting WhatsApp API test...");
  console.log("Target Phone:", "918980837589");
  console.log("Using API Key:", process.env.AISENSY_API_KEY ? "Defined (present)" : "Undefined (missing)");

  try {
    // console.log(`\n1️⃣ Testing Reporter Registration: ${Templates.REPORTER_REGISTERED}`);
    // const resultReporter = await notifyOnWhatsapp("918980837589", Templates.REPORTER_REGISTERED, []);
    // console.log("📋 Reporter API Response:", resultReporter);

    // console.log(`\n2️⃣ Testing Influencer Registration: ${Templates.INFLUENCER_REGISTERED}`);
    // const resultInfluencer = await notifyOnWhatsapp("918980837589", Templates.INFLUENCER_REGISTERED, []);
    // console.log("📋 Influencer API Response:", resultInfluencer);

    // console.log(`\n3️⃣ Testing ID Card Submission: ${Templates.NOTIFY_TO_REPORTER_AFTER_SUCCESSFULLY_APPLY_ID_CARD}`);
    // const resultIdCard = await notifyOnWhatsapp("918980837589", Templates.NOTIFY_TO_REPORTER_AFTER_SUCCESSFULLY_APPLY_ID_CARD, []);
    // console.log("📋 ID Card Submission API Response:", resultIdCard);

    // console.log(`\n4️⃣ Testing ID Card Approved: ${Templates.AFTER_ID_CARD_APPROVED_NOTIFY_TO_REPORTER}`);
    // const resultIdApproved = await notifyOnWhatsapp("918980837589", Templates.AFTER_ID_CARD_APPROVED_NOTIFY_TO_REPORTER, []);
    // console.log("📋 ID Card Approved API Response:", resultIdApproved);

    console.log(`\n5️⃣ Testing ID Card Rejected: ${Templates.AFTER_ID_CARD_REJECTED_NOTIFY_TO_REPORTER}`);
    const resultIdRejected = await notifyOnWhatsapp("918980837589", Templates.AFTER_ID_CARD_REJECTED_NOTIFY_TO_REPORTER, []);
    console.log("📋 ID Card Rejected API Response:", resultIdRejected);

    console.log(`\n6️⃣ Testing Ad Assigned: ${Templates.ADS_ASSIGNED}`);
    const resultAdAssigned = await notifyOnWhatsapp("918980837589", Templates.ADS_ASSIGNED, ["500"]);
    console.log("📋 Ad Assigned API Response:", resultAdAssigned);

    console.log(`\n7️⃣ Testing Ad Accepted: ${Templates.ADS_ACCEPTED}`);
    const resultAdAccepted = await notifyOnWhatsapp("918980837589", Templates.ADS_ACCEPTED, []);
    console.log("📋 Ad Accepted API Response:", resultAdAccepted);

    console.log(`\n8️⃣ Testing Ad Proof Submitted: ${Templates.ADS_PROOF_SUBMITTED}`);
    const resultAdProofSubmitted = await notifyOnWhatsapp("918980837589", Templates.ADS_PROOF_SUBMITTED, []);
    console.log("📋 Ad Proof Submitted API Response:", resultAdProofSubmitted);

    console.log(`\n9️⃣ Testing Ad Proof Approved: ${Templates.ADS_PROOF_APPROVED}`);
    const resultAdProofApproved = await notifyOnWhatsapp("918980837589", Templates.ADS_PROOF_APPROVED, []);
    console.log("📋 Ad Proof Approved API Response:", resultAdProofApproved);

    console.log(`\n🔟 Testing Ad Proof Rejected: ${Templates.ADS_PROOF_REJECTED}`);
    const resultAdProofRejected = await notifyOnWhatsapp("918980837589", Templates.ADS_PROOF_REJECTED, []);
    console.log("📋 Ad Proof Rejected API Response:", resultAdProofRejected);

    console.log(`\n1️⃣1️⃣ Testing Ad Final Proof Submitted: ${Templates.ADS_FINAL_PROOF_SUBMITTED}`);
    const resultAdFinalProofSubmitted = await notifyOnWhatsapp("918980837589", Templates.ADS_FINAL_PROOF_SUBMITTED, []);
    console.log("📋 Ad Final Proof Submitted API Response:", resultAdFinalProofSubmitted);

    console.log(`\n1️⃣2️⃣ Testing Ad Final Proof Approved: ${Templates.ADS_FINAL_PROOF_APPROVED}`);
    const resultAdFinalProofApproved = await notifyOnWhatsapp("918980837589", Templates.ADS_FINAL_PROOF_APPROVED, ["500"]);
    console.log("📋 Ad Final Proof Approved API Response:", resultAdFinalProofApproved);

    console.log(`\n1️⃣3️⃣ Testing Password Reset Request: ${Templates.PASSWORD_RESET_REQUEST}`);
    const resultPasswordResetRequest = await notifyOnWhatsapp("918980837589", Templates.PASSWORD_RESET_REQUEST, []);
    console.log("📋 Password Reset Request API Response:", resultPasswordResetRequest);

    console.log(`\n1️⃣4️⃣ Testing Password Changed: ${Templates.PASSWORD_CHANGED}`);
    const resultPasswordChanged = await notifyOnWhatsapp("918980837589", Templates.PASSWORD_CHANGED, []);
    console.log("📋 Password Changed API Response:", resultPasswordChanged);

    console.log(`\n1️⃣5️⃣ Testing Rise Your Voice Registered: ${Templates.RYV_REGISTERED}`);
    const resultRyvRegistered = await notifyOnWhatsapp("918980837589", Templates.RYV_REGISTERED, []);
    console.log("📋 Rise Your Voice Registered API Response:", resultRyvRegistered);

    console.log(`\n1️⃣6️⃣ Testing Rise Your Voice Created: ${Templates.RYV_CREATED}`);
    const resultRyvCreated = await notifyOnWhatsapp("918980837589", Templates.RYV_CREATED, []);
    console.log("📋 Rise Your Voice Created API Response:", resultRyvCreated);

    console.log(`\n1️⃣7️⃣ Testing Rise Your Voice Approved: ${Templates.RYV_APPROVED}`);
    const resultRyvApproved = await notifyOnWhatsapp("918980837589", Templates.RYV_APPROVED, []);
    console.log("📋 Rise Your Voice Approved API Response:", resultRyvApproved);

    console.log(`\n1️⃣8️⃣ Testing Rise Your Voice Rejected: ${Templates.RYV_REJECTED}`);
    const resultRyvRejected = await notifyOnWhatsapp("918980837589", Templates.RYV_REJECTED, []);
    console.log("📋 Rise Your Voice Rejected API Response:", resultRyvRejected);

    console.log(`\n1️⃣9️⃣ Testing Rise Your Voice Completed: ${Templates.RYV_COMPLETED}`);
    const resultRyvCompleted = await notifyOnWhatsapp("918980837589", Templates.RYV_COMPLETED, []);
    console.log("📋 Rise Your Voice Completed API Response:", resultRyvCompleted);

    console.log(`\n2️⃣0️⃣ Testing Press Conference Registered: ${Templates.PRESS_CONF_REGISTERED}`);
    const resultPressConfRegistered = await notifyOnWhatsapp("918980837589", Templates.PRESS_CONF_REGISTERED, []);
    console.log("📋 Press Conference Registered API Response:", resultPressConfRegistered);

    console.log(`\n2️⃣1️⃣ Testing Free Press Created: ${Templates.FREE_PRESS_CREATED}`);
    const resultFreePressCreated = await notifyOnWhatsapp("918980837589", Templates.FREE_PRESS_CREATED, []);
    console.log("📋 Free Press Created API Response:", resultFreePressCreated);

    console.log(`\n2️⃣2️⃣ Testing Paid Press Created: ${Templates.PAID_PRESS_CREATED}`);
    const resultPaidPressCreated = await notifyOnWhatsapp("918980837589", Templates.PAID_PRESS_CREATED, []);
    console.log("📋 Paid Press Created API Response:", resultPaidPressCreated);

    console.log(`\n2️⃣3️⃣ Testing Paid Press Payment Success: ${Templates.PAID_PRESS_PAYMENT_SUCCESS}`);
    const resultPaidPressPaymentSuccess = await notifyOnWhatsapp("918980837589", Templates.PAID_PRESS_PAYMENT_SUCCESS, ["999"]);
    console.log("📋 Paid Press Payment Success API Response:", resultPaidPressPaymentSuccess);

    console.log(`\n2️⃣4️⃣ Testing Free Press Approved: ${Templates.FREE_PRESS_APPROVED}`);
    const resultFreePressApproved = await notifyOnWhatsapp("918980837589", Templates.FREE_PRESS_APPROVED, []);
    console.log("📋 Free Press Approved API Response:", resultFreePressApproved);

    console.log(`\n2️⃣5️⃣ Testing Free Press Rejected: ${Templates.FREE_PRESS_REJECTED}`);
    const resultFreePressRejected = await notifyOnWhatsapp("918980837589", Templates.FREE_PRESS_REJECTED, []);
    console.log("📋 Free Press Rejected API Response:", resultFreePressRejected);

    console.log(`\n2️⃣6️⃣ Testing Free Press Completed: ${Templates.FREE_PRESS_COMPLETED}`);
    const resultFreePressCompleted = await notifyOnWhatsapp("918980837589", Templates.FREE_PRESS_COMPLETED, []);
    console.log("📋 Free Press Completed API Response:", resultFreePressCompleted);

    console.log(`\n2️⃣7️⃣ Testing Paid Press Approved: ${Templates.PAID_PRESS_APPROVED}`);
    const resultPaidPressApproved = await notifyOnWhatsapp("918980837589", Templates.PAID_PRESS_APPROVED, []);
    console.log("📋 Paid Press Approved API Response:", resultPaidPressApproved);

    console.log(`\n2️⃣8️⃣ Testing Paid Press Rejected: ${Templates.PAID_PRESS_REJECTED}`);
    const resultPaidPressRejected = await notifyOnWhatsapp("918980837589", Templates.PAID_PRESS_REJECTED, []);
    console.log("📋 Paid Press Rejected API Response:", resultPaidPressRejected);

    console.log(`\n2️⃣9️⃣ Testing Paid Press Completed: ${Templates.PAID_PRESS_COMPLETED}`);
    const resultPaidPressCompleted = await notifyOnWhatsapp("918980837589", Templates.PAID_PRESS_COMPLETED, []);
    console.log("📋 Paid Press Completed API Response:", resultPaidPressCompleted);

    console.log(`\n3️⃣0️⃣ Testing Podcast Registered: ${Templates.PODCAST_REGISTERED}`);
    const resultPodcastRegistered = await notifyOnWhatsapp("918980837589", Templates.PODCAST_REGISTERED, []);
    console.log("📋 Podcast Registered API Response:", resultPodcastRegistered);

    console.log(`\n3️⃣1️⃣ Testing Podcast Booking Created: ${Templates.PODCAST_BOOKING_CREATED}`);
    const resultPodcastBookingCreated = await notifyOnWhatsapp("918980837589", Templates.PODCAST_BOOKING_CREATED, []);
    console.log("📋 Podcast Booking Created API Response:", resultPodcastBookingCreated);

    console.log(`\n3️⃣2️⃣ Testing Podcast Episode Created: ${Templates.PODCAST_EPISODE_CREATED}`);
    const resultPodcastEpisodeCreated = await notifyOnWhatsapp("918980837589", Templates.PODCAST_EPISODE_CREATED, []);
    console.log("📋 Podcast Episode Created API Response:", resultPodcastEpisodeCreated);

    console.log(`\n3️⃣3️⃣ Testing Podcast Episode Approved: ${Templates.PODCAST_EPISODE_APPROVED}`);
    const resultPodcastEpisodeApproved = await notifyOnWhatsapp("918980837589", Templates.PODCAST_EPISODE_APPROVED, []);
    console.log("📋 Podcast Episode Approved API Response:", resultPodcastEpisodeApproved);

    console.log(`\n3️⃣4️⃣ Testing Podcast Episode Rejected: ${Templates.PODCAST_EPISODE_REJECTED}`);
    const resultPodcastEpisodeRejected = await notifyOnWhatsapp("918980837589", Templates.PODCAST_EPISODE_REJECTED, []);
    console.log("📋 Podcast Episode Rejected API Response:", resultPodcastEpisodeRejected);

    console.log(`\n3️⃣5️⃣ Testing Reward Task Assigned: ${Templates.REWARD_TASK_ASSIGNED}`);
    const resultRewardTaskAssigned = await notifyOnWhatsapp("918980837589", Templates.REWARD_TASK_ASSIGNED, []);
    console.log("📋 Reward Task Assigned API Response:", resultRewardTaskAssigned);

    console.log(`\n3️⃣6️⃣ Testing Reward Task Completed: ${Templates.REWARD_TASK_COMPLETED}`);
    const resultRewardTaskCompleted = await notifyOnWhatsapp("918980837589", Templates.REWARD_TASK_COMPLETED, []);
    console.log("📋 Reward Task Completed API Response:", resultRewardTaskCompleted);

    console.log(`\n3️⃣7️⃣ Testing Free Conference Invite: ${Templates.FREE_CONF_INVITE}`);
    const resultFreeConfInvite = await notifyOnWhatsapp("918980837589", Templates.FREE_CONF_INVITE, []);
    console.log("📋 Free Conference Invite API Response:", resultFreeConfInvite);

    console.log(`\n3️⃣8️⃣ Testing Paid Conference Invite: ${Templates.PAID_CONF_INVITE}`);
    const resultPaidConfInvite = await notifyOnWhatsapp("918980837589", Templates.PAID_CONF_INVITE, ["150"]);
    console.log("📋 Paid Conference Invite API Response:", resultPaidConfInvite);

    console.log(`\n3️⃣9️⃣ Testing Free Conference Accepted: ${Templates.FREE_CONF_ACCEPTED}`);
    const resultFreeConfAccepted = await notifyOnWhatsapp("918980837589", Templates.FREE_CONF_ACCEPTED, []);
    console.log("📋 Free Conference Accepted API Response:", resultFreeConfAccepted);

    console.log(`\n4️⃣0️⃣ Testing Free Conference Completed (Reporter): ${Templates.FREE_CONF_COMPLETED_REPORTER}`);
    const resultFreeConfCompleted = await notifyOnWhatsapp("918980837589", Templates.FREE_CONF_COMPLETED_REPORTER, []);
    console.log("📋 Free Conference Completed (Reporter) API Response:", resultFreeConfCompleted);

    console.log(`\n4️⃣1️⃣ Testing Paid Conference Accepted: ${Templates.PAID_CONF_ACCEPTED}`);
    const resultPaidConfAccepted = await notifyOnWhatsapp("918980837589", Templates.PAID_CONF_ACCEPTED, ["200"]);
    console.log("📋 Paid Conference Accepted API Response:", resultPaidConfAccepted);

    console.log(`\n4️⃣2️⃣ Testing Paid Conference Completed (Reporter): ${Templates.PAID_CONF_COMPLETED_REPORTER}`);
    const resultPaidConfCompletedReporter = await notifyOnWhatsapp("918980837589", Templates.PAID_CONF_COMPLETED_REPORTER, ["300"]);
    console.log("📋 Paid Conference Completed (Reporter) API Response:", resultPaidConfCompletedReporter);

    console.log(`\n4️⃣3️⃣ Testing Wallet Recharged: ${Templates.WALLET_RECHARGED}`);
    const resultWalletRecharged = await notifyOnWhatsapp("918980837589", Templates.WALLET_RECHARGED, ["500"]);
    console.log("📋 Wallet Recharged API Response:", resultWalletRecharged);

    console.log(`\n4️⃣4️⃣ Testing Withdraw Success: ${Templates.WITHDRAW_SUCCESS}`);
    const resultWithdrawSuccess = await notifyOnWhatsapp("918980837589", Templates.WITHDRAW_SUCCESS, ["1000"]);
    console.log("📋 Withdraw Success API Response:", resultWithdrawSuccess);

    console.log(`\n4️⃣5️⃣ Testing Withdraw Rejected: ${Templates.WITHDRAW_REJECTED}`);
    const resultWithdrawRejected = await notifyOnWhatsapp("918980837589", Templates.WITHDRAW_REJECTED, ["1000"]);
    console.log("📋 Withdraw Rejected API Response:", resultWithdrawRejected);

    console.log(`\n4️⃣6️⃣ Testing IINSAF Ads Login: ${Templates.IINSAF_ADS_LOGIN}`);
    const resultIinsafAdsLogin = await notifyOnWhatsapp("918980837589", Templates.IINSAF_ADS_LOGIN, ["Amandeep"]);
    console.log("📋 IINSAF Ads Login API Response:", resultIinsafAdsLogin);

    console.log(`\n4️⃣7️⃣ Testing Campaign Launched: ${Templates.CAMPAIGN_LAUNCHED}`);
    const resultCampaignLaunched = await notifyOnWhatsapp("918980837589", Templates.CAMPAIGN_LAUNCHED, []);
    console.log("📋 Campaign Launched API Response:", resultCampaignLaunched);

    console.log(`\n4️⃣8️⃣ Testing Campaign Approved: ${Templates.CAMPAIGN_APPROVED}`);
    const resultCampaignApproved = await notifyOnWhatsapp("918980837589", Templates.CAMPAIGN_APPROVED, []);
    console.log("📋 Campaign Approved API Response:", resultCampaignApproved);

    console.log(`\n4️⃣9️⃣ Testing Campaign Rejected: ${Templates.CAMPAIGN_REJECTED}`);
    const resultCampaignRejected = await notifyOnWhatsapp("918980837589", Templates.CAMPAIGN_REJECTED, []);
    console.log("📋 Campaign Rejected API Response:", resultCampaignRejected);

    console.log(`\n5️⃣0️⃣ Testing Campaign Completed: ${Templates.CAMPAIGN_COMPLETED}`);
    const resultCampaignCompleted = await notifyOnWhatsapp("918980837589", Templates.CAMPAIGN_COMPLETED, []);
    console.log("📋 Campaign Completed API Response:", resultCampaignCompleted);

    console.log(`\n5️⃣1️⃣ Testing Advocate Registered: ${Templates.ADVOCATE_REGISTERED}`);
    const resultAdvocateRegistered = await notifyOnWhatsapp("918980837589", Templates.ADVOCATE_REGISTERED, []);
    console.log("📋 Advocate Registered API Response:", resultAdvocateRegistered);

    console.log(`\n5️⃣2️⃣ Testing Advocate Rejected: ${Templates.ADVOCATE_REJECTED}`);
    const resultAdvocateRejected = await notifyOnWhatsapp("918980837589", Templates.ADVOCATE_REJECTED, []);
    console.log("📋 Advocate Rejected API Response:", resultAdvocateRejected);

    console.log(`\n5️⃣3️⃣ Testing Wallet Credit Success: ${Templates.WALLET_CREDIT_SUCCESS}`);
    const resultWalletCreditSuccess = await notifyOnWhatsapp("918980837589", Templates.WALLET_CREDIT_SUCCESS, ["500"]);
    console.log("📋 Wallet Credit Success API Response:", resultWalletCreditSuccess);
  } catch (error) {
    console.error("❌ Test script error:", error.message);
  }
};

runTest();
