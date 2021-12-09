const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcrypt");
const { detect, detectOS } = require("detect-browser");
const port = 3000;
const mongoose = require("mongoose");
const { v4 } = require("uuid");

// IP KEY
// 214b1240-3710-11ec-856d-bb3e4f99a06e

// ========================== Express middleWare ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// ================= Model & Connection ==================================
require("./Model");
const Tracker = mongoose.model("Tracker");
const RedirectUrl = mongoose.model("RedirectUrl");
const Promoter = mongoose.model("Promoter");
const BankDetail = mongoose.model("BankDetail");
const Transaction = mongoose.model("Transaction");

const Sale = mongoose.model("Sale");
// const Website = mongoose.model("Website");
// =========================== Middeleware ===============================

const auth = require("./Middleware/verifyauth");

// =============================== User Route ============================

const UserRoute = require("./route/Auth/User");
const ResetPassword = require("./route/Auth/ResetPassword");
const website = require("./route/Website/website");
const Website = require("./Model/Website");
const User = require("./Model/User");

app.use("/user", UserRoute);
app.use("/reset_password", ResetPassword);
app.use("/website", website);

app.get("/jvseabankdetail", auth, async (req, res) => {
  const user = await User.findOne({ Role: "admin" });
  const bankdetail = await BankDetail.findOne({ user: user?._id });
  console.log("what is bankdetail", bankdetail);
  res.json({ bankdetail });
});

app.get("/bankdetail/", auth, async (req, res) => {
  User.findOne({});
  const poromid = await BankDetail.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  }).populate("user");
  console.log("bank detail of user", poromid);
  if (poromid) {
    return res.json(poromid);
  } else {
    return res.json(null);
  }
});

app.post("/bankdetail", auth, async (req, res) => {
  console.log("body data", req.body);
  const poromid = await BankDetail.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  }).populate("user");
  console.log("datad fdfdfdf", poromid);
  if (poromid) {
    console.log("i am called");
    poromid.bankName = req.body.bankname;
    poromid.ownerName = req.body.ownername;
    poromid.accountNumber = req.body.accountnumber;
    await poromid.save();

    return res.json({ updated: true });
  } else {
    await BankDetail.create({
      bankName: req.body.bankname,
      ownerName: req.body.ownername,
      user: req.user.user_id,
      accountNumber: req.body.accountnumber,
    });
    return res.json(null);
  }
});

app.get("/brandtransstat", auth, async (req, res) => {
  const promoterId = await Website.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  });
  const sale = await Sale.find({ webid: promoterId, status: "20" }).populate(
    "webid"
  );
  const trans = await Transaction.find({ webid: promoterId });
  const pending = await Sale.find({
    promoterId,
    status: "20",

    recieved: true,
  }).populate("webid");
  let pendingrevenue = 0;
  let sum = 0;
  sale.map(
    (item) =>
      (sum =
        sum +
        Math.floor(
          (item.webid.commission *
            item.products.reduce(
              (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
              0
            )) /
            100
        ))
  );
  const pendingrate = await Sale.find({
    webid: promoterId,
    recieved: false,
    status: "20",
    paid: false,
  }).populate("webid");
  let pendingcom = 0;
  pendingrate.map((item) => {
    pendingcom =
      pendingcom +
      Math.floor(
        (item.webid.commission *
          item.products.reduce(
            (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
            0
          )) /
          100
      );
  });
  return res.json({
    sum,
    pendingcom,
    next: trans?.reverse()[0]?.createdAt,
  });
});

