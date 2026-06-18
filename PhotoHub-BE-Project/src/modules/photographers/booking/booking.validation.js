const validateRejectBooking = (req, res, next) => {
  const { reason } = req.body;
  if (reason && typeof reason !== "string") {
    return res.status(400).json({ success: false, message: "Reason must be a string" });
  }
  next();
};

module.exports = {
  validateRejectBooking,
};
