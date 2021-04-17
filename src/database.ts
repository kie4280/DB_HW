import * as sql3 from "sqlite3"

const DB_FILE:string = "test.sb";

export class Database {
    database:sql3.Database;
    constructor() {
        this.database = new sql3.Database(DB_FILE);
    }

    createTables(database:sql3.Database) {
        database
        
    }
}




