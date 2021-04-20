import e = require("express");
import * as sql from "mysql"


export class Database {
  database: sql.Connection;
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



  private createTables(): void {


    this.database.query(
      `CREATE TABLE IF NOT EXISTS user(
          UID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          account varchar(20) NOT NULL UNIQUE,
          password char(64) NOT NULL,
          phone varchar(10)
       );`
    );



    this.database.query(
      `CREATE TABLE IF NOT EXISTS shop(
          SID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          name varchar(30) NOT NULL UNIQUE,
          mask_amount int NOT NULL,
          mask_price int NOT NULL
      );`
    );


    // status 'c': canceled, 'p': pending, 'f': finished
    this.database.query(
      `CREATE TABLE IF NOT EXISTS \`order\` (
          OID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          status char(1) NOT NULL check (status in ('c', 'p', 'f')),
          create_time datetime NOT NULL,
          finish_time datetime NOT NULL
      );`
    );


    // role 'c': clerk, 'm': manager
    this.database.query(
      `CREATE TABLE IF NOT EXISTS role(
          UID INTEGER NOT NULL,
          SID INTEGER NOT NULL,
          role char(1) NOT NULL check (role in ('c', 'm')),
          PRIMARY KEY(UID, SID, role),
          FOREIGN KEY(UID) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(SID) REFERENCES shop(SID) ON DELETE CASCADE
      );`
    );

  }

  public async addUser(account: string, password: string,
    phone: string): Promise<boolean> {
    let aa = new Promise<boolean>((resolve, reject) => {
      let q = this.database.query(
        "INSERT INTO user VALUES (0, ?, ?, ?)", [account, password, phone],
        (err, results, fields) => {
          if (err) {

            // reject(err);
            console.log(err.message)
            resolve(false);
          } else {
            resolve(results.affectedRows > 0);
          }
        });
    });



    return aa;
  }

  public close() {
    this.database.end();
  }
}

function test() {
  let db = new Database();
  let add = db.addUser("13sf", "sdf", "sdffs");
  add.then((success) => {
    console.log(add);
    db.close()
  });
}





