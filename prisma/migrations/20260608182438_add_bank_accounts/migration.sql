-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN "bankLabel" TEXT;

-- AlterTable
ALTER TABLE "WalletAddAttempt" ADD COLUMN "bankLabel" TEXT;

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "bankName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "usdtAmount" REAL,
    "inrAmount" REAL,
    "screenshot" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("clientId", "confirmedAt", "createdAt", "id", "inrAmount", "note", "screenshot", "sellMethod", "status", "type", "usdtAmount") SELECT "clientId", "confirmedAt", "createdAt", "id", "inrAmount", "note", "screenshot", "sellMethod", "status", "type", "usdtAmount" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");
CREATE INDEX "Transaction_bankAccountId_idx" ON "Transaction"("bankAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BankAccount_clientId_idx" ON "BankAccount"("clientId");
