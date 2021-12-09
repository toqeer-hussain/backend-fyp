// import { doNotTrack, hook } from "../lib/web";
// import { removeTrailingSlash } from "../lib/url";

(async (window) => {
  const {
    screen: { width, height },
    navigator: { language },
    location: { hostname, pathname, search },
    localStorage,
    sessionStorage,
    document,
    history,
  } = window;

  const script = document.querySelector("script[data-website-id]");

  function removeTrailingSlash(url) {
    return url && url.length > 1 && url.endsWith("/") ? url.slice(0, -1) : url;
  }

  const urlSearchParams = new URLSearchParams(window.location.search);
  const { affiliate_id } = Object.fromEntries(urlSearchParams.entries());
  if (affiliate_id) {
    window.localStorage.setItem("affiliate_id", affiliate_id);
  }

  console.log("value of pathname", pathname);

  console.log(
    "vlaue of aaffiliate id",
    window.localStorage.getItem("affiliate_id")
  );
  console.log("Value of path", pathname);

  async function getlocation() {
    const res = await fetch(
      "https://api.freegeoip.app/json?apikey=214b1240-3710-11ec-856d-bb3e4f99a06e"
    );
    const data = await res.json();
    return data;
  }
  const dat = await getlocation();

  if (!script) return;

  const attr = (key) => script && script.getAttribute(key);
  console.log("value of attr", attr);
  const website = attr("data-website-id");
  const hostUrl = attr("data-host-url");

  // const disableTracking =
  //   localStorage.getItem("umami.disabled") ||
  //   (dnt && doNotTrack()) ||
  //   (domains &&
  //     !domains
  //       .split(",")
  //       .map((n) => n.trim())
  //       .includes(hostname));

  const root = hostUrl
    ? removeTrailingSlash(hostUrl)
    : script.src.split("/").slice(0, -1).join("/");

  console.log("value of root", root);
  console.log("value of root", website);
  if (!sessionStorage.getItem("jvsea")) {
    sessionStorage.setItem("jvsea", "true");
  }

  function Integration() {
    const Int_status = window.localStorage.getItem("Int_Status");
    console.log("status", Int_status);
    if (!Int_status) {
      window.localStorage.setItem("Int_Status", true);
      fetch(`${root}/website/integration/${website}`);
    }
  }
  Integration();

  /* Collect metrics */

  const post = (url, data, callback) => {
    const req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");

    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        callback && callback(req.response);
      }
    };

    req.send(JSON.stringify(data));
  };

  sessionStorage.setItem("jvsea", "exist");

  console.log(dat.city, dat.country_name);
  const payload = {
    website,
    hostname,
    country: dat.country_name,
    city: dat.city,
    affiliate_id: affiliate_id,
  };

  if (
    (window.localStorage.getItem("affiliate_id") &&
      pathname.match("thank-you")) ||
    pathname.match("thank_you") ||
    pathname.match("thankyou")
  ) {
    var affiliate = window.localStorage.getItem("affiliate_id");
    var product_name = [
      ...document.querySelectorAll(".jvsea__product__name"),
    ].map((item) => item.innerHTML);

    var product_quantity = [
      ...document.querySelectorAll(".jvsea__product__quantity"),
    ].map((item) => item.innerHTML.split(";")[1]);

    var product_price = [
      ...document.querySelectorAll(".jvsea__product__price"),
    ].map((item) => item.innerText.substring(2, item.innerText.length));

    product_price.shift();

    var productdata = [];

    console.log("data value", product_name, product_price, product_quantity);

    for (var i = 0; i < product_name.length; i++) {
      var data = {};

      data.name = product_name[i];
      data.qty = product_quantity[i];
      data.price = product_price[i];
      productdata.push(data);
    }

    console.log("data", productdata);

    post(`${root}/tracker`, {
      affiliate_id: affiliate,
      data: productdata,
      orderid:
        document.querySelectorAll(".jvsea__order__id")[0].childNodes[1]
          .innerText,

      payload,
    });
  } else {
    if (window.localStorage.getItem("affiliate_id")) {
      var affiliate = window.localStorage.getItem("affiliate_id");

      post(`${root}/tracker`, {
        affiliate_id: affiliate,

        payload,
      });
    }
  }

  /* Handle events */
})(window);
