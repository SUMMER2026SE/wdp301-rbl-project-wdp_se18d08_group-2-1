const validateUploadAlbum = (req, res, next) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ success: false, message: "bookingId is required" });
  }
  next();
};

module.exports = {
  validateUploadAlbum,
};
