const axios = require("axios");

const sendWhatsappOtp = async (mobile, otp, userName) => {
  try {
    const apiKey = process.env.AISENSY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ AISENSY_API_KEY is not defined in environment variables. WhatsApp OTP will not be sent.");
      return { success: false, message: "AiSensy API key missing" };
    }

    // Clean and validate userName
    let cleanUserName = userName ? userName.trim() : "User";
    if (!cleanUserName || cleanUserName.length === 0 || cleanUserName.trim().length === 0) {
      console.warn("Invalid userName format, using fallback:", userName);
      cleanUserName = "User";
    }

    // In AiSensy, template parameters (including dynamic button values) 
    // are passed sequentially inside the templateParams array.
    // We pass both body and button params here.
    // Clean and normalize destination mobile number
    let cleanMobile = mobile.toString().replace(/\D/g, ''); // Keep digits only
    if (cleanMobile.length === 11 && cleanMobile.startsWith("0")) {
      cleanMobile = cleanMobile.substring(1);
    }
    if (cleanMobile.length === 10) {
      cleanMobile = "91" + cleanMobile;
    }
    const destination = cleanMobile;

    const payload = {
      apiKey,
      campaignName: "copy_otp",
      destination,
      userName: cleanUserName,
      templateParams: [`${otp}`, `${otp}`], // Pass otp for body and button parameters sequentially
      source: "iinsaf-platform",
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: { FirstName: cleanUserName }
    };

    const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", payload);
    return response.data;
  } catch (error) {
    console.error("Error sending WhatsApp OTP:", error?.response?.data || error.message);
    throw new Error("Failed to send WhatsApp OTP");
  }
};

module.exports = sendWhatsappOtp;
