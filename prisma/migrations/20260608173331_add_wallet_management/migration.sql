-- CreateTable
CREATE TABLE "WalletAddAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "otp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'address_submitted',
    "adminMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletAddAttempt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "upiId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "canDeposit" BOOLEAN NOT NULL DEFAULT false,
    "canWithdraw" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wallet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wallet" ("canDeposit", "canWithdraw", "clientId", "createdAt", "id", "type", "upiId") SELECT "canDeposit", "canWithdraw", "clientId", "createdAt", "id", "type", "upiId" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE INDEX "Wallet_clientId_idx" ON "Wallet"("clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WalletAddAttempt_clientId_idx" ON "WalletAddAttempt"("clientId");

-- CreateIndex
CREATE INDEX "WalletAddAttempt_mobile_idx" ON "WalletAddAttempt"("mobile");
