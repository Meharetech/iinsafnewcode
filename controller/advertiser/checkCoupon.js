const Coupon = require("../../models/adminModels/genrateCoupon/createCoupon");

const checkCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const normalizedCode = String(couponCode).trim();

    // Use regex for case-insensitive status check or just find by code first
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon || String(coupon.status).toLowerCase() !== "active") {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive coupon",
      });
    }

    if (new Date(coupon.validUntil) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    // If usageLimit is 0 or null, it means unlimited
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit has been reached",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon is valid",
      data: coupon,
    });
  } catch (error) {
    console.error("Error in checkCoupon:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = checkCoupon;
