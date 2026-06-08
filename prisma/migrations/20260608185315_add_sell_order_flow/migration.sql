-- CreateTable
CREATE TABLE "DepositAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "qrImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sellMethod" TEXT,
    "walletId" TEXT,
    "bankAccountId" TEXT,
    "depositAddressId" TEXT,
    "depositNetwork" TEXT,
    "depositAddressText" TEXT,
    "depositQr" TEXT,
    "usdtAmount" REAL,
    "inrAmount" REAL,
    "screenshot" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderApprovedAt" DATETIME,
    "paymentExpiresAt" DATETIME,
    "paymentSubmittedAt" DATETIME,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_depositAddressId_fkey" FOREIGN KEY ("depositAddressId") REFERENCES "DepositAddress" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("bankAccountId", "clientId", "confirmedAt", "createdAt", "id", "inrAmount", "note", "screenshot", "sellMethod", "status", "type", "usdtAmount", "walletId") SELECT "bankAccountId", "clientId", "confirmedAt", "createdAt", "id", "inrAmount", "note", "screenshot", "sellMethod", "status", "type", "usdtAmount", "walletId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");
CREATE INDEX "Transaction_bankAccountId_idx" ON "Transaction"("bankAccountId");
CREATE INDEX "Transaction_depositAddressId_idx" ON "Transaction"("depositAddressId");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DepositAddress_isActive_idx" ON "DepositAddress"("isActive");
