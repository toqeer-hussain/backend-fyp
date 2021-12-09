var mongoose = require("mongoose");
const User = require("./User");

var Webdetail = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    webid: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    commission: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Pending", "Active"], default: "Pending" },
  },
  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model("Website", Webdetail);
