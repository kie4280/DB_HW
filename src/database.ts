import * as crypto from "crypto";
import * as mysql from "mysql2";

function genHash(password: string): string {
  var hash = crypto.createHash("sha256").update(password).digest("hex");
  return hash;
}

function formatTime(in_date: Date): string {
  if (in_date == null) return "";
  let year = in_date.getFullYear();
  let month = in_date
    .getMonth()
    .toLocaleString("en-US", { minimumIntegerDigits: 2 });
  let date = in_date
    .getDate()
    .toLocaleString("en-US", { minimumIntegerDigits: 2 });
  let hour = in_date
    .getHours()
    .toLocaleString("en-US", { minimumIntegerDigits: 2 });
  let minute = in_date
    .getMinutes()
    .toLocaleString("en-US", { minimumIntegerDigits: 2 });
  let second = in_date
    .getSeconds()
    .toLocaleString("en-US", { minimumIntegerDigits: 2 });

  let date_: string = `${year}/${month}/${date} ${hour}:${minute}:${second}`;
  return date_;
}

type SHOP = {
  name: string;
  city: string;
  price: number;
  amount: number;
};

type ORDER = {
  oid: number;
  status: string;
  start: string;
  end: string;
  shop: string;
  total_price: number;
};

export class Database {
  database: mysql.Pool;
  constructor() {
    this.database = mysql.createPool({
      host: "eecsvm1.westeurope.cloudapp.azure.com",
      user: "mask",
      password: "mask",
      database: "maskDB",
      connectionLimit: 10,
    });
    this.createTables();
  }

  public close() {
    this.database.end();
  }

