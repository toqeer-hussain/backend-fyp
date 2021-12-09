var mongoose = require("mongoose");
const crypto = require("crypto");

var UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    token: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    phoneNumber: { type: Number, trim: true },
    Role: {
      type: String,
      enum: ["advertiser", "promoter", "admin"],
      default: "promoter",
    },
  },
  { timestamps: true, autoIndex: false }
);

UserSchema.methods.generatePasswordReset = function () {
  this.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordExpires = new Date(Date.now() + 3600000); //expires in an hour
};

module.exports = mongoose.model("User", UserSchema);
