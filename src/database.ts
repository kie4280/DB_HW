import * as mysql from "mysql2";
import * as crypto from "crypto";

function genHash(password: string): string {
  var hash = crypto.createHash("sha256").update(password).digest("hex");
  return hash;
}

export class Database {
  database: mysql.Pool;
  constructor() {
    this.database = mysql.createPool({
      host: "eecsvm1.westeurope.cloudapp.azure.com",
      user: "mask",
      password: "mask",
      database: "maskDB",
    });

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
          shop_name varchar(30) NOT NULL UNIQUE,
          shop_city varchar(30) NOT NULL,
          mask_amount int NOT NULL CHECK(mask_amount >= 0),
          mask_price int NOT NULL CHECK(mask_price >= 0)
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

  public async registerUser(account: string, password: string, phone: string) {
    let [
      results,
      _,
    ] = await this.database
      .promise()
      .execute("SELECT * FROM user WHERE account = ?", [account]);

    if ((results as any).length == 1) {
      return false;
    } else if (!password || !phone) {
      return true;
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

    return (results as any).affectedRows == 1;
  }

  public async checkpassword(account: string, password: string) {
    let [results, _] = await this.database.promise().execute(
      `SELECT account, password FROM user
          where account = ? and password = ?`,
      [account, genHash(password)]
    );
    return (results as any).length == 1;
  }

  public async getUserInfo(
    account: string
  ): Promise<{
    account: string;
    phone: string;
    isManager: boolean;
    manages: string;
    worksAt: string[];
  }> {
    let [results, _] = await this.database.promise().execute(
      `SELECT phone FROM user
          WHERE account = ?`,
      [account]
    );
    const phone = results[0].phone;

    [results, _] = await this.database.promise().execute(
      `SELECT shop_name, role FROM role NATURAL JOIN user
          NATURAL JOIN shop WHERE account = ?`,
      [account]
    );

    let worksAt: Array<string> = [];
    let manages: string = "";
    let isManager: boolean = false;

    for (let i = 0; i < (results as mysql.RowDataPacket[]).length; i++) {
      const element = results[i];
      // console.log(element);
      isManager = isManager || element.role == "m";
      if (element.role != "m") {
        worksAt.concat(element.shop_name);
      } else {
        manages = element.shop_name;
      }
    }
    return { account, phone, isManager, manages, worksAt };
  }

  public async registerShop(
    shop: string,
    city: string,
    price: number,
    amount: number,
    account: string
  ) {
    let [
      results,
      _,
    ] = await this.database
      .promise()
      .execute(`SELECT * FROM shop where shop_name = ?`, [shop]);

    if ((results as any).length > 0) {
      return false;
    } else if (!price || !amount) {
      return true;
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

      [results, _] = await conn.execute(
        `INSERT INTO role VALUES (
          (SELECT UID FROM user WHERE account = ?), 
          (SELECT SID FROM shop WHERE shop_name = ?), 'm');`,
        [account, shop]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      return false;
    }

    return true;
  }

  public async searchShop() {}

  public close() {
    this.database.end();
  }
}

function test() {
  let db = new Database();
  let add = db.registerUser("13sf", "sdf", "sdffs");
  add.then((success) => {
    console.log(add);
    db.close();
  });
}