  private createTables(): void {
    this.database.query(
      `CREATE TABLE IF NOT EXISTS user(
          UID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          account varchar(20) BINARY NOT NULL UNIQUE,
          password char(64) NOT NULL,
          phone varchar(10)
       );`
    );

    this.database.query(
      `CREATE TABLE IF NOT EXISTS shop(
          SID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          shop_name varchar(30) BINARY NOT NULL UNIQUE,
          shop_city varchar(30) NOT NULL,
          mask_amount int NOT NULL,
          mask_price int NOT NULL,
          CONSTRAINT chk_s CHECK(mask_amount >= 0 AND mask_price >= 0)
      );`
    );

    // status 'c': canceled, 'p': pending, 'f': finished
    this.database.query(
      `CREATE TABLE IF NOT EXISTS orders(
          OID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
          SID INTEGER NOT NULL, 
          status char(1) NOT NULL,
          UID_create INTEGER NOT NULL,
          create_time DATETIME,
          UID_finish INTEGER,
          finish_time DATETIME,
          price INTEGER NOT NULL,
          amount INTEGER NOT NULL,
          FOREIGN KEY(UID_create) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(UID_finish) REFERENCES user(UID) ON DELETE CASCADE,
          FOREIGN KEY(SID) REFERENCES shop(SID) ON DELETE CASCADE,
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
    let [results, _] = await this.database
      .promise()
      .execute("SELECT * FROM user WHERE account = ?", [account]);

    if ((results as any).length == 1) {
      return false;
    }

    [results, _] = await this.database
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

  public async getInfo(account: string): Promise<{
    account: string;
    phone: string;
    isManager: boolean;
    cities: string[];
    manages: SHOP;
    clerks: Array<{ id: number; account: string; phone: string }>;
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
      let shop: SHOP = {
        name: manage_i[0][0].shop_name,
        city: manage_i[0][0].shop_city,
        price: manage_i[0][0].mask_price,
        amount: manage_i[0][0].mask_amount,
      };

      let [result, _] = await this.database.promise().execute(
        `SELECT UID, account, phone FROM role NATURAL JOIN user
            NATURAL JOIN shop WHERE shop_name = ? AND role != 'm';`,
        [shop.name]
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
        manages: shop,
        clerks,
      };
    } else {
      return { account, phone, isManager, cities, manages: null, clerks };
    }
  }

  public async registerShop(
    shop: string,
    city: string,
    price: number,
    amount: number,
    account: string
  ) {
    let [results, _] = await this.database
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
        amount,
        price,
      ]);

      await conn.execute(
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

    let [results, _] = await this.database
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
    let [results, _] = await this.database
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
      // console.log(mysql.escape(`'%${shop_name.toLowerCase()}%'`));
      filterQueries = filterQueries.concat(
        `LOWER(shop_name) LIKE ` + mysql.escape(`%${shop_name.toLowerCase()}%`) // check SQL injection
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
        name: val.shop_name,
        city: val.shop_city,
        price: val.mask_price,
        amount: val.mask_amount,
      };
      shops = shops.concat(s);
    });

    return shops;
  }

  public async placeOrder(
    account: string,
    shop: string,
    buy_amount: number
  ): Promise<boolean> {
    let aq = this.database
      .promise()
      .query(
        `SELECT SID, mask_amount, mask_price FROM shop WHERE shop_name = ?`,
        [shop]
      );
    let uq = this.database
      .promise()
      .query(`SELECT UID FROM user WHERE account = ?`, [account]);
    let [ar, ur] = await Promise.all([aq, uq]);
    let arr = ar[0] as mysql.RowDataPacket[];
    let urr = ur[0] as mysql.RowDataPacket[];
    if (arr.length == 0 || urr.length == 0) {
      return false;
    }
    let mask_amount: number = Number.parseInt(arr[0].mask_amount as string);
    let mask_price: number = Number.parseInt(arr[0].mask_price as string);
    let sid = Number.parseInt(arr[0].SID as string);
    let uid = Number.parseInt(urr[0].UID as string);
    if (mask_amount < buy_amount) {
      return false;
    }

    let conn = await this.database.promise().getConnection();
    try {
      await conn.beginTransaction();
      let date_ = formatTime(new Date());
      console.log("order placed at:", date_);
      let ao = conn.execute(
        `INSERT INTO orders VALUES (0, ?, 'p', ?, ?, NULL, NULL, ?, ?)`,
        [sid, uid, date_, mask_price, buy_amount]
      );
      let ms = conn.execute(`UPDATE shop SET mask_amount = ? WHERE SID = ?`, [
        mask_amount - buy_amount,
        sid,
      ]);
      let [order_r, shop_u] = (await Promise.all([ao, ms])) as [any, any];
      if (
        (order_r as mysql.OkPacket).affectedRows == 0 ||
        (shop_u as mysql.OkPacket).affectedRows == 0
      ) {
        throw Error("cannot insert into orders");
      }
      await conn.commit();
      conn.release();
    } catch (error) {
      await conn.rollback();
      conn.release();
      return false;
    }

    return true;
  }

  public async getUserOrder(
    account: string,
    status: string
  ): Promise<Array<ORDER>> {
    let query = `SELECT OID, status, create_time, finish_time,  
    mask_amount, mask_price, shop_name FROM
    orders NATURAL JOIN shop WHERE 
    UID_create = (SELECT UID FROM user WHERE account = ?)`;
    let args = [account];

    if (status != "All") {
      query += " AND status = ?";
      switch (status) {
        case "Finished":
          args = args.concat(["f"]);
          break;
        case "Not finished":
          args = args.concat(["p"]);
          break;
        case "Cancelled":
          args = args.concat(["c"]);
          break;
        default:
          break;
      }
    }
    let [oq, _] = await this.database.promise().query(query, args);
    oq = oq as mysql.RowDataPacket[];
    let orders = new Array<ORDER>();
    oq.forEach((val, i) => {
      let or: ORDER = {
        oid: val.OID,
        shop: val.shop_name,
        status: val.status,
        total_price: val.mask_amount * val.mask_price,
        start: formatTime(val.create_time),
        end: formatTime(val.finish_time),
      };
      orders = orders.concat(or);
    });
    return orders;
  }

  public async getShopOrder(
    account: string,
    status: string,
    shop_name?: string
  ): Promise<Array<ORDER>> {
    let query = `SELECT OID, status, create_time, finish_time,  
    mask_amount, mask_price, shop_name FROM
    orders NATURAL JOIN shop NATURAL JOIN role WHERE 
    UID = (SELECT UID FROM user WHERE account = ?)`;
    let args = [account];
    if (shop_name != undefined) {
      query = query + " AND shop_name = ?";
      args = args.concat([shop_name]);
    }
    if (status != "All") {
      query += " AND status = ?";
      switch (status) {
        case "Finished":
          args = args.concat(["f"]);
          break;
        case "Not finished":
          args = args.concat(["p"]);
          break;
        case "Cancelled":
          args = args.concat(["c"]);
          break;
        default:
          break;
      }
    }
    let [oq, _] = await this.database.promise().query(query, args);
    oq = oq as mysql.RowDataPacket[];
    let orders = new Array<ORDER>();
    oq.forEach((val, i) => {
      let or: ORDER = {
        oid: val.OID,
        shop: val.shop_name,
        status: val.status,
        total_price: val.mask_amount * val.mask_price,
        start: formatTime(val.create_time),
        end: formatTime(val.finish_time),
      };
      orders = orders.concat(or);
    });
    return orders;
  }
}
