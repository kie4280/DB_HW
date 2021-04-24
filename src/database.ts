import * as sql from "mysql";
import * as crypto from "crypto";

function genHash(password: string): string {
  var hash = crypto.createHash("sha256").update(password).digest("hex");
  return hash;
}

export class Database {
  database: sql.Connection;
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
          city varchar(30) NOT NULL,
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

  public async addUser(account: string, password: string, phone: string) {
    let aa = new Promise<boolean>((resolve, reject) => {
      let q = this.database.query(
        "SELECT * FROM user WHERE account = ?",
        [account],
        (err, results, fields) => {
          if (err) {
            reject(err.message);
            console.log(err.message);
          } else {
            resolve(results.length > 0);
          }
        }
      );
    }).then((hasUser) => {
      if (hasUser) {
        return false;
      }

      let bb = new Promise<boolean>((resolve, reject) => {
        let q = this.database.query(
          "INSERT INTO user VALUES (0, ?, ?, ?)",
          [account, genHash(password), phone],
          (err, results, fields) => {
            if (err) {
              reject(err);
              console.log(err.message);
            } else {
              resolve(results.affectedRows > 0);
            }
          }
        );
      });
      return bb;
    });

    return aa;
  }

  public async checkpassword(account: string, password: string) {
    let aa = new Promise<boolean>((resolve, reject) => {
      this.database.query(
        `SELECT account, password FROM user
          where account = ? and password = ?`,
        [account, genHash(password)],
        (err, results, fields) => {
          if (err) {
            reject(err);
          } else {
            resolve(results.length > 0);
          }
        }
      );
    });
    return aa;
  }

  public async getUserInfo(account: string) {
    let first = () => {
      return new Promise<string>((resolve, reject) => {
        this.database.query(
          `SELECT phone FROM user
            WHERE account = ?`,
          [account],
          (err, results, fields) => {
            if (err) {
              reject(err);
            } else {
              resolve(results[0].phone);
            }
          }
        );
      });
    };
    let second = (phone: string) => {
      return new Promise<{
        account: string;
        phone: string;
        isManager: boolean;
        manages: string;
        worksAt: string[];
      }>((resolve, reject) => {
        let worksAt: Array<string> = [];
        let manages: string = "";
        this.database.query(
          `SELECT name, role FROM role NATURAL JOIN user
            NATURAL JOIN shop WHERE account = ?`,
          [account],
          (err, results, fields) => {
            if (err) {
              return reject(err);
            } else {
              let isManager: boolean = false;
              for (let i = 0; i < results.length; i++) {
                const element = results[i];
                // console.log(element);
                isManager = isManager || element.role == "c";
                if (element.role != "c") {
                  worksAt.concat(element.name);
                } else {
                  manages = element.name;
                }
              }
              resolve({ account, phone, isManager, manages, worksAt });
            }
          }
        );
      });
    };

    return first().then(second);
  }

  public async searchShop() {
    
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
    db.close();
  });
}
