const express = require("express");
const mongoose = require("mongoose");
const website = mongoose.model("Website");
const { v4 } = require("uuid");

const auth = require("../../Middleware/verifyauth");

const route = express.Router();

route.post("/", auth, async (req, res) => {
  const webfound = await website.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  });
  if (webfound) {
    const web = await website.findOneAndUpdate(
      { user: mongoose.Types.ObjectId(req.user.user_id) },
      {
        ...req.body,
      },
      { new: true }
    );
    console.log("updated value ", web);
    res.send({ webid: web.webid, website: web.domain, updated: true });
  } else {
    const web = await website.create({
      ...req.body,
      webid: v4(),
      user: req.user.user_id,
    });

    res.send({ webid: web.webid, website: web.domain });
  }
});

route.get("/", auth, async (req, res) => {
  const web = await website.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  });
  if (web) {
    return res.json(web);
  }
  res.json(null);
});

route.get("/integration/:webid", async (req, res) => {
  console.log("website staus called how many time");
  await website.findOneAndUpdate(
    { webid: req.params.webid },
    { status: "Active" }
  );
  res.status(200).json({ webstatus: "Updated" });
});

module.exports = route;
