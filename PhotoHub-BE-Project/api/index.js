require("dotenv").config();

const app = require("../src/app");
const { connectMongo } = require("../src/mongo");

let initialized = false;

module.exports = async (req, res) => {
  try {

    if (!initialized) {
      await connectMongo();
      console.log("Database connected (Vercel)");

      initialized = true;
    }

    return app(req, res);

  } catch (error) {

    console.error(
      "Vercel startup error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server initialization failed",
      error: error.message
    });
  }
};