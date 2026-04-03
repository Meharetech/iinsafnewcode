const AdPricing = require("../../models/adminModels/advertismentPriceSet/adPricingSchema");

const getPricing = async (req, res) => {
  
  try {
    // Fetch the latest (or only) pricing document
    const pricing = await AdPricing.findOne();

    if (!pricing) {
      return res.status(200).json({
        success: true,
        message: "No ad pricing configuration found, using defaults",
        data: {
          adType: [],
          channelType: [],
          plateforms: [],
          gstRate: 0,
          perDayPrice: 0,
          perSecPrice: 0,
          perCityPrice: 0,
          baseView: 0,
          adCommission: 0,
          minimumWithdrawAmountForReporter: 0,
          reporterPrice: 0,
          paidConferenceCommission: 0,
          maxAdLength: 600,
          minAdLength: 5
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad pricing data fetched successfully",
      data: pricing,
    });
  } catch (error) {
    console.error("Error fetching ad pricing:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = getPricing;
