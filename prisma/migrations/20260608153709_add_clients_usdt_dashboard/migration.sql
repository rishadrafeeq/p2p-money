-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "inviteCode" TEXT,
    "usdtBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifsc" TEXT,
    "accountHolder" TEXT,
    "upiMobikwik" TEXT,
    "upiPhonepe" TEXT,
    "upiPaytm" TEXT,
    CONSTRAINT "PaymentDetail_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "usdtAmount" REAL,
    "inrAmount" REAL,
    "screenshot" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_mobile_key" ON "Client"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentDetail_clientId_key" ON "PaymentDetail"("clientId");

-- CreateIndex
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");

-- CreateIndex
CREATE INDEX "LoginAttempt_mobile_idx" ON "LoginAttempt"("mobile");

-- CreateIndex
CREATE INDEX "RegistrationAttempt_mobile_idx" ON "RegistrationAttempt"("mobile");
