var mongoose = require("mongoose");
var BankDetail = new mongoose.Schema(
  {
    bankName: { type: String, required: true, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    accountNumber: { type: Number, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
  },

  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model("BankDetail", BankDetail);
