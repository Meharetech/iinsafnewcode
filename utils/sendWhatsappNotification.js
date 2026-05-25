const axios = require("axios");

const sendWhatsappNotification = async (mobile, adTitle, adId) => {
  try {
    const apiKey = process.env.AISENSY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ AISENSY_API_KEY is not defined in environment variables. WhatsApp notification will not be sent.");
      return { success: false, message: "AiSensy API key missing" };
    }
    const campaignName = "lead_update";
    // Clean and normalize destination mobile number
    let cleanMobile = mobile.toString().replace(/\D/g, ''); // Keep digits only
    if (cleanMobile.length === 11 && cleanMobile.startsWith("0")) {
      cleanMobile = cleanMobile.substring(1);
    }
    if (cleanMobile.length === 10) {
      cleanMobile = "91" + cleanMobile;
    }
    const destination = cleanMobile;
    const userName = "iinsaf-new";
    const source = "new-landing-page form";

    const mediaUrl = "https://whatsapp-media-library.s3.ap-south-1.amazonaws.com/IMAGE/6353da2e153a147b991dd812/4958901_highanglekidcheatingschooltestmin.jpg";

    const payload = {
      apiKey,
      campaignName,
      destination,
      userName,
      source,
      templateParams: [],  // ✅ Fixed: No params
      media: {
        url: mediaUrl,
        filename: "sample_media"
      },
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {}
    };

    const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", payload);
    console.log("✅ WhatsApp Notification sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ WhatsApp Error:", error?.response?.data || error.message);
  }
};



module.exports =sendWhatsappNotification