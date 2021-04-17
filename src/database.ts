import * as sql3 from "sqlite3"

const DB_FILE: string = "test.db";

export class Database {
    database: sql3.Database;
    constructor() {
        this.database = new sql3.Database(DB_FILE);
    }



    public createTables(): void {
        this.database.all("SELECT * FROM sqlite_master where type == 'table' and name == 'User'", (err: Error, row: any[]) => {
            if (err != null) {
                console.log(err);
                return;
            }
            console.log(row.length);
            if (row.length == 0) {
                this.database.run(
                    `CREATE TABLE User(
                        UID int NOT NULL AUTO_INCREMENT
                        account varchar(20) NOT NULL
                        password char(256) NOT NULL
                        name varchar(20)
                        PRIMARY KEY (UID)
                    );`
                );
            }
        });
        this.database.all("SELECT * FROM sqlite_master where type == 'table' and name == 'Shop'", (err: Error, row: any[]) => {
            if (err != null) {
                console.log(err);
                return;
            }
            console.log(row.length);
            if (row.length == 0) {
                this.database.run(
                    `CREATE TABLE Shop(
                        SID int NOT NULL AUTO_INCREMENT
                        name varchar(30) NOT NULL
                        mask_amount int NOT NULL
                        mask_price int NOT NULL
                        PRIMARY KEY (SID)
                    );`
                );
            }
        });
        this.database.all("SELECT * FROM sqlite_master where type == 'table' and name == 'Order'", (err: Error, row: any[]) => {
            if (err != null) {
                console.log(err);
                return;
            }
            console.log(row.length);
            if (row.length == 0) {
                this.database.run(
                    `CREATE TABLE Order(
                        OID int NOT NULL AUTO_INCREMENT
                        status char(1) NOT NULL check in ('c', 'p', 'f')
                        create_time datetime NOT NULL
                        finish_time datetime NOT NULL
                        PRIMARY KEY (OID)
                    );`
                );
            }
        });
        this.database.all("SELECT * FROM sqlite_master where type == 'table' and name == 'Role'", (err: Error, row: any[]) => {
            if (err != null) {
                console.log(err);
                return;
            }
            console.log(row.length);
            if (row.length == 0) {
                this.database.run(
                    `CREATE TABLE Role(
                        UID int NOT NULL
                        SID int NOT NULL
                        role char(1) NOT NULL check in ('c', 'm')
                        PRIMARY KEY (UID, SID, role)
                        FOREIGN KEY (UID) REFERENCES User(UID)
                        FOREIGN KEY (SID) REFERENCES Shop(SID)
                    );`
                );
            }
        });
    }
}


var db = new Database();
db.createTables();

