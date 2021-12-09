var mongoose = require("mongoose");

var RedirectUrl = new mongoose.Schema(
  {
    redirectid: { type: String, required: true, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promoter",
    },
    webid: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
  },
  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model("RedirectUrl", RedirectUrl);
