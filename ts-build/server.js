"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express"); // Create a new express app instance
const database_1 = require("./database");
const app = express();
app.listen(3000, function () { console.log("App is listening on port 3000"); });
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.post("/login-user", function (req, res) {
    console.log("login");
});
app.post("/register-user", function (req, res) {
    console.log("register");
    console.log(req.body);
    let q = db.addUser(req.body["account"], req.body["password"], req.body["phone"]);
    q.then((r) => {
        res.status(200).send({ status: r });
    });
});
//The 404 Route (ALWAYS Keep this as the last route)
app.get("*", function (req, res) {
    res.status(404).send("Not found!");
});
app.post("*", function (req, res) {
    res.status(404).send("Not found!");
});
let db = new database_1.Database();
//# sourceMappingURL=server.js.map