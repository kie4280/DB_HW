"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express"); // Create a new express app instance
const express_session = require("express-session");
const database_1 = require("./database");
const db = new database_1.Database();
const app = express();
app.listen(3000, () => {
    console.log("App is listening on port 3000");
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express_session({
    saveUninitialized: false,
    secret: "df4t3g8rybuib",
    resave: false,
}));
// end middleware
app.get("/main.html", (req, res) => {
    console.log("current account: ", req.session.account);
    if (req.session.account) {
        res.status(200).sendFile(process.cwd() + "/public/main.html");
    }
    else {
        res.redirect("/index.html");
    }
});
app.post("/login-user", (req, res) => {
    console.log("login");
    console.log(req.body);
    let q = db.checkpassword(req.body["account"], req.body["password"]);
    q.then((r) => {
        if (r) {
            req.session.account = req.body["account"];
        }
        res.status(200).send({ status: r });
    });
});
app.post("/logout-user", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            throw err;
        }
    });
    res.status(200);
});
app.post("/get-info", (req, res) => {
    let ac = req.session.account;
    if (ac == undefined) {
        res.sendStatus(404);
    }
    switch (req.body.type) {
        case "search":
            break;
        case "profile":
            let w = db.getUserInfo(ac);
            w.then((obj) => {
                res.status(200).send(obj);
            });
            break;
        case "city":
            break;
        default:
            res.sendStatus(404);
            break;
    }
});
app.post("/register-user", (req, res) => {
    console.log("register");
    console.log(req.body);
    let q = db.addUser(req.body.account, req.body.password, req.body.phone);
    q.then((r) => {
        res.status(200).send({ status: r });
    });
});
app.use(express.static("public"));
//The 404 Route (ALWAYS Keep this as the last route)
app.get("*", (req, res) => {
    res.status(404).send("Not found!");
});
app.post("*", (req, res) => {
    res.status(404).send("Not found!");
});
//# sourceMappingURL=server.js.map