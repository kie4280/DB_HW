"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const express_session = require("express-session");
const database_1 = require("./database");
const db = new database_1.Database();
const app = express();
app.listen(3000, () => {
    console.log("App is listening on port 3000");
});
app.set("view engine", "ejs");
app.set("view cache", false);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express_session({
    saveUninitialized: false,
    secret: "df4t3g8rybuib",
    resave: false,
}));
// end middleware
app.get("/", (req, res) => {
    res.render("pages/index");
});
app.get("/main", (req, res) => {
    console.log("current account: ", req.session.account);
    if (req.session.account) {
        let ac = req.session.account;
        let w = db.getInfo(ac);
        w.then((obj) => {
            console.log(obj);
            if (obj.isManager) {
                req.session.shop_name = obj.manages.shop_name;
                res.render("pages/main", {
                    account: obj.account,
                    phone: obj.phone,
                    template: "../partials/shop-info.ejs",
                    shop: obj.manages,
                    clerks: obj.clerks,
                    cities: obj.cities,
                });
            }
            else {
                res.render("pages/main", {
                    account: obj.account,
                    phone: obj.phone,
                    template: "../partials/shop-form.ejs",
                    cities: obj.cities,
                });
            }
        });
    }
    else {
        res.render("pages/index");
    }
});
app.post("/login-user", (req, res) => {
    console.log("login");
    console.log(req.body);
    let q = db.checkpassword(req.body.account, req.body.password);
    q.then((r) => {
        if (r) {
            req.session.account = req.body.account;
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
    res.status(200).send({ status: true });
});
app.post("/search-shop", (req, res) => {
    const ac = req.session.account;
    if (ac == undefined) {
        res.sendStatus(403);
    }
    let sp = db.searchShop(ac, req.body.checked, req.body.shop, req.body.city, req.body.min_price, req.body.max_price, req.body.amount);
    sp.then((obj) => {
        console.log("search results:", obj);
        res.status(200).send(obj);
    });
    // console.log(req.body);
});
app.post("/edit-shop", (req, res) => {
    if (req.session.account == undefined || req.session.shop_name == undefined) {
        res.sendStatus(403);
    }
    console.log(req.body);
    switch (req.body.type) {
        case "add-clerk":
            let qa = db.addClerk(req.body.account, req.session.shop_name);
            qa.then((obj) => {
                // console.log(obj);
                res.status(200).send(obj);
            });
            break;
        case "delete-clerk":
            let qd = db.deleteClerk(req.body.account, req.session.shop_name);
            qd.then((obj) => {
                // console.log(obj);
                res.status(200).send(obj);
            });
            break;
        case "edit-amount":
            let ea = db.editAmount(req.session.shop_name, req.session.account, req.body.amount);
            ea.then((obj) => {
                res.status(200).send(obj);
            });
            break;
        case "edit-price":
            let ep = db.editPrice(req.session.shop_name, req.session.account, req.body.price);
            ep.then((obj) => {
                res.status(200).send(obj);
            });
            break;
        default:
            res.sendStatus(404);
            break;
    }
});
app.post("/register-shop", (req, res) => {
    console.log("register shop");
    console.log(req.body);
    const ac = req.session.account;
    if (ac == undefined) {
        res.sendStatus(403);
    }
    let q = db.registerShop(req.body.shop, req.body.city, parseInt(req.body.price), parseInt(req.body.amount), ac);
    q.then((success) => {
        res.status(200).send({ status: success });
    });
});
app.post("/register-user", (req, res) => {
    console.log("register user");
    console.log(req.body);
    let q = db.registerUser(req.body.account, req.body.password, req.body.phone);
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