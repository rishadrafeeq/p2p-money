-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "upiSellRate" REAL NOT NULL DEFAULT 105,
    "impsSellRate" REAL NOT NULL DEFAULT 108,
    "upiDailyLimit" REAL NOT NULL DEFAULT 100000,
    "impsDailyLimit" REAL NOT NULL DEFAULT 100000,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("id", "impsSellRate", "updatedAt", "upiSellRate") SELECT "id", "impsSellRate", "updatedAt", "upiSellRate" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
