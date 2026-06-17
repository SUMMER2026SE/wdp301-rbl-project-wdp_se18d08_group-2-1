const validateJobFilter = (req, res, next) => {
  const { budget } = req.query;
  if (budget && isNaN(budget)) {
    return res.status(400).json({ success: false, message: "Budget must be a number" });
  }
  next();
};

module.exports = {
  validateJobFilter,
};