app.get("/protransstat", auth, async (req, res) => {
  const promoterId = await Promoter.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  });
  const sale = await Sale.find({ promoterId, status: "20" }).populate("webid");
  const trans = await Transaction.find({ promoterId });
  const pending = await Sale.find({
    promoterId,
    status: "20",
    paid: false,
  }).populate("webid");
  let pendingrevenue = 0;
  let sum = 0;
  sale.map(
    (item) =>
      (sum =
        sum +
        Math.floor(
          (item.webid.commission *
            item.products.reduce(
              (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
              0
            )) /
            100
        ))
  );
  pending.map(
    (item) =>
      (pendingrevenue =
        pendingrevenue +
        Math.floor(
          (item.webid.commission *
            item.products.reduce(
              (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
              0
            )) /
            100
        ))
  );
  return res.json({
    sum,
    pendingrevenue,
    next: trans?.reverse()[0]?.createdAt,
  });
});

app.get("/promoterid", auth, async (req, res) => {
  console.log(req.user);

  const user = await User.findById(req.user.user_id);
  console.log("value of adverister user", user);
  if (user) {
    return res.json({ user: user });
  }

  const poromid = await Promoter.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  }).populate("user");

  console.log("value of promote", poromid);
  res.json(poromid);
});

app.post("/promoterid", auth, async (req, res) => {
  console.log("called for promoter id", req.body);
  const user = await User.findOne({
    _id: mongoose.Types.ObjectId(req.user.user_id),
  });

  console.log("promoter detial", user);
  user.name = req.body.name;
  user.email = req.body.email;
  user.phoneNumber = req.body.phonenumber;

  if (req.body.password) {
    user.password = await bcrypt.hash(req.body.password, 10);
  }
  await user.save();
  res.json({ updated: true });
});

app.get("/marketitem/:cat", async (req, res) => {
  console.log("caterg", req.params.cat);
  let web = await Website.find({ category: req.params.cat });
  let webdata = [];
  for (let i = 0; i < web.length; i++) {
    const salecount = await Sale.find({ webid: web[i]?._id }).count();
    const trackcount = await Tracker.find({ webid: web[i]?._id }).count();
    const conversion = Math.floor((salecount * 100) / trackcount);

    let analystics = {};
    analystics.web = web[i];
    analystics.sale = salecount;
    analystics.conversion = conversion;
    webdata.push(analystics);
  }

  console.log("web called", web);
  res.json(webdata);
});

app.post("/createredirecturl", auth, async (req, res) => {
  const promter = await Promoter.findOne({
    user: mongoose.Types.ObjectId(req.user.user_id),
  }).populate("user");
  var redirectid = v4();
  let website = await RedirectUrl.findOne({
    webid: req.body.webid,
    user: promter,
  }).populate("webid");

  console.log("redirect vlaue", website);
  if (!website) {
    website = await RedirectUrl.create({
      redirectid,
      user: promter,
      webid: req.body.webid,
    });
    website = await website.populate("webid");
    console.log("after creation", website);
  }
  res.send(`${website.webid.domain}/?affiliate_id=${promter.pro_id}`);
});

app.post("/tracker", async (req, res) => {
  const browser = detect(req.headers["user-agent"]);

  // const locationaddress = await axios.get(`freegeoip.net/json/${req.ip}`);
  console.log(req.body);
  const webid = await Website.findOne({ webid: req.body.payload.website });
  console.log("web detial", webid);
  promotervalue = await Promoter.findOne({ pro_id: req.body.affiliate_id });
  const promoter = await RedirectUrl.findOne({
    webid: webid?._id,
    user: promotervalue?._id,
  }).populate("user");

  console.log("vlaue of promoter", promotervalue);
  console.log("vlaue of promoter", promoter);

  const track = await Tracker.create({
    city: req.body.payload.city,
    country: req.body.payload.country,
    browser: browser.name,
    promoterId: promotervalue?._id,
    webid: webid?._id,
    referer: req.body.payload.referrer,
  });
  console.log("value of track", track?._id);
  if (req.body.data) {
    const sale = new Sale({
      promoterId: promoter.user._id,
      webid: webid.id,
      track: track?._id,
      orderid: req.body.orderid,
      status: "10",
    });
    sale.products = req.body.data;
    await sale.save();
  }
  res.send("Toqeer houssain");
});

