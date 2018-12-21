var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");
var PORT = process.env.PORT || 3000;
var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI), { useNewUrlParser: true };

app.get("/scrape", function(req, res) {
    axios.get("http://www.nytimes.com/").then(function(response) {
      var $ = cheerio.load(response.data);
      $("article div div a div").each(function(i, element) {
        var result = {};
        result.title = $(this)
          .children("h2")
          .text();
        result.summary = $(this)
          .parent()
          .children("p")
          .text();
        result.link = $(this)
          .parent()
          .attr("href");
        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            if (err.name != "ValidationError") {
                console.log(err);
            }
          });
      });
      res.send("Scrape Complete");
    });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function () {
    console.log("NYT Scraper is running on " + PORT + " !");
})