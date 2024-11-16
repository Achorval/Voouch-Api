// src/db/migrate.ts
import path from "path";
import { db, poolConnection } from '../config/database';
import { migrate } from "drizzle-orm/mysql2/migrator";

const dbMigrate = async () => {
  try {
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, './migrations')
    });

    console.log(`✅ Migration Done!`);
    await poolConnection.end();
  } catch (error) {
    console.log("Migration eror: ", error);
    await poolConnection.end();
  }
};

dbMigrate();