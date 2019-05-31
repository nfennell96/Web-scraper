const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

//Axios similar to Ajax methods used to pull data
const axios = require("axios");
const cheerio = require("cheerio");

//Calls the models folders
const db = require("./models");

//Opens on localhost port 3000
const PORT = process.env.PORT || 3000;

//Start Express
const app = express();

app.use(logger("dev"));
//Shows data in JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//Uses Public static folder for UX
app.use(express.static("public"));

//Creates and connects to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraperwk18";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

//Routes
app.get("/scrape", function (re, res) {
    //Axios grabs the body of the page insterted below
    axios.get("http://www.allsportcrossfit.com/wod/").then(function (response) {
        //Loads the data in the $ variable
        const $ = cheerio.load(response.data);

        //Grabs the article in the page
        $(".blog-content-wrapper").each(function (i, element) {
            const result = {};

            result.title = $(this)
                .children(".post-header-wrapper")
                .children(".post-header")
                .children(".gdlr-blog-title")
                .children("a")
                .text();
            result.link = $(this)
                .children(".post-header-wrapper")
                .children(".post-header")
                .children(".gdlr-blog-title")
                .children("a")
                .attr("href");

            result.summary = $(this)
                .children(".gdlr-blog-content")
                .text();

            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });

        res.send("Scrap Complete");
    });
});

app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.delete("/articles/:id", function (req, res) {
    db.Note.deleteOne(
        {
            _id: (req.params.id)
        },
        function(err, removed) {
            if (err) {
                console.log(err);
                res.send(err);
            }
            else {
                console.log(removed);
                res.send(removed);
            }
        }
    );
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
