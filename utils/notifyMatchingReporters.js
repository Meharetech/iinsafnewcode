const sendEmail = require('../utils/sendEmail');
const sendWhatsappNotification = require('../utils/sendWhatsappNotification');
const User = require('../models/userModel/userModel');
const RaiseYourVoiceProof = require('../models/raiseYourVoicePost/raiseYourVoiceProofSubmit');
const RaiseYourVoiceInfluencerProof = require('../models/raiseYourVoicePost/raiseYourVoiceInfluencerProofSubmit');

const notifyMatchingReporters = async (ad) => {
  try {
    console.log("🔍 NOTIFY MATCHING REPORTERS DEBUG START");
    console.log("Ad data for sending notification:", JSON.stringify(ad, null, 2));

    // Step 1: Find users based on ad's target userType
    let targetRoles = [];
    const userType = ad.userType || ad.targetUserType;

    if (userType === 'influencer') {
      targetRoles = ['Influencer'];
    } else if (userType === 'both') {
      targetRoles = ['Reporter', 'Influencer'];
    } else {
      targetRoles = ['Reporter']; // default
    }

    // Find users with proper verification status
    let users = [];
    for (const role of targetRoles) {
      if (role === "Reporter") {
        const reporters = await User.find({ role: "Reporter", verifiedReporter: true });
        console.log(`🔍 Found ${reporters.length} verified reporters`);
        users = users.concat(reporters);
      } else if (role === "Influencer") {
        const influencers = await User.find({ role: "Influencer", isVerified: true });
        console.log(`🔍 Found ${influencers.length} verified influencers`);
        users = users.concat(influencers);
      }
    }
    console.log(`All users with roles ${targetRoles.join(', ')}:`, users.length);
    console.log(`🔍 DEBUG: Found users:`, users.map(u => ({ name: u.name, role: u.role, id: u._id, state: u.state, city: u.city })));

    let matchedUsers = [];

    // 🔹 1st Preference: Specific user IDs (works for both reporters and influencers)
    let specificUserIds = [];

    console.log(`🔍 DEBUG: Checking ad fields for specific user IDs`);
    console.log(`🔍 ad.reportersIds:`, ad.reportersIds);
    console.log(`🔍 ad.influencersIds:`, ad.influencersIds);
    console.log(`🔍 ad.reporterId:`, ad.reporterId);
    console.log(`🔍 ad.selectedReporters:`, ad.selectedReporters);

    // For free ads, check reportersIds and influencersIds
    if (ad.reportersIds && Array.isArray(ad.reportersIds) && ad.reportersIds.length > 0) {
      specificUserIds = specificUserIds.concat(ad.reportersIds);
      console.log(`📊 Found ${ad.reportersIds.length} reporter IDs in ad.reportersIds`);
    }
    if (ad.influencersIds && Array.isArray(ad.influencersIds) && ad.influencersIds.length > 0) {
      specificUserIds = specificUserIds.concat(ad.influencersIds);
      console.log(`📊 Found ${ad.influencersIds.length} influencer IDs in ad.influencersIds`);
    }

    // For other ad types, check reporterId
    if (Array.isArray(ad.reporterId) && ad.reporterId.length > 0) {
      specificUserIds = specificUserIds.concat(ad.reporterId);
      console.log(`📊 Found ${ad.reporterId.length} user IDs in ad.reporterId`);
    }

    console.log(`📊 Total specific user IDs found: ${specificUserIds.length}`);
    console.log(`📊 Specific user IDs:`, specificUserIds);

    if (specificUserIds.length > 0) {
      matchedUsers = users.filter(u => {
        const userIdString = String(u._id);
        const isMatched = specificUserIds.some(id => String(id) === userIdString);
        console.log(`🔍 Checking user ${u.name} (${u.role}): ID=${userIdString}, Matched=${isMatched}`);
        return isMatched;
      });
      console.log(`✅ Matched by specific user IDs: ${matchedUsers.length} users`);
      console.log(`📊 Matched users:`, matchedUsers.map(u => ({ name: u.name, role: u.role, id: u._id })));

      // 🔹 2nd Preference: Admin State/City targeting (works for both free ads and other ad types)
    } else if (
      (Array.isArray(ad.adminSelectState) && ad.adminSelectState.length > 0) ||
      (Array.isArray(ad.adminSelectCities) && ad.adminSelectCities.length > 0)
    ) {
      console.log(`🔍 Using admin state/city targeting`);
      console.log(`📊 Available users for matching: ${users.length}`);
      console.log(`📊 Users by role:`, {
        reporters: users.filter(u => u.role === 'Reporter').length,
        influencers: users.filter(u => u.role === 'Influencer').length
      });

      matchedUsers = users.filter(u => {
        // Get state and city arrays from admin targeting
        const states = ad.adminSelectState || [];
        const cities = ad.adminSelectCities || [];

        console.log(`🔍 Checking user ${u.name} (${u.role}): state=${u.state}, city=${u.city}`);
        console.log(`🔍 Target states: ${JSON.stringify(states)}, Target cities: ${JSON.stringify(cities)}`);

        // If both states and cities are selected, user must match BOTH
        if (Array.isArray(states) && states.length > 0 &&
          Array.isArray(cities) && cities.length > 0) {
          const stateMatch = states.includes(u.state);
          const cityMatch = cities.includes(u.city);
          console.log(`User ${u.name} (${u.state}, ${u.city}): State match: ${stateMatch}, City match: ${cityMatch}`);
          return stateMatch && cityMatch;
        }
        // If only states are selected, match by state
        else if (Array.isArray(states) && states.length > 0) {
          const stateMatch = states.includes(u.state);
          console.log(`User ${u.name} (${u.state}): State match: ${stateMatch}`);
          return stateMatch;
        }
        // If only cities are selected, match by city
        else if (Array.isArray(cities) && cities.length > 0) {
          const cityMatch = cities.includes(u.city);
          console.log(`User ${u.name} (${u.city}): City match: ${cityMatch}`);
          return cityMatch;
        }
        return false;
      });
      console.log(`✅ Matched by admin state/city targeting: ${matchedUsers.length} users`);
      console.log("Selected states:", ad.adminSelectState);
      console.log("Selected cities:", ad.adminSelectCities);
      console.log("Matched users details:", matchedUsers.map(u => ({ name: u.name, role: u.role, state: u.state, city: u.city })));

      // 🔹 3rd Preference: allStates/allState (works for both free ads and other ad types)
    } else if (ad.allStates === true || ad.allState === true) {
      matchedUsers = users;
      console.log("Matched by allStates/allState:", matchedUsers.length);

      // 🔹 4th Preference: pfState / pfCities (preference targeting)
    } else if (ad.pfState || (Array.isArray(ad.pfCities) && ad.pfCities.length > 0)) {
      console.log(`🔍 Using preference state/city targeting`);
      console.log(`📊 Available users for matching: ${users.length}`);

      matchedUsers = users.filter(u => {
        let stateMatch = false;
        let cityMatch = false;

        // Check state match
        if (ad.pfState) {
          stateMatch = u.state === ad.pfState;
          console.log(`User ${u.name} (${u.state}): State match with ${ad.pfState}: ${stateMatch}`);
        }

        // Check city match
        if (Array.isArray(ad.pfCities) && ad.pfCities.length > 0) {
          cityMatch = ad.pfCities.includes(u.city);
          console.log(`User ${u.name} (${u.city}): City match with ${JSON.stringify(ad.pfCities)}: ${cityMatch}`);
        }

        // If both state and cities are specified, user must match BOTH
        if (ad.pfState && Array.isArray(ad.pfCities) && ad.pfCities.length > 0) {
          return stateMatch && cityMatch;
        }
        // If only state is specified, match by state
        else if (ad.pfState) {
          return stateMatch;
        }
        // If only cities are specified, match by city
        else if (Array.isArray(ad.pfCities) && ad.pfCities.length > 0) {
          return cityMatch;
        }

        return false;
      });
      console.log(`✅ Matched by preference targeting: ${matchedUsers.length} users`);
      console.log("Preference state:", ad.pfState);
      console.log("Preference cities:", ad.pfCities);
      console.log("Matched users details:", matchedUsers.map(u => ({ name: u.name, role: u.role, state: u.state, city: u.city })));

      // 🔹 5th Preference: Default Raise Your Voice targeting (Creator's city/state)
      // Only applies if state/city are strings (Raise Your Voice posts)
    } else if (typeof ad.state === 'string' && typeof ad.city === 'string' &&
      (ad.allStates === false || ad.allState === false)) {
      console.log(`🔍 Defaulting to Raise Your Voice creator's location: ${ad.state}, ${ad.city}`);
      matchedUsers = users.filter(u => u.state === ad.state && u.city === ad.city);
      console.log(`✅ Matched by creator's location: ${matchedUsers.length} users`);

      // 🔹 6th Preference: No targeting - show to all users
    } else {
      matchedUsers = users;
      console.log("No specific targeting found, showing to all users:", matchedUsers.length);
    }

    // 🚫 Stop if no users matched
    if (!matchedUsers || matchedUsers.length === 0) {
      console.log(`⚠️ No matched ${targetRoles.length > 1 ? 'users' : targetRoles[0].toLowerCase()}s, no notifications sent.`);
      return;
    }

    // Step 3: Send notifications
    let message, subject, description;

    if (ad.type === "free-conference") {
      message = `🎤 New Free Conference: "${ad.topic || 'Untitled Conference'}"`;
      subject = "Free Conference Notification";
      description = ad.topic || 'New Free Conference';
    } else if (ad.type === "paid-conference") {
      message = `🎤 New Paid Conference: "${ad.topic || 'Untitled Conference'}"`;
      subject = "Paid Conference Notification";
      description = ad.topic || 'New Paid Conference';
    } else {
      message = `📰 New Ad Approved: "${ad.mediaDescription || 'Untitled'}"`;
      subject = "Ad Notification";
      description = ad.mediaDescription || 'New Ad';
    }

    // Create response records and send notifications
    for (const user of matchedUsers) {
      try {
        if (ad.type === "free-conference") {
          // Send WhatsApp notification for Free Conference invitation [34free_conf_invite]
          if (user.mobile) {
            try {
              const notifyOnWhatsapp = require('./notifyOnWhatsapp');
              const Templates = require('./whatsappTemplates');
              await notifyOnWhatsapp(user.mobile, Templates.FREE_CONF_INVITE, []);
              console.log(`📱 Sent WhatsApp notification [34free_conf_invite] to ${user.name} (${user.mobile})`);
            } catch (whatsappErr) {
              console.error(`❌ Failed to send WhatsApp free conference invitation to ${user.name}:`, whatsappErr.message);
            }
          }
          if (user.email) {
            await sendEmail(user.email, subject, message);
          }
        } else if (ad.type === "paid-conference") {
          // Send WhatsApp notification for Paid Conference invitation [37paid_conf_invite]
          if (user.mobile) {
            try {
              const notifyOnWhatsapp = require('./notifyOnWhatsapp');
              const Templates = require('./whatsappTemplates');
              const amount = String(ad.amountPerReporter || 0);
              await notifyOnWhatsapp(user.mobile, Templates.PAID_CONF_INVITE, [amount]);
              console.log(`📱 Sent WhatsApp notification [37paid_conf_invite] to ${user.name} (${user.mobile}) with amount ₹${amount}`);
            } catch (whatsappErr) {
              console.error(`❌ Failed to send WhatsApp paid conference invitation to ${user.name}:`, whatsappErr.message);
            }
          }
          if (user.email) {
            await sendEmail(user.email, subject, message);
          }
        } else {
          // Check if this is an advertisement (Adpost model), free ad (freeAdModel), or Raise Your Voice
          const Adpost = require('../models/advertismentPost/advertisementPost');
          const freeAdModel = require('../models/adminModels/freeAds/freeAdsSchema');

          const isPaidAdvertisement = await Adpost.findById(ad._id);
          const isFreeAd = await freeAdModel.findById(ad._id);

        if (isPaidAdvertisement) {
          // This is a paid advertisement - add to acceptRejectReporterList
          console.log(`📝 Adding user to paid advertisement acceptRejectReporterList: ${user.name} (${user.iinsafId})`);

          // Check if user already exists in the list
          const existingEntry = isPaidAdvertisement.acceptRejectReporterList.find(
            entry => entry.reporterId.toString() === user._id.toString()
          );

          if (!existingEntry) {
            // Add new entry to acceptRejectReporterList
            isPaidAdvertisement.acceptRejectReporterList.push({
              reporterId: user._id,
              iinsafId: user.iinsafId,
              postStatus: "pending", // pending means not yet responded
              accepted: false,
              adProof: false,
              rejectNote: "",
              userRole: user.role === "influencer" ? "Influencer" : "Reporter"
            });
            await isPaidAdvertisement.save();
            console.log(`📝 Added user to paid advertisement acceptRejectReporterList: ${user.name} (${user.iinsafId})`);

            // Send WhatsApp notification for newly assigned paid ad
            if (user.mobile) {
              const adWorth = isPaidAdvertisement.finalReporterPrice || 0;
              try {
                const notifyOnWhatsapp = require('./notifyOnWhatsapp');
                const Templates = require('./whatsappTemplates');
                await notifyOnWhatsapp(
                  user.mobile,
                  Templates.ADS_ASSIGNED,
                  [String(adWorth)] // Pass the ad worth/budget as the parameter {{1}}
                );
                console.log(`📱 Sent WhatsApp notification [25ads_assigned] to ${user.name} (${user.mobile}) for ad worth ₹${adWorth}`);
              } catch (whatsappErr) {
                console.error(`❌ Failed to send WhatsApp notification to ${user.name}:`, whatsappErr.message);
              }
            }
          } else {
            console.log(`📝 User already exists in paid advertisement acceptRejectReporterList: ${user.name} (${user.iinsafId})`);
          }
        } else if (isFreeAd) {
          // This is a free ad - add to acceptedReporters array
          console.log(`📝 Processing user for free ad: ${user.name} (${user.iinsafId})`);
          console.log(`🔍 Free ad current acceptedReporters count: ${isFreeAd.acceptedReporters.length}`);

          // Check if user already exists in the list
          const existingEntry = isFreeAd.acceptedReporters.find(
            entry => entry.reporterId.toString() === user._id.toString()
          );

          console.log(`🔍 Existing entry found: ${existingEntry ? 'YES' : 'NO'}`);

          if (!existingEntry) {
            // Add new entry to acceptedReporters
            isFreeAd.acceptedReporters.push({
              reporterId: user._id,
              iinsafId: user.iinsafId,
              postStatus: "pending", // pending means not yet responded
              adProof: false
            });
            await isFreeAd.save();
            console.log(`📝 Added NEW user to free ad acceptedReporters: ${user.name} (${user.iinsafId})`);
            console.log(`🔍 Free ad acceptedReporters count after save: ${isFreeAd.acceptedReporters.length}`);

            // 🔑 CRITICAL FIX: Only send notifications to NEW users
            console.log(`📧 Sending notifications to NEW user: ${user.name} (${user.iinsafId})`);

            // Send notifications
            if (user.email) {
              console.log(`📧 Sending email to: ${user.email}`);
              await sendEmail(user.email, subject, message);
            }
            if (user.mobile) {
              try {
                const notifyOnWhatsapp = require('./notifyOnWhatsapp');
                const Templates = require('./whatsappTemplates');
                await notifyOnWhatsapp(user.mobile, Templates.REWARD_TASK_ASSIGNED, []);
                console.log(`📱 Sent WhatsApp notification [32reward_task_assigned] to ${user.name} (${user.mobile})`);
              } catch (whatsappErr) {
                console.error(`❌ Failed to send WhatsApp notification to ${user.name}:`, whatsappErr.message);
              }
            }
          } else {
            // User already exists - preserve their existing record and SKIP notifications
            console.log(`📝 User already exists in free ad acceptedReporters: ${user.name} (${user.iinsafId}) - SKIPPING notifications`);
            console.log(`🔍 Existing record status: ${existingEntry.postStatus}`);
            console.log(`🚫 NOT sending notifications to existing user: ${user.name}`);
          }
        } else {
          // This is Raise Your Voice - use the existing logic
          if (user.role === "Reporter") {
            // Create or update reporter response record
            await RaiseYourVoiceProof.findOneAndUpdate(
              { adId: ad._id, reporterId: user._id },
              {
                adId: ad._id,
                reporterId: user._id,
                iinsafId: user.iinsafId,
                status: "pending",
                proof: false,
                submittedAt: new Date()
              },
              { upsert: true, new: true }
            );
            console.log(`📝 Created/updated reporter response record for: ${user.name} (${user.iinsafId})`);
          } else if (user.role === "Influencer") {
            // Create or update influencer response record
            await RaiseYourVoiceInfluencerProof.findOneAndUpdate(
              { adId: ad._id, influencerId: user._id },
              {
                adId: ad._id,
                influencerId: user._id,
                iinsafId: user.iinsafId,
                status: "pending",
                proof: false,
                submittedAt: new Date()
              },
              { upsert: true, new: true }
            );
            console.log(`📝 Created/updated influencer response record for: ${user.name} (${user.iinsafId})`);
          }
        }
      }
    } catch (userError) {
      console.error(`❌ Error processing user ${user.name}:`, userError);
      // Continue with other users even if one fails
    }
    }

    console.log(`✅ Notifications sent and response records created for ${matchedUsers.length} ${targetRoles.length > 1 ? 'users' : targetRoles[0].toLowerCase()}s.`);

  } catch (err) {
    console.error("Error notifying reporters:", err.message);
  }
};

module.exports = notifyMatchingReporters;
