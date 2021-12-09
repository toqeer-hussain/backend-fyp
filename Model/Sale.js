var mongoose = require("mongoose");

var SaleItem = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  qty: { type: Number, required: true, trim: true },
  price: { type: String, required: true, trim: true },
});

var Sale = new mongoose.Schema(
  {
    products: [SaleItem],
    orderid: String,
    recieved: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    promoterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promoter",
    },
    webid: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
    track: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker" },
    status: {
      type: String,
    },
  },
  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model("Sale", Sale);
