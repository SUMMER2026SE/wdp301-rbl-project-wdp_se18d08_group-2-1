const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "system_settings",
  }
);

module.exports = mongoose.models.SystemSetting || mongoose.model("SystemSetting", systemSettingSchema);
