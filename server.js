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
        result.link = $(this)
          .parent()
          .attr("href");
        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            console.log(err);
          });
      });
      res.send("Scrape Complete");
    });
  });

app.listen(PORT, function () {
    console.log("NYT Scraper is running on " + PORT + " !");
})