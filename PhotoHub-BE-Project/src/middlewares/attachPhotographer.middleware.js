const Photographer = require("../modules/photographers/models/photographer");

const attachPhotographer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const photographer = await Photographer.findOne({
      user: req.user.id
    });

    if (!photographer) {
      return res.status(403).json({
        message: "User is not a photographer"
      });
    }

    req.photographer = photographer;

    next();
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

module.exports = attachPhotographer;