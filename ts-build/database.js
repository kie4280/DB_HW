"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const sql = require("mysql");
class Database {
    constructor() {
        this.database = sql.createConnection({
            host: 'localhost',
            user: 'mask',
            password: 'mask',
            database: 'maskDB'
        });
        this.database.connect();
        this.createTables();
    }
    createTables() {
        this.database.query(`CREATE TABLE IF NOT EXISTS User(
          UID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          account varchar(20) NOT NULL UNIQUE,
          password char(64) NOT NULL,
          name varchar(20)
       );`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(results);
        });
        this.database.query(`CREATE TABLE IF NOT EXISTS Shop(
          SID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          name varchar(30) NOT NULL UNIQUE,
          mask_amount int NOT NULL,
          mask_price int NOT NULL
      );`);
        // status 'c': canceled, 'p': pending, 'f': finished
        this.database.query(`CREATE TABLE IF NOT EXISTS \`Order\` (
                        OID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                        status char(1) NOT NULL check (status in ('c', 'p', 'f')),
                        create_time datetime NOT NULL,
                        finish_time datetime NOT NULL
                    );`);
        // role 'c': clerk, 'm': manager
        this.database.query(`CREATE TABLE IF NOT EXISTS Role(
                        UID INTEGER NOT NULL,
                        SID INTEGER NOT NULL,
                        role char(1) NOT NULL check (role in ('c', 'm')),
                        PRIMARY KEY(UID, SID, role),
                        FOREIGN KEY(UID) REFERENCES User(UID),
                        FOREIGN KEY(SID) REFERENCES Shop(SID)
                    );`);
    }
    addUser(account, password, name) {
        let aa = new Promise((resolve, reject) => {
        });
        return false;
    }
}
exports.Database = Database;
let db = new Database();
//# sourceMappingURL=database.js.map