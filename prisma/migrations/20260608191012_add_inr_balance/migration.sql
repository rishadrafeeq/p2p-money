-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "inviteCode" TEXT,
    "paymentPin" TEXT,
    "usdtBalance" REAL NOT NULL DEFAULT 0,
    "inrBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("createdAt", "id", "inviteCode", "mobile", "password", "paymentPin", "updatedAt", "usdtBalance") SELECT "createdAt", "id", "inviteCode", "mobile", "password", "paymentPin", "updatedAt", "usdtBalance" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_mobile_key" ON "Client"("mobile");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
