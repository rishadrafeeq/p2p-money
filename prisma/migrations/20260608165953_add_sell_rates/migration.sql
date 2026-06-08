-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "sellMethod" TEXT;

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "upiSellRate" REAL NOT NULL DEFAULT 105,
    "impsSellRate" REAL NOT NULL DEFAULT 108,
    "updatedAt" DATETIME NOT NULL
);
