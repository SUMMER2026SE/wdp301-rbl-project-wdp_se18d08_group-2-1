const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport");
const path = require("path");

require("dotenv").config();
require("./modules/auth/config/passport");

const app = express();

// Routes
const authRoutes = require("./modules/auth/routes/authRoutes");
const photographerRoutes = require("./modules/photographers/routes/photographerRoutes");
const adminRoutes = require("./modules/admin/routes/adminRoutes");

const favoritePhotographerRoutes = require("./modules/favorite_photographers/routes/favoritePhotographerRoutes");
const airecommendRoutes = require("./modules/airecomment/routes/airecommendRoutes");
const shootingCategoryRoutes = require("./modules/common/routes/shootingCategory.routes");
const styleTagRoutes = require("./modules/common/routes/styleTag.routes");
const packageRoutes = require("./modules/packages/routes/photographerPackage.routes");
const communityRoutes = require("./modules/community/community.routes");
const bookingRoutes = require("./modules/bookings/routes/booking.routes");
const reviewRoutes = require("./modules/review/routes/review.routes");
// Middlewares
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));

app.use(cors());

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(passport.initialize());

// Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Static files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/photographers", photographerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/photographer", photographerRoutes);
app.use("/api/favoritephotographers", favoritePhotographerRoutes);
app.use("/api/airecommend", airecommendRoutes);
app.use("/api/shooting-categories", shootingCategoryRoutes);
app.use("/api/style-tags", styleTagRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api", reviewRoutes);
app.use("/api/upload", require("./utils/upload.routes"));

// Health check
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Photo API running",
  });
});

module.exports = app;
