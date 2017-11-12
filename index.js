const express = require("express");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const cookieSession = require("cookie-session");
const passport = require("passport");
const keys = require("./config/keys");
require("./models/user");
require("./services/passport");

mongoose.connect(keys.mongoURI);

const app = express();

app.use(
  cookieSession({
    maxAge: 30 * 20 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
);
app.use(passport.initialize());
app.use(passport.session());

require("./routes/auth-routes")(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT);
