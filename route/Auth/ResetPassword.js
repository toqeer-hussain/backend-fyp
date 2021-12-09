const User = require("../../Model/User");

const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const route = express.Router();

// const sgMail = require("@sendgrid/mail");

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

route.post("/", (req, res) => {
  User.findOne({ email: req.body.email.toLowerCase(), Role: req.body.Role })
    .then((user) => {
      if (!user)
        return res.status(401).json({
          message:
            "The email address " +
            req.body.email +
            " is not associated with any account. Double-check your email address and try again.",
        });

      //Generate and set password reset token
      user.generatePasswordReset();

      // Save the updated user object
      user
        .save()
        .then((user) => {
          // send email
          let link = user.resetPasswordToken;

          var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "movie0world@gmail.com", //replace with your email
              pass: "toqeerali12", //replace with your password
            },
          });
          /*
                In mailOptions we specify from and to address, subject and HTML content.
                In our case , we use our personal email as from and to address,
                Subject is Contact name and
                html is our form details which we parsed using bodyParser.
                */
          var mailOptions = {
            from: "movie0world@gmail.com", //replace with your email
            to: user.email, //replace with your email
            subject: `Reset Password`,
            html: `<h1>Click Here to :: <a href="http:localhost:3001/Reset_Password/${link}" target="_blank"> Reset Password</h1>`,
          };
          /*
                 Here comes the important part, sendMail is the method which actually sends email, it takes mail options and
                call back as parameter
                */
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              return res.status(200).json({ message: error.message });
              // if error occurs send error as response to client
            } else {
              console.log("Email sent: " + info.response);
              res.status(200).json({
                message:
                  "A reset email has been sent to " + req.body.email + ".",
              });
            }
          });
        })

        .catch((err) => res.status(500).json({ message: err.message }));
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// // @route POST api/auth/reset
// // @desc Reset Password - Validate password reset token and shows the password reset view
// // @access Public

route.post("/:token", (req, res) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user)
        return res
          .status(401)
          .json({ message: "Password reset token is invalid or has expired." });

      //Redirect user to form with the email address
      res.status(200).json({ validToken: true });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// // @route POST api/auth/reset
// // @desc Reset Password
// // @access Public

route.post("/new_password/:token", (req, res) => {
  console.log("New password", req.params.token);
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  }).then(async (user) => {
    console.log("user date", user);
    if (!user)
      return res
        .status(401)
        .json({ message: "Password reset token is invalid or has expired." });

    //Set the new password
    encryptedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = encryptedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Save
    user.save((err) => {
      if (err) return res.status(500).json({ message: err.message });

      res.status(200).json({ message: "Your password has been updated." });
    });
  });
});

module.exports = route;
