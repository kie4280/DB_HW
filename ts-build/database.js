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
    async getUserInfo(account) {
        let [results, _] = await this.database.promise().execute(`SELECT phone FROM user
          WHERE account = ?`, [account]);
        const phone = results[0].phone;
        [results, _] = await this.database.promise().execute(`SELECT shop_name, role FROM role NATURAL JOIN user
          NATURAL JOIN shop WHERE account = ?`, [account]);
        let worksAt = [];
        let manages = "";
        let isManager = false;
        for (let i = 0; i < results.length; i++) {
            const element = results[i];
            // console.log(element);
            isManager = isManager || element.role == "m";
            if (element.role != "m") {
                worksAt.concat(element.shop_name);
            }
            else {
                manages = element.shop_name;
            }
        }
        return { account, phone, isManager, manages, worksAt };
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
    async searchShop() { }
    close() {
        this.database.end();
    }
}
exports.Database = Database;
function test() {
    let db = new Database();
    let add = db.registerUser("13sf", "sdf", "sdffs");
    add.then((success) => {
        console.log(add);
        db.close();
    });
}
//# sourceMappingURL=database.js.map