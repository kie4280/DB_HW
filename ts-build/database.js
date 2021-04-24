"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const sql = require("mysql");
const crypto = require("crypto");
function genHash(password) {
    var hash = crypto.createHash("sha256").update(password).digest("hex");
    return hash;
}
class Database {
    constructor() {
        this.database = sql.createConnection({
            host: "vm1.australiacentral.cloudapp.azure.com",
            user: "mask",
            password: "mask",
            database: "maskDB",
        });
        this.database.connect();
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
          name varchar(30) NOT NULL UNIQUE,
          city varchar(30) NOT NULL,
          mask_amount int NOT NULL,
          mask_price int NOT NULL
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
    async addUser(account, password, phone) {
        let aa = new Promise((resolve, reject) => {
            let q = this.database.query("SELECT * FROM user WHERE account = ?", [account], (err, results, fields) => {
                if (err) {
                    reject(err.message);
                    console.log(err.message);
                }
                else {
                    resolve(results.length > 0);
                }
            });
        }).then((hasUser) => {
            if (hasUser) {
                return false;
            }
            let bb = new Promise((resolve, reject) => {
                let q = this.database.query("INSERT INTO user VALUES (0, ?, ?, ?)", [account, genHash(password), phone], (err, results, fields) => {
                    if (err) {
                        reject(err);
                        console.log(err.message);
                    }
                    else {
                        resolve(results.affectedRows > 0);
                    }
                });
            });
            return bb;
        });
        return aa;
    }
    async checkpassword(account, password) {
        let aa = new Promise((resolve, reject) => {
            this.database.query(`SELECT account, password FROM user
          where account = ? and password = ?`, [account, genHash(password)], (err, results, fields) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results.length > 0);
                }
            });
        });
        return aa;
    }
    async getUserInfo(account) {
        let first = () => {
            return new Promise((resolve, reject) => {
                this.database.query(`SELECT phone FROM user
            WHERE account = ?`, [account], (err, results, fields) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(results[0].phone);
                    }
                });
            });
        };
        let second = (phone) => {
            return new Promise((resolve, reject) => {
                let worksAt = [];
                let manages = "";
                this.database.query(`SELECT name, role FROM role NATURAL JOIN user
            NATURAL JOIN shop WHERE account = ?`, [account], (err, results, fields) => {
                    if (err) {
                        return reject(err);
                    }
                    else {
                        let isManager = false;
                        for (let i = 0; i < results.length; i++) {
                            const element = results[i];
                            // console.log(element);
                            isManager = isManager || element.role == "c";
                            if (element.role != "c") {
                                worksAt.concat(element.name);
                            }
                            else {
                                manages = element.name;
                            }
                        }
                        resolve({ account, phone, isManager, manages, worksAt });
                    }
                });
            });
        };
        return first().then(second);
    }
    async searchShop() {
    }
    close() {
        this.database.end();
    }
}
exports.Database = Database;
function test() {
    let db = new Database();
    let add = db.addUser("13sf", "sdf", "sdffs");
    add.then((success) => {
        console.log(add);
        db.close();
    });
}
//# sourceMappingURL=database.js.map