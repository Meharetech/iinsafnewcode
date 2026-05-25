const axios = require("axios");

const notifyOnWhatsapp = async (mobile, templateName, templateParams = [], mediaUrl = null) => {
  try {
    const apiKey = process.env.AISENSY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ AISENSY_API_KEY is not defined in environment variables. WhatsApp notification will not be sent.");
      return { success: false, message: "AiSensy API key missing" };
    }
    // Clean and normalize destination mobile number
    let cleanMobile = mobile.toString().replace(/\D/g, ''); // Keep digits only
    if (cleanMobile.length === 11 && cleanMobile.startsWith("0")) {
      cleanMobile = cleanMobile.substring(1);
    }
    if (cleanMobile.length === 10) {
      cleanMobile = "91" + cleanMobile;
    }
    const destination = cleanMobile;
    const userName = "iinsaf-new"; // ✅ Your AiSensy username
    const source = "iinsaf-platform"; // ✅ Adjust to your project name

    const payload = {
      apiKey,
      campaignName: templateName,   // ✅ Use dynamic template name
      destination,
      userName,
      source,
      templateParams,               // ✅ Pass dynamic variables
      media: mediaUrl
        ? {
            url: mediaUrl,
            filename: "media"
          }
        : {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {}
    };

    const response = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      payload
    );

    console.log(`✅ WhatsApp Notification sent [${templateName}] to ${mobile}`);
    return response.data;

  } catch (error) {
    console.error("❌ WhatsApp Error:", error?.response?.data || error.message);
  }
};

module.exports = notifyOnWhatsapp;