app.post("/transaction", async (req, res) => {
  console.log("body", req.body);

  const detail = await BankDetail.findOne({
    accountNumber: req.body.accountnumber,
  }).populate("user");

  let pendingcom = 0;
  if (detail) {
    if (req.body.Role == "advertiser") {
      const website = await Website.findOne({ user: detail.user });
      console.log("webid", website._id);
      const pending = await Sale.find({
        webid: website?._id,
        recieved: false,
        status: "20",
        paid: false,
      }).populate("webid");

      pending.map((item) => {
        pendingcom =
          pendingcom +
          Math.floor(
            (item.webid.commission *
              item.products.reduce(
                (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
                0
              )) /
              100
          );
      });

      pending.map(async (item) => {
        console.log("id value", item.id);
        await Sale.findByIdAndUpdate(mongoose.Types.ObjectId(item.id), {
          recieved: true,
        });
      });
    } else {
      const pro = await Promoter.findOne({ user: detail.user });
      console.log("value of pr", pro);
      const pending = await Sale.find({
        prommterId: pro?._id,
        recieved: true,
        status: "20",
        paid: false,
      }).populate("webid");
      console.log("value of pending", pending);
      pending.map((item) => {
        pendingcom =
          pendingcom +
          Math.floor(
            (item.webid.commission *
              item.products.reduce(
                (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
                0
              )) /
              100
          );
      });
      pending.map(async (item) => {
        console.log("id value", item.id);
        await Sale.findByIdAndUpdate(mongoose.Types.ObjectId(item.id), {
          paid: true,
        });
      });
    }

    // console.log("find bank", detail);
    if (detail.user.Role == req.body.Role) console.log("find bank", detail);
    if (detail) {
      const trans = await Transaction.create({
        price: pendingcom,
        Role: req.body.Role,
        account: detail._id,
      });
      return res.json({ done: true, trans });
    }
  }
  res.json({ done: false });
});

app.get("/sales", auth, async (req, res) => {
  const promoter = await Promoter.findOne({ user: req.user.user_id });
  console.log("promtoer", promoter);
  const sale = await Sale.find({ promoterId: promoter?._id })
    .populate("webid")
    .populate("track");
  res.json(sale);
});

app.get("/salesadver", auth, async (req, res) => {
  const website = await Website.findOne({ user: req.user.user_id }).populate(
    "user"
  );
  console.log("webiste saledev", website);
  const sale = await Sale.find({ webid: website?._id })
    .populate("webid")
    .populate("promoterId")
    .populate("track");
  res.json(sale);
});

app.get("/toppromoter", auth, async (req, res) => {
  const website = await Website.findOne({ user: req.user.user_id }).populate(
    "user"
  );
  console.log("webid", website);
  const registedsite = await RedirectUrl.find({ webid: website?._id }).populate(
    "webid"
  );
  let topbrand = [];
  let totalcommision = 0;
  console.log("registed site", registedsite);
  for (let i = 0; i < registedsite.length; i++) {
    const trackcount = await Tracker.find({
      promoterId: registedsite[i].user,
      webid: website?._id,
    }).count();
    const salecount = await Sale.find({
      promoterId: registedsite[i].user,
      webid: website?._id,
    }).count();
    const salecomissioin = await Sale.find({
      promoterId: registedsite[i].user,
      webid: website?._id,
    })
      .populate("promoterId")
      .populate("webid");

    const returnSale = await Sale.find({
      promoterId: registedsite[i].user,
      webid: website?._id,
      status: "30",
    }).count();

    salecomissioin.map((item) =>
      item.products.map(
        (v) =>
          (totalcommision =
            totalcommision + parseFloat(v.price.replace(/,/g, "")))
      )
    );
    let topbranddata = {};
    console.log("brand conversion", (salecount * 100) / trackcount);
    topbranddata.brand = salecomissioin[0].promoterId.pro_id;
    topbranddata.sale = salecount;
    topbranddata.click = trackcount;
    topbranddata.return = returnSale;
    topbranddata.returnpre = (returnSale / salecount) * 100;
    topbranddata.commission = Math.floor(
      (totalcommision * salecomissioin[0].webid.commission) / 100
    );
    topbranddata.conversion = Math.floor((salecount * 100) / trackcount);

    topbrand.push(topbranddata);
  }

  res.json(topbrand);
});

app.get("/topbrand", auth, async (req, res) => {
  const promoter = await Promoter.findOne({ user: req.user.user_id }).populate(
    "user"
  );
  const registedsite = await RedirectUrl.find({ user: promoter?._id }).populate(
    "webid"
  );
  let topbrand = [];
  let totalcommision = 0;
  console.log("registed site", registedsite);
  for (let i = 0; i < registedsite.length; i++) {
    const trackcount = await Tracker.find({
      promoterId: promoter?._id,
      webid: registedsite[i].webid,
    }).count();
    const trackweb = await Tracker.find({
      promoterId: promoter?._id,
      webid: registedsite[i].webid,
    }).populate("webid");
    const salecount = await Sale.find({
      promoterId: promoter?._id,
      webid: registedsite[i].webid,
    }).count();
    const salecomissioin = await Sale.find({
      promoterId: promoter?._id,
      webid: registedsite[i].webid,
    }).populate("webid");
    salecomissioin.map((item) =>
      item.products.map(
        (v) =>
          (totalcommision =
            totalcommision + parseFloat(v.price.replace(/,/g, "")))
      )
    );
    let topbranddata = {};
    console.log("brand conversion", trackweb);
    topbranddata.brand = trackweb[0].webid.brand;
    topbranddata.sale = salecount;
    topbranddata.click = trackcount;
    topbranddata.commission = Math.floor(
      (totalcommision * salecomissioin[0]?.webid.commission) / 100
    );
    topbranddata.conversion = Math.floor((salecount * 100) / trackcount);

    topbrand.push(topbranddata);
  }

  res.json(topbrand);
});

app.get("/procom", async (req, res) => {
  const allpromoter = await Promoter.find({});

  let promoterlist = [];
  for (let i = 0; i < allpromoter.length; i++) {
    let sale = await Sale.find({
      status: "20",
      paid: false,
      promoterId: allpromoter[i]._id,
    })
      .populate("promoterId")
      .populate("webid");
    let comre = await Sale.find({
      status: "20",
      paid: false,
      recieved: true,
      promoterId: allpromoter[i]._id,
    })
      .populate("promoterId")
      .populate("webid");

    console.log("what data", sale);
    let sum = 0;
    sale.map(
      (item) =>
        (sum =
          sum +
          Math.floor(
            (item.webid.commission *
              item.products.reduce(
                (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
                0
              )) /
              100
          ))
    );
    let comsum = 0;
    comre.map(
      (item) =>
        (comsum =
          comsum +
          Math.floor(
            (item.webid.commission *
              item.products.reduce(
                (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
                0
              )) /
              100
          ))
    );
    let promoterdata = {};
    console.log("googgle", sum);
    if (sum > 0) {
      let bankdetail = await BankDetail.findOne({
        user: mongoose.Types.ObjectId(sale[0].promoterId.user),
      });

      promoterdata.pencommission = sum;
      promoterdata.reccom = comsum;
      promoterdata.promoter = sale[0].promoterId;
      promoterdata.bankdetail = bankdetail;
      promoterlist.push(promoterdata);
    }
  }
  // console.log("value of sum", sum);
  res.json(promoterlist);
});

app.get("/adminpending", auth, async (req, res) => {
  const website = await Website.findOne({ user: req.user.user_id });
  // console.log("webid", website?._id);
  ////////////////////////// Pending Commission
  const pending = await Sale.find({
    webid: website?._id,
    recieved: false,
    status: "20",
    paid: false,
  }).populate("webid");
  let pendingcom = 0;
  pending.map((item) => {
    pendingcom =
      pendingcom +
      Math.floor(
        (item.webid.commission *
          item.products.reduce(
            (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
            0
          )) /
          100
      );
  });
  //////////////////////////////// Total Sale
  const totalSale = await Sale.find({
    webid: website?._id,
  }).count();

  ///////////////////////////////////////  Succeed

  const succeed = await Sale.find({
    webid: website?._id,

    status: "20",
  }).count();
  //////////////////////////////////////// Revenue
  const Revenue = await Sale.find({
    webid: website?._id,
    status: "20",
  });
  console.log("what is vlauye of Revenue", Revenue);
  let revenuecount = 0;
  Revenue.map((item) => {
    revenuecount =
      revenuecount +
      Math.floor(
        item.products.reduce(
          (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
          0
        )
      );
  });
  //////////////////////////////////////////////// Refund
  const Refund = await Sale.find({
    webid: website?._id,
    status: "30",
  }).count();

  res.json({ Refund, revenuecount, succeed, totalSale, pendingcom });
});

app.get("/admintransscreen", auth, async (req, res) => {
  const totaltrans = await Transaction.find({}).count();
  const totalbrand = await Transaction.find({ Role: "advertiser" });
  const totalpromoter = await Transaction.find({ Role: "promoter" });
  // console.log("what is totaltrtansamount", totaltransamount);
  let promotercom = totalpromoter.reduce((num1, num2) => num2.price + num1, 0);
  let brandcom = totalbrand.reduce((num1, num2) => num2.price + num1, 0);

  // console.log("damadkfadf", brandcom);

  // const totaltransamountpaid = await Sale.find({
  //   status: "20",
  //   recieved: true,
  //   paid: true,
  // }).populate("webid");
  // let paidtopromoter = 0;
  // let paidtopromotercom = 0;
  // totaltransamountpaid.map((item) => {
  //   (paidtopromotercom =
  //     paidtopromotercom +
  //     item.webid.commission *
  //       item.products.map(
  //         (v) =>
  //           (paidtopromoter =
  //             paidtopromoter + parseFloat(v.price.replace(/,/g, "")))
  //       )) / 100;
  // });

  res.json({ totaltrans, brandcom, promotercom });
});

app.get("/prostat", auth, async (req, res) => {
  // const website = await Website.findOne({ user: req.user.user_id });
  const promoter = await Promoter.findOne({ user: req.user.user_id });
  ///////////////////////////////// Total Click
  const click = await Tracker.find({
    promoterId: promoter,
  }).count();
  ///////////////////////////////// Total Sale
  const totalsale = await Sale.find({
    promoterId: promoter,
  }).count();
  ///////////////////////////// Total reveune
  const Revenue = await Sale.find({
    promoterId: promoter,
    status: "20",
  });
  console.log("what is vlauye of Revenue", Revenue);
  let revenuecount = 0;
  Revenue.map((item) => {
    revenuecount =
      revenuecount +
      Math.floor(
        item.products.reduce(
          (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
          0
        )
      );
  });
  ///////////////////////////////////////////// Refund
  const Refund = await Sale.find({
    promoterId: promoter,
    status: "30",
  }).count();
  ////////////////////////////////////// Pending commsion
  const Pending = await Sale.find({
    promoterId: promoter,
    status: "20",

    paid: false,
  }).populate("webid");

  console.log("pedning data", Pending);
  let pendingcom = 0;
  Pending.map((item) => {
    pendingcom =
      pendingcom +
      Math.floor(
        (item.webid.commission *
          item.products.reduce(
            (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
            0
          )) /
          100
      );
  });

  /////////////////////////// response
  res.json({ click, totalsale, revenuecount, Refund, pendingcom });
});

app.get("/redirect/:webid", auth, async (req, res) => {
  let data;
  try {
    data = await Tracker.find({
      user: req.user.user_id,
      webid: req.params.webid,
    }).count();
  } catch (e) {
    res.send("Not found any record");
  }

  res.json(data);
});

app.get("/adminstat", auth, async (req, res) => {
  /////////////////////////////////// Sale Count
  const totalsale = await Sale.find({}).count();
  //////////////////////////////////// Succeed Count
  const totalsucceed = await Sale.find({ status: "20" }).count();
  /////////////////////////////////// Revuenu
  const Revenue = await Sale.find({
    status: "20",
  });
  console.log("what is vlauye of Revenue", Revenue);
  let revenuecount = 0;
  Revenue.map((item) => {
    revenuecount =
      revenuecount +
      Math.floor(
        item.products.reduce(
          (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
          0
        )
      );
  });
  ////////////////////////////////////////////// Refunds
  const Refund = await Sale.find({
    status: "30",
  }).count();

  console.log("route is hitteed");
  ////////////////////////  Response
  res.json({
    Refund,
    revenuecount,
    totalsucceed,
    totalsale,
    profit: (revenuecount * 2) / 100,
  });
});

app.get("/brandtrans", auth, async (req, res) => {
  const bankdetail = await BankDetail.findOne({ user: req.user.user_id });
  const translist = await Transaction.find({ account: bankdetail });
  console.log("list", translist);
  res.json(translist.reverse());
});

app.get("/admintransstat", auth, async (req, res) => {
  const bankdetail = await BankDetail.findOne({ user: req.user.user_id });
  const website = await Website.findOne({ user: req.user.user_id });
  const translist = await Transaction.find({ account: bankdetail });
  console.log("list", translist);
  let totalcommission = 0;
  for (let i = 0; i < translist.length; i++) {
    totalcommission = totalcommission + +translist[0].price;
  }

  const pending = await Sale.find({
    webid: website?._id,
    recieved: true,
    status: "20",
    paid: false,
  }).populate("webid");
  let pendingcom = 0;
  pending.map((item) => {
    pendingcom =
      pendingcom +
      Math.floor(
        (item.webid.commission *
          item.products.reduce(
            (num1, num2) => parseFloat(num2.price.replace(/,/g, "")) + num1,
            0
          )) /
          100
      );
  });

  res.json({
    totalcommission,
    pendingcom,
    next: translist.reverse()[0].createdAt,
  });
});

app.get("/promoterlist", auth, async (req, res) => {
  const promoter = await Promoter.find({});
  let datalist = [];
  for (let i = 0; i < promoter.length; i++) {
    let salecount = await Sale.find({ prommterId: promoter[i] }).count();
    let totalclick = await Tracker.find({ prommterId: promoter[i] }).count();
    let conversion = (salecount * 100) / totalclick;
    let returncount = await Sale.find({
      prommterId: promoter[i],
      status: "30",
    }).count();

    let returnper = (returncount * 100) / salecount;
    let dataobj = {
      salecount,
      totalclick,
      conversion,
      returncount,
      returnper,
      name: promoter[i].pro_id,
    };
    datalist.push(dataobj);
  }
  return res.json(datalist);
});

app.get("/brandlist", auth, async (req, res) => {
  const website = await Website.find({});
  let datalist = [];
  for (let i = 0; i < website.length; i++) {
    let salecount = await Sale.find({ webid: website[i] }).count();
    let totalclick = await Tracker.find({ webid: website[i] }).count();
    let conversion = (salecount * 100) / totalclick;
    let returncount = await Sale.find({
      webid: website[i],
      status: "30",
    }).count();

    let returnper = (returncount * 100) / salecount;
    let dataobj = {
      salecount,
      totalclick,
      conversion,
      returncount,
      returnper,
      name: website[i].brand,
    };
    datalist.push(dataobj);
  }
  return res.json(datalist);
});

app.post("/updatesale", async (req, res) => {
  const data = await Sale.findByIdAndUpdate(
    req.body.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(data);
});

app.get("/test", (req, res) => res.send("Toqeer"));
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
