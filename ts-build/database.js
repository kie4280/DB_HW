"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const sql3 = require("sqlite3");
const DB_FILE = "test.db";
class Database {
    constructor() {
        this.database = new sql3.Database(DB_FILE);
    }
    createTables() {
        this.database.all("SELECT * FROM sqlite_master where type == 'table' and name == 'test'", function (err, row) {
            if (err != null) {
                console.log(err);
            }
            console.log(row.length);
        });
    }
}
exports.Database = Database;
var db = new Database();
db.createTables();
//# sourceMappingURL=database.js.map