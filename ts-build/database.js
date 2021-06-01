"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const crypto = __importStar(require("crypto"));
const mysql = __importStar(require("mysql2"));
function genHash(password) {
    var hash = crypto.createHash("sha256").update(password).digest("hex");
    return hash;
}
function formatTime(in_date) {
    if (in_date == null)
        return "-";
    let year = in_date.getFullYear();
    let month = (in_date.getMonth() + 1).toLocaleString("en-US", {
        minimumIntegerDigits: 2,
    });
    let date = in_date
        .getDate()
        .toLocaleString("en-US", { minimumIntegerDigits: 2 });
    let hour = in_date
        .getHours()
        .toLocaleString("en-US", { minimumIntegerDigits: 2 });
    let minute = in_date
        .getMinutes()
        .toLocaleString("en-US", { minimumIntegerDigits: 2 });
    let second = in_date
        .getSeconds()
        .toLocaleString("en-US", { minimumIntegerDigits: 2 });
    let date_ = `${year}/${month}/${date} ${hour}:${minute}:${second}`;
    return date_;
}
const STATUS_DICT = new Map([
    ["p", "Not finished"],
    ["c", "Cancelled"],
    ["f", "Finished"],
    ["Not finished", "p"],
    ["Cancelled", "c"],
    ["Finished", "f"],
]);
class Database {
    constructor() {
        this.database = mysql.createPool({
            host: "localhost",
            user: "mask",
            password: "mask",
            database: "maskDB",
            connectionLimit: 10,
            multipleStatements: false, // beware of SQL injection if true
        });
        this.createTables();
    }
    close() {
        this.database.end();
    }
    createTables() {
        this.database.query(`CREATE TABLE IF NOT EXISTS user(
          UID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          account varchar(20) BINARY NOT NULL UNIQUE,
          password char(64) NOT NULL,
          phone varchar(10)
       );`);
        this.database.query(`CREATE TABLE IF NOT EXISTS shop(
          SID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          shop_name varchar(30) BINARY NOT NULL UNIQUE,
          shop_city varchar(30) NOT NULL,
          mask_amount int NOT NULL,
          mask_price int NOT NULL,
          CONSTRAINT chk_s CHECK(mask_amount >= 0 AND mask_price >= 0)
      );`);
        // status 'c': canceled, 'p': pending, 'f': finished
        this.database.query(`CREATE TABLE IF NOT EXISTS orders(
          OID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          SID INTEGER NOT NULL, 
          status char(1) NOT NULL,
          UID_create INTEGER NOT NULL,
          create_time DATETIME,
          UID_finish INTEGER,
          finish_time DATETIME,
          price INTEGER NOT NULL,
          amount INTEGER NOT NULL,
          FOREIGN KEY(UID_create) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(UID_finish) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(SID) REFERENCES shop(SID) ON DELETE CASCADE,
          CONSTRAINT chk_o CHECK(status in ('c', 'p', 'f'))
      );`);
        // role 'c': clerk, 'm': manager
        this.database.query(`CREATE TABLE IF NOT EXISTS role(
          UID INTEGER NOT NULL,
          SID INTEGER NOT NULL,
          role char(1) NOT NULL,
          PRIMARY KEY(UID, SID, role),
          FOREIGN KEY(UID) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(SID) REFERENCES shop(SID) ON DELETE CASCADE,
          CONSTRAINT chk_r CHECK(role in ('c', 'm'))
      );`);
    }
    async registerUser(account, password, phone) {
        let [results, _] = await this.database
            .promise()
            .execute("SELECT * FROM user WHERE account = ?", [account]);
        if (results.length == 1) {
            return false;
        }
        [results, _] = await this.database
            .promise()
            .execute("INSERT INTO user VALUES (0, ?, ?, ?)", [
            account,
            genHash(password),
            phone,
        ]);
        return results.affectedRows == 1;
    }
    async checkpassword(account, password) {
        let [results, _] = await this.database.promise().execute(`SELECT account, password FROM user
          where account = ? and password = ?;`, [account, genHash(password)]);
        return results.length == 1;
    }
    async getInfo(account) {
        let Q_userInfo = this.database.promise().execute(`SELECT phone FROM user
          WHERE account = ?;`, [account]);
        let Q_manageShopInfo = this.database.promise().execute(`SELECT shop_name, shop_city, mask_amount, mask_price
       FROM role NATURAL JOIN user NATURAL JOIN shop
       WHERE account = ? AND role = 'm';`, [account]);
        let Q_cityInfo = this.database
            .promise()
            .query(`SELECT DISTINCT shop_city FROM shop;`);
        let [user_i, manage_i, city_i] = await Promise.all([
            Q_userInfo,
            Q_manageShopInfo,
            Q_cityInfo,
        ]);
        const phone = user_i[0][0].phone;
        let cities = [];
        let cities_i = city_i[0];
        for (let i = 0; i < cities_i.length; ++i) {
            cities = cities.concat(cities_i[i].shop_city);
        }
        let clerks = [];
        let isManager = manage_i[0].length > 0;
        if (isManager) {
            let shop = {
                name: manage_i[0][0].shop_name,
                city: manage_i[0][0].shop_city,
                price: manage_i[0][0].mask_price,
                amount: manage_i[0][0].mask_amount,
            };
            let [result, _] = await this.database.promise().execute(`SELECT UID, account, phone FROM role NATURAL JOIN user
            NATURAL JOIN shop WHERE shop_name = ? AND role != 'm';`, [shop.name]);
            result = result;
            for (let i = 0; i < result.length; ++i) {
                clerks = clerks.concat({
                    id: result[i].UID,
                    account: result[i].account,
                    phone: result[i].phone,
                });
            }
            return {
                account,
                phone,
                isManager,
                cities,
                manages: shop,
                clerks,
            };
        }
        else {
            return { account, phone, isManager, cities, manages: null, clerks };
        }
    }
    async registerShop(shop, city, price, amount, account) {
        let [results, _] = await this.database
            .promise()
            .execute(`SELECT * FROM shop where shop_name = ?;`, [shop]);
        if (results.length > 0) {
            return false;
        }
        const conn = await this.database.promise().getConnection();
        await conn.beginTransaction();
        try {
            await conn.execute(`INSERT INTO shop VALUES (0, ?, ?, ?, ?);`, [
                shop,
                city,
                amount,
                price,
            ]);
            await conn.execute(`INSERT INTO role VALUES (
          (SELECT UID FROM user WHERE account = ?), 
          (SELECT SID FROM shop WHERE shop_name = ?), 'm');`, [account, shop]);
            await conn.commit();
        }
        catch (error) {
            await conn.rollback();
            return false;
        }
        finally {
            conn.release();
        }
        return true;
    }
    async addClerk(account, shop) {
        let checkRole = this.database.promise().execute(`SELECT UID FROM 
        user NATURAL JOIN role NATURAL JOIN shop
        WHERE account = ? AND shop_name = ?;
      `, [account, shop]);
        let checkUser = this.database.promise().execute(`SELECT UID, account, phone 
        FROM user WHERE account = ?;`, [account]);
        let [role_i, user_i] = await Promise.all([checkRole, checkUser]);
        const alreadyWorking = role_i[0].length > 0;
        const user = user_i[0];
        if (alreadyWorking) {
            return { status: false, err: "*Already working in this shop!" };
        }
        else if (user.length != 1) {
            return { status: false, err: "*No such user!" };
        }
        let [insert_r, _] = await this.database.promise().execute(`INSERT INTO role VALUES (
        (SELECT UID FROM user WHERE account = ?),
        (SELECT SID FROM shop WHERE shop_name = ?),
        'c');`, [account, shop]);
        const insert_suc = insert_r.affectedRows > 0;
        if (insert_suc) {
            return {
                status: true,
                id: user[0].UID,
                account: user[0].account,
                phone: user[0].phone,
            };
        }
        else {
            return {
                status: false,
                err: "*Cannot add clerk, sorry!",
            };
        }
    }
    async deleteClerk(account, shop) {
        let [userinfo, _1] = await this.database.promise().execute(`SELECT UID, account, SID FROM 
        user NATURAL JOIN role NATURAL JOIN shop
        WHERE account = ? AND shop_name = ?;`, [account, shop]);
        userinfo = userinfo;
        if (userinfo.length == 0) {
            return { status: false };
        }
        const UID = userinfo[0].UID;
        const SID = userinfo[0].SID;
        let [deleteOP, _2] = await this.database.promise().execute(`DELETE FROM role 
        WHERE UID = ? AND SID = ? AND role = 'c';`, [UID, SID]);
        deleteOP = deleteOP;
        return { status: deleteOP.affectedRows > 0, id: UID };
    }
    async editPrice(shop_name, account, price) {
        let [old, _o] = await this.database.promise().execute(`SELECT mask_price FROM shop WHERE shop_name = ? AND EXISTS
        (SELECT * FROM shop AS S NATURAL JOIN role NATURAL JOIN user
         WHERE S.SID = shop.SID AND account = ?);`, [shop_name, account]);
        old = old;
        if (old.length != 1) {
            return Promise.reject("Something terrible happened");
        }
        const old_price = old[0].mask_price;
        const price_ = parseFloat(price);
        if (Number.isNaN(price_) || !Number.isInteger(price_) || price_ < 0) {
            return { status: false, price: old_price };
        }
        let [results, _] = await this.database
            .promise()
            .execute(`UPDATE shop SET mask_price = ? WHERE shop_name = ?;`, [
            price,
            shop_name,
        ]);
        results = results;
        return { status: results.affectedRows > 0, price: old_price };
    }
    async editAmount(shop_name, account, amount) {
        let [old, _o] = await this.database.promise().execute(`SELECT mask_amount FROM shop WHERE shop_name = ? AND EXISTS
        (SELECT * FROM shop AS S NATURAL JOIN role NATURAL JOIN user
         WHERE S.SID = shop.SID AND account = ?);`, [shop_name, account]);
        old = old;
        if (old.length != 1) {
            return Promise.reject("Something terrible happened");
        }
        const old_amount = old[0].mask_amount;
        const amount_ = parseFloat(amount);
        if (Number.isNaN(amount_) || !Number.isInteger(amount_) || amount_ < 0) {
            return { status: false, amount: old_amount };
        }
        let [results, _] = await this.database
            .promise()
            .execute(`UPDATE shop SET mask_amount = ? WHERE shop_name = ?;`, [
            amount,
            shop_name,
        ]);
        results = results;
        return { status: results.affectedRows > 0, amount: old_amount };
    }
    async searchShop(account, onlyMyShop, shop_name, shop_city, price_min, price_max, amount) {
        let shops = [];
        let args = [];
        let filterQueries = [];
        if (onlyMyShop) {
            filterQueries = filterQueries.concat(`shop.SID in (SELECT SID FROM
          shop NATURAL JOIN role NATURAL JOIN user
          WHERE account = ?)`);
            args = args.concat(account);
        }
        if (shop_name.length > 0) {
            // console.log(mysql.escape(`'%${shop_name.toLowerCase()}%'`));
            filterQueries = filterQueries.concat(`LOWER(shop_name) LIKE ` + mysql.escape(`%${shop_name.toLowerCase()}%`) // check SQL injection
            );
        }
        if (shop_city != "All") {
            filterQueries = filterQueries.concat(`shop_city = ?`);
            args = args.concat(shop_city);
        }
        const price_min_n = parseInt(price_min);
        const price_max_n = parseInt(price_max);
        if (!Number.isNaN(price_min_n)) {
            filterQueries = filterQueries.concat(`mask_price >= ?`);
            args = args.concat(price_min_n);
        }
        if (!Number.isNaN(price_max_n)) {
            filterQueries = filterQueries.concat(`mask_price <= ?`);
            args = args.concat(price_max_n);
        }
        switch (amount) {
            case "All":
                break;
            case "(Sold out) 0":
                filterQueries = filterQueries.concat(`mask_amount = 0`);
                break;
            case "(Rare) 1 ~ 99":
                filterQueries = filterQueries.concat(`mask_amount > 0 AND mask_amount < 100`);
                break;
            case "(Adequate) 100+":
                filterQueries = filterQueries.concat(`mask_amount >= 100`);
                break;
            default:
                break;
        }
        const q = filterQueries.join(" AND ");
        // console.log("search filters", q);
        let [results, _] = await this.database
            .promise()
            .execute(`SELECT shop_name, shop_city, mask_price, mask_amount FROM shop` +
            (q.length > 0 ? " WHERE " : "") +
            q +
            ";", args);
        results = results;
        results.forEach((val, index, raw) => {
            let s = {
                name: val.shop_name,
                city: val.shop_city,
                price: val.mask_price,
                amount: val.mask_amount,
            };
            shops = shops.concat(s);
        });
        return shops;
    }
    async placeOrder(account, shop, buy_amount) {
        let aq = this.database
            .promise()
            .query(`SELECT SID, mask_amount, mask_price FROM shop WHERE shop_name = ?;`, [shop]);
        let uq = this.database
            .promise()
            .query(`SELECT UID FROM user WHERE account = ?;`, [account]);
        let [ar, ur] = await Promise.all([aq, uq]);
        let arr = ar[0];
        let urr = ur[0];
        if (arr.length == 0 || urr.length == 0) {
            return false;
        }
        let mask_amount = Number.parseInt(arr[0].mask_amount);
        let mask_price = Number.parseInt(arr[0].mask_price);
        let sid = Number.parseInt(arr[0].SID);
        let uid = Number.parseInt(urr[0].UID);
        if (mask_amount < buy_amount) {
            return false;
        }
        let conn = await this.database.promise().getConnection();
        try {
            await conn.beginTransaction();
            let date_ = formatTime(new Date());
            console.log("order placed at:", date_);
            let ao = conn.execute(`INSERT INTO orders VALUES (0, ?, 'p', ?, ?, NULL, NULL, ?, ?);`, [sid, uid, date_, mask_price, buy_amount]);
            let ms = conn.execute(`UPDATE shop SET mask_amount = ? WHERE SID = ?;`, [
                mask_amount - buy_amount,
                sid,
            ]);
            let [order_r, shop_u] = (await Promise.all([ao, ms]));
            if (order_r.affectedRows == 0 ||
                shop_u.affectedRows == 0) {
                throw Error("cannot insert into orders");
            }
            await conn.commit();
        }
        catch (error) {
            await conn.rollback();
            return false;
        }
        finally {
            conn.release();
        }
        return true;
    }
    async getUserOrder(account, status) {
        let query = `SELECT OID, status, create_time, finish_time, 
    amount, price, shop_name, created.account AS creator,
    finished.account AS finisher FROM
    (SELECT OID, status, create_time, finish_time,  
    amount, price, shop_name, UID_create, UID_finish FROM
    orders NATURAL JOIN shop WHERE 
    UID_create = (SELECT UID FROM user WHERE account = ?)) AS ord
      JOIN (SELECT UID, account FROM user) AS created
      ON ord.UID_create = created.UID 
      LEFT JOIN (SELECT UID, account FROM user) AS finished
      ON (ord.UID_finish is NOT NULL AND ord.UID_finish = finished.UID)`;
        let args = [account];
        if (status != "All") {
            query += " AND status = ?";
            args = args.concat([STATUS_DICT.get(status)]);
        }
        query += ";";
        let [oq, _] = await this.database.promise().query(query, args);
        oq = oq;
        let orders = new Array();
        oq.forEach((val, i) => {
            let or = {
                oid: val.OID,
                shop: val.shop_name,
                status: STATUS_DICT.get(val.status),
                total_price: `$${Number.parseInt(val.amount) * Number.parseInt(val.price)}<br>
        (${val.amount} * $${val.price})`,
                start: formatTime(val.create_time) + `<br>${val.creator}`,
                end: formatTime(val.finish_time) +
                    (val.finisher == null ? "" : `<br>${val.finisher}`),
            };
            orders = orders.concat(or);
        });
        return orders;
    }
    async getShopOrder(account, status, shop_name) {
        let query = `SELECT OID, status, create_time, finish_time,
    amount, price, shop_name, created.account AS creator,
    finished.account AS finisher FROM     
    (SELECT OID, status, create_time, finish_time,  
    amount, price, shop_name, UID_create, UID_finish FROM
    orders NATURAL JOIN shop NATURAL JOIN role WHERE 
    UID = (SELECT UID FROM user WHERE account = ?)) AS ord 
      JOIN (SELECT UID, account FROM user) AS created
      ON ord.UID_create = created.UID 
      LEFT JOIN (SELECT UID, account FROM user) AS finished
      ON (ord.UID_finish is NOT NULL AND ord.UID_finish = finished.UID)`;
        let args = [account];
        if (shop_name != undefined) {
            query = query + " AND shop_name = ?";
            args = args.concat([shop_name]);
        }
        if (status != "All") {
            query += " AND status = ?";
            args = args.concat([STATUS_DICT.get(status)]);
        }
        query += ";";
        let [oq, _] = await this.database.promise().query(query, args);
        oq = oq;
        let orders = new Array();
        oq.forEach((val, i) => {
            let or = {
                oid: val.OID,
                shop: val.shop_name,
                status: STATUS_DICT.get(val.status),
                total_price: `$${Number.parseInt(val.amount) * Number.parseInt(val.price)}<br>
        (${val.amount} * $${val.price})`,
                start: formatTime(val.create_time) + `<br>${val.creator}`,
                end: formatTime(val.finish_time) +
                    (val.finisher == null ? "" : `<br>${val.finisher}`),
            };
            orders = orders.concat(or);
        });
        return orders;
    }
    async getWorkAt(account) {
        let shops = new Array();
        let [gw, _] = (await this.database.promise().query(`SELECT shop_name FROM shop NATURAL JOIN role WHERE 
        UID = (SELECT UID FROM user WHERE account = ?);`, [account]));
        gw.forEach((val) => {
            shops = shops.concat([val.shop_name]);
        });
        return shops;
    }
    async finishOrder(account, OIDs) {
        return true;
    }
    async cancelOrder(account, OIDs) {
        const conn = await this.database.promise().getConnection();
        let total = 0;
        for (let i = 0; i <= Math.floor(OIDs.length / 10); ++i) {
            try {
                let cur = OIDs.slice(10 * i, 10 * (i + 1));
                let joined = "(" + cur.join(", ") + ")";
                await conn.beginTransaction();
                let [va, _1] = (await conn.execute(`
        WITH 
          old(OID, SID, amount, mask_amount) AS 
          (SELECT aa.OID, aa.SID, aa.amount, bb.mask_amount
            FROM orders AS aa NATURAL JOIN
          (SELECT SID, mask_amount FROM shop FOR UPDATE) AS bb
            WHERE status = 'p' AND OID IN ${joined} FOR UPDATE) 
        UPDATE shop NATURAL JOIN old
        SET shop.mask_amount = old.mask_amount + old.amount;`));
                let date_ = formatTime(new Date());
                let [uc, _2] = (await conn.query(`
        UPDATE orders SET status = 'c', finish_time = ?,
        UID_finish = (SELECT UID FROM user WHERE account = ?)
        WHERE OID IN ${joined} AND (
          (UID_create IN (SELECT UID FROM user WHERE account = ?)) OR
          (SID IN (SELECT SID FROM role NATURAL JOIN user WHERE account = ?))          
        );`, [date_, account, account, account]));
                if (va.affectedRows != uc.affectedRows) {
                    throw new Error("shop update and order update mismatch");
                }
                total += va.affectedRows;
                await conn.commit();
            }
            catch (error) {
                await conn.rollback();
                console.log(error);
                return false;
            }
            finally {
                conn.release();
            }
        }
        return total == OIDs.length;
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map