"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mysql = require("mysql2");
const crypto = require("crypto");
function genHash(password) {
    var hash = crypto.createHash("sha256").update(password).digest("hex");
    return hash;
}
class Database {
    constructor() {
        this.database = mysql.createPool({
            host: "eecsvm1.westeurope.cloudapp.azure.com",
            user: "mask",
            password: "mask",
            database: "maskDB",
        });
        this.createTables();
    }
    createTables() {
        this.database.query(`CREATE TABLE IF NOT EXISTS user(
          UID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          account varchar(20) NOT NULL UNIQUE,
          password char(64) NOT NULL,
          phone varchar(10)
       );`);
        this.database.query(`CREATE TABLE IF NOT EXISTS shop(
          SID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          shop_name varchar(30) NOT NULL UNIQUE,
          shop_city varchar(30) NOT NULL,
          mask_amount int NOT NULL CHECK(mask_amount >= 0),
          mask_price int NOT NULL CHECK(mask_price >= 0)
      );`);
        // status 'c': canceled, 'p': pending, 'f': finished
        this.database.query(`CREATE TABLE IF NOT EXISTS \`order\` (
          OID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          status char(1) NOT NULL check (status in ('c', 'p', 'f')),
          create_time datetime NOT NULL,
          finish_time datetime NOT NULL
      );`);
        // role 'c': clerk, 'm': manager
        this.database.query(`CREATE TABLE IF NOT EXISTS role(
          UID INTEGER NOT NULL,
          SID INTEGER NOT NULL,
          role char(1) NOT NULL check (role in ('c', 'm')),
          PRIMARY KEY(UID, SID, role),
          FOREIGN KEY(UID) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(SID) REFERENCES shop(SID) ON DELETE CASCADE
      );`);
    }
    async registerUser(account, password, phone) {
        let [results, _,] = await this.database
            .promise()
            .execute("SELECT * FROM user WHERE account = ?", [account]);
        if (results.length == 1) {
            return false;
        }
        [
            results,
            _,
        ] = await this.database
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
          where account = ? and password = ?`, [account, genHash(password)]);
        return results.length == 1;
    }
    async getInfo(account) {
        let userInfo = this.database.promise().execute(`SELECT phone FROM user
          WHERE account = ?`, [account]);
        let manageShopInfo = this.database.promise().execute(`SELECT shop_name, shop_city, mask_amount, mask_price
       FROM role NATURAL JOIN user NATURAL JOIN shop
       WHERE account = ? AND role = 'm'`, [account]);
        let cityInfo = this.database
            .promise()
            .query(`SELECT DISTINCT shop_city FROM shop`);
        let [user_i, manage_i, city_i] = await Promise.all([
            userInfo,
            manageShopInfo,
            cityInfo,
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
            let shop_name = manage_i[0][0].shop_name;
            let [result, _] = await this.database.promise().execute(`SELECT UID, account, phone FROM role NATURAL JOIN user
            NATURAL JOIN shop WHERE shop_name = ?`, [shop_name]);
            result = result;
            for (let i = 0; i < result.length; ++i) {
                clerks.concat({
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
                manages: manage_i[0][0],
                clerks,
            };
        }
        else {
            return { account, phone, isManager, cities };
        }
    }
    async registerShop(shop, city, price, amount, account) {
        let [results, _,] = await this.database
            .promise()
            .execute(`SELECT * FROM shop where shop_name = ?`, [shop]);
        if (results.length > 0) {
            return false;
        }
        const conn = await this.database.promise().getConnection();
        await conn.beginTransaction();
        try {
            await conn.execute(`INSERT INTO shop VALUES (0, ?, ?, ?, ?);`, [
                shop,
                city,
                price,
                amount,
            ]);
            [results, _] = await conn.execute(`INSERT INTO role VALUES (
          (SELECT UID FROM user WHERE account = ?), 
          (SELECT SID FROM shop WHERE shop_name = ?), 'm');`, [account, shop]);
            await conn.commit();
        }
        catch (error) {
            await conn.rollback();
            conn.release();
            return false;
        }
        conn.release();
        return true;
    }
    async searchShop(onlyMyShop, shop_name, shop_city, price_min, price_max, amount) { }
    close() {
        this.database.end();
    }
}
exports.Database = Database;
function test() { }
//# sourceMappingURL=database.js.map