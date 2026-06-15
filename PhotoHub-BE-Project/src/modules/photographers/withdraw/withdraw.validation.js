const validateWithdrawRequest = (req, res, next) => {
  const { amount, bankInfo } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be a positive number" });
  }
  if (!bankInfo || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
    return res.status(400).json({ success: false, message: "Bank info (bankName, accountNumber, accountName) is required" });
  }
  next();
};

module.exports = {
  validateWithdrawRequest,
};
