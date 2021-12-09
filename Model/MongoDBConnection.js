const mongoose = require("mongoose");

console.log("mongoose is called");
const MONGO_URI =
  " mongodb+srv://toqeer:toqeerali77@cluster0.l8qrp.mongodb.net/Fyp?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: false,
    // useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((error) => {
    console.log("database connection failed. exiting now...");
    console.error(error);
    process.exit(1);
  });
