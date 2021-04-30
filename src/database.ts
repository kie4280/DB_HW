import * as mysql from "mysql2";
import * as crypto from "crypto";

function genHash(password: string): string {
  var hash = crypto.createHash("sha256").update(password).digest("hex");
  return hash;
}

type SHOP = {
  shop: string;
  city: string;
  price: number;
  amount: number;
};

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
          mask_amount int NOT NULL,
          mask_price int NOT NULL,
          CONSTRAINT chk_s CHECK(mask_amount >= 0 AND mask_price >= 0)
      );`
    );

    // status 'c': canceled, 'p': pending, 'f': finished
    this.database.query(
      `CREATE TABLE IF NOT EXISTS \`order\` (
          OID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          status char(1) NOT NULL,
          create_time datetime NOT NULL,
          finish_time datetime NOT NULL,
          CONSTRAINT chk_o CHECK(status in ('c', 'p', 'f'))
      );`
    );

    // role 'c': clerk, 'm': manager
    this.database.query(
      `CREATE TABLE IF NOT EXISTS role(
          UID INTEGER NOT NULL,
          SID INTEGER NOT NULL,
          role char(1) NOT NULL,
          PRIMARY KEY(UID, SID, role),
          FOREIGN KEY(UID) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(SID) REFERENCES shop(SID) ON DELETE CASCADE,
          CONSTRAINT chk_r CHECK(role in ('c', 'm'))
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

  public async getInfo(
    account: string
  ): Promise<{
    account: string;
    phone: string;
    isManager: boolean;
    cities: string[];
    manages?: {
      shop_name: string;
      shop_city: string;
      mask_amount: number;
      mask_price: number;
    };
    clerks?: Array<{ id: number; account: string; phone: string }>;
  }> {
    let Q_userInfo = this.database.promise().execute(
      `SELECT phone FROM user
          WHERE account = ?`,
      [account]
    );
    let Q_manageShopInfo = this.database.promise().execute(
      `SELECT shop_name, shop_city, mask_amount, mask_price
       FROM role NATURAL JOIN user NATURAL JOIN shop
       WHERE account = ? AND role = 'm'`,
      [account]
    );

    let Q_cityInfo = this.database
      .promise()
      .query(`SELECT DISTINCT shop_city FROM shop`);

    let [user_i, manage_i, city_i] = await Promise.all([
      Q_userInfo,
      Q_manageShopInfo,
      Q_cityInfo,
    ]);
    const phone = user_i[0][0].phone;
    let cities: string[] = [];
    let cities_i = city_i[0] as mysql.RowDataPacket[];
    for (let i = 0; i < cities_i.length; ++i) {
      cities = cities.concat(cities_i[i].shop_city);
    }

    let clerks: Array<{
      id: number;
      account: string;
      phone: string;
    }> = [];
    let isManager: boolean = (manage_i[0] as mysql.RowDataPacket[]).length > 0;

    if (isManager) {
      let shop_name = manage_i[0][0].shop_name;
      let [result, _] = await this.database.promise().execute(
        `SELECT UID, account, phone FROM role NATURAL JOIN user
            NATURAL JOIN shop WHERE shop_name = ? AND role != 'm';`,
        [shop_name]
      );
      result = result as mysql.RowDataPacket[];
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
        manages: manage_i[0][0],
        clerks,
      };
    } else {
      return { account, phone, isManager, cities };
    }
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
      conn.release();
      return false;
    }
    conn.release();
    return true;
  }

  public async addClerk(
    account: string,
    shop: string
  ): Promise<{
    status: boolean;
    id?: number;
    account?: string;
    phone?: string;
    err?: string;
  }> {
    let checkRole = this.database.promise().execute(
      `SELECT UID FROM 
        user NATURAL JOIN role NATURAL JOIN shop
        WHERE account = ? AND shop_name = ?;
      `,
      [account, shop]
    );
    let checkUser = this.database.promise().execute(
      `SELECT UID, account, phone 
        FROM user WHERE account = ?`,
      [account]
    );
    let [role_i, user_i] = await Promise.all([checkRole, checkUser]);
    const alreadyWorking = (role_i[0] as mysql.RowDataPacket[]).length > 0;
    const user = user_i[0] as mysql.RowDataPacket[];
    if (alreadyWorking) {
      return { status: false, err: "*Already working in this shop!" };
    } else if (user.length != 1) {
      return { status: false, err: "*No such user!" };
    }

    let [insert_r, _] = await this.database.promise().execute(
      `INSERT INTO role VALUES (
        (SELECT UID FROM user WHERE account = ?),
        (SELECT SID FROM shop WHERE shop_name = ?),
        'c');`,
      [account, shop]
    );
    const insert_suc = (insert_r as mysql.OkPacket).affectedRows > 0;
    if (insert_suc) {
      return {
        status: true,
        id: user[0].UID,
        account: user[0].account,
        phone: user[0].phone,
      };
    } else {
      return {
        status: false,
        err: "*Cannot add clerk, sorry!",
      };
    }
  }

  public async deleteClerk(
    account: string,
    shop: string
  ): Promise<{ status: boolean; id?: number }> {
    let [userinfo, _1] = await this.database.promise().execute(
      `SELECT UID, account, SID FROM 
        user NATURAL JOIN role NATURAL JOIN shop
        WHERE account = ? AND shop_name = ?`,
      [account, shop]
    );
    userinfo = userinfo as mysql.RowDataPacket[];
    if (userinfo.length == 0) {
      return { status: false };
    }
    const UID = userinfo[0].UID;
    const SID = userinfo[0].SID;

    let [deleteOP, _2] = await this.database.promise().execute(
      `DELETE FROM role 
        WHERE UID = ? AND SID = ? AND role = 'c'`,
      [UID, SID]
    );

    deleteOP = deleteOP as mysql.OkPacket;
    return { status: deleteOP.affectedRows > 0, id: UID };
  }

  public async editPrice(shop_name: string, account: string, price: string) {
    let [old, _o] = await this.database.promise().execute(
      `SELECT mask_price FROM shop WHERE shop_name = ? AND EXISTS
        (SELECT * FROM shop AS S NATURAL JOIN role NATURAL JOIN user
         WHERE S.SID = shop.SID AND account = ?);`,
      [shop_name, account]
    );
    old = old as mysql.RowDataPacket[];
    if (old.length != 1) {
      return Promise.reject("Something terrible happened");
    }
    const old_price = old[0].mask_price;
    const price_: number = parseFloat(price);
    if (Number.isNaN(price_) || !Number.isInteger(price_) || price_ < 0) {
      return { status: false, price: old_price };
    }

    let [
      results,
      _,
    ] = await this.database
      .promise()
      .execute(`UPDATE shop SET mask_price = ? WHERE shop_name = ?;`, [
        price,
        shop_name,
      ]);

    results = results as mysql.OkPacket;
    return { status: results.affectedRows > 0, price: old_price };
  }

  public async editAmount(shop_name: string, account: string, amount: string) {
    let [old, _o] = await this.database.promise().execute(
      `SELECT mask_amount FROM shop WHERE shop_name = ? AND EXISTS
        (SELECT * FROM shop AS S NATURAL JOIN role NATURAL JOIN user
         WHERE S.SID = shop.SID AND account = ?);`,
      [shop_name, account]
    );
    old = old as mysql.RowDataPacket[];
    if (old.length != 1) {
      return Promise.reject("Something terrible happened");
    }

    const old_amount = old[0].mask_amount;
    const amount_: number = parseFloat(amount);
    if (Number.isNaN(amount_) || !Number.isInteger(amount_) || amount_ < 0) {
      return { status: false, amount: old_amount };
    }
    let [
      results,
      _,
    ] = await this.database
      .promise()
      .execute(`UPDATE shop SET mask_amount = ? WHERE shop_name = ?;`, [
        amount,
        shop_name,
      ]);

    results = results as mysql.OkPacket;
    return { status: results.affectedRows > 0, amount: old_amount };
  }

  public async searchShop(
    account: string,
    onlyMyShop: boolean,
    shop_name: string,
    shop_city: string,
    price_min: string,
    price_max: string,
    amount: string
  ): Promise<Array<SHOP>> {
    let shops: Array<SHOP> = [];
    let args: Array<any> = [];
    let filterQueries: Array<string> = [];
    if (onlyMyShop) {
      filterQueries = filterQueries.concat(
        `shop.SID in (SELECT SID FROM
          shop NATURAL JOIN role NATURAL JOIN user
          WHERE account = ?)`
      );
      args = args.concat(account);
    }

    if (shop_name.length > 0) {
      console.log(mysql.escape(`'%${shop_name.toLowerCase()}%'`));
      filterQueries = filterQueries.concat(
        `LOWER(shop_name) LIKE ` +
          mysql.escape(`%${shop_name.toLowerCase()}%`) // check SQL injection 
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
        filterQueries = filterQueries.concat(
          `mask_amount > 0 AND mask_amount < 100`
        );
        break;
      case "(Adequate) 100+":
        filterQueries = filterQueries.concat(`mask_amount >= 100`);
        break;
      default:
        break;
    }

    const q: string = filterQueries.join(" AND ");
    // console.log("search filters", q);
    let [results, _] = await this.database
      .promise()
      .execute(
        `SELECT shop_name, shop_city, mask_price, mask_amount FROM shop` +
          (q.length > 0 ? " WHERE " : "") +
          q,
        args
      );
    results = results as mysql.RowDataPacket[];
    results.forEach((val, index, raw) => {
      let s: SHOP = {
        shop: val.shop_name,
        city: val.shop_city,
        price: val.mask_price,
        amount: val.mask_amount,
      };
      shops = shops.concat(s);
    });

    return shops;
  }

  public close() {
    this.database.end();
  }
}

function test() {}
