const validateSubmitBid = (req, res, next) => {
  const { proposal, price, estimatedTime } = req.body;
  if (!proposal || typeof proposal !== "string") {
    return res.status(400).json({ success: false, message: "Proposal is required and must be a string" });
  }
  if (!price || isNaN(price) || Number(price) <= 0) {
    return res.status(400).json({ success: false, message: "Price is required and must be a positive number" });
  }
  if (!estimatedTime || typeof estimatedTime !== "string") {
    return res.status(400).json({ success: false, message: "Estimated time is required" });
  }
  next();
};

module.exports = {
  validateSubmitBid,
};
