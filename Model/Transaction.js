var mongoose = require("mongoose");
var Transcation = new mongoose.Schema(
  {
    price: { type: Number, required: true, trim: true },

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankDetail",
    },
    Role: String,
  },
  { timestamps: true, autoIndex: false }
);
module.exports = mongoose.model("Transaction", Transcation);
