const path = require("path");
const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const session = require("express-session");
// const MongoStore = require('connect-mongo')(session);

const connectToMongoDB = require('./config/db');

const port = process.env.PORT || 8080;


app.set("view engine", "ejs");
app.set("views", "views");
// app.set("views", "views/admin");
app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const oneWeek=1000*60*60*24*7
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: oneWeek },
    // store: new MongoStore({
    //   mongooseConnection: mongoose.connection,
    //   url: 'mongodb://127.0.0.1:27017/newbase',
    //   ttl: 14 * 24 * 60 * 60, // Session TTL (optional)
    //   autoRemove: 'native', // Auto-remove expired sessions (optional)
    // }),
  })
);
const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);




connectToMongoDB()
  .then(() => {
    
    app.listen(port, () => {
      console.log('Server started on port 3000');
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
  });



