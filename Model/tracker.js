var mongoose = require("mongoose");

var Tracker = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    browser: { type: String, required: true, trim: true },
    device: { type: String, trim: true, default: null },
    referer: { type: String, trim: true, default: null },
    promoterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promoter",
    },
    webid: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
  },
  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model("Tracker", Tracker);
