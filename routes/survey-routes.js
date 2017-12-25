const requireLogin = require("../middlewares/requireLogin");
const requireCredit = require("../middlewares/requireCredits");
const mongoose = require("mongoose");
const _ = require("lodash");
const Path = require("path-parser");
const bodyParser = require("body-parser");
const { URL } = require("url");
//const Mailer = require("../services/SendgridMailer");
const MailgunMailer = require("../services/MailgunMailer");
const surveyTemplate = require("../services/emailTemplates/surveyTemplate");

const Survey = mongoose.model("surveys");

module.exports = app => {
  app.get("/api/surveys", requireLogin, async (req, res) => {
    const surveys = await Survey.find({
      _user: req.user.id
    }).select("-recipients");

    res.send(surveys);
  });

  app.get("/api/survey/:surveyId/:answer", (req, res) => {
    res.send("Thanks for voting!");
  });

  app.post("/api/survey/webhooks", bodyParser.urlencoded(), (req, res) => {
    const p = new Path("/api/survey/:surveyId/:choice");
    const { recipient: email, url, event } = req.body;
    const match = p.test(new URL(url).pathname);
    if (match && event === "clicked") {
      Survey.updateOne(
        {
          _id: match.surveyId,
          recipients: {
            $elemMatch: { email: email, responded: false }
          }
        },
        {
          $inc: { [match.choice]: 1 },
          $set: { "recipients.$.responded": true },
          lastResponded: new Date()
        }
      ).exec();
    }

    res.send({});
  });

  app.post("/api/survey", requireLogin, requireCredit, async (req, res) => {
    const { title, subject, body, recipients } = req.body;

    const survey = new Survey({
      title,
      subject,
      body,
      recipients: recipients.split(",").map(email => ({ email: email.trim() })),
      _user: req.user.id,
      dateSent: Date.now()
    });

    // Great place to send an email!
    const mailer = new MailgunMailer(survey, surveyTemplate(survey));
    try {
      await mailer.send();
      await survey.save();
      req.user.credits -= 1;
      const user = await req.user.save();
      res.send(user);
    } catch (err) {
      res.status(422).send(err);
    }
  });
};
