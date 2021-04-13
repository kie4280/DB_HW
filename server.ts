import express = require("express");// Create a new express app instanceconst 

var app:express.Application = express();
app.get("/", function (req, res) { res.send("Hello"); });
app.listen(3000, function () { console.log("App is listening on port 3000!"); });