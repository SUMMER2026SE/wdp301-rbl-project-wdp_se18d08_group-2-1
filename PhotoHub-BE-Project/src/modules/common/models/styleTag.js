const mongoose = require("mongoose");

const styleTagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },

        type: {
            type: String,
            enum: [
                "STYLE",
                "MOOD",
                "COLOR",
                "CONCEPT",
            ],
            required: true,
        },

        description: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.StyleTag ||
    mongoose.model("StyleTag", styleTagSchema);