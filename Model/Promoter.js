var mongoose = require("mongoose");
var Promoter = new mongoose.Schema(
  {
    pro_id: { type: String, required: true, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, autoIndex: false }
);
module.exports = mongoose.model("Promoter", Promoter);
