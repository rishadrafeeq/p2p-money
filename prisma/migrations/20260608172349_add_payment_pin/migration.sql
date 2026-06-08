-- AlterTable
ALTER TABLE "Client" ADD COLUMN "paymentPin" TEXT;

-- CreateTable
CREATE TABLE "PaymentPinAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "paymentPin" TEXT NOT NULL,
    "otp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pin_requested',
    "adminMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentPinAttempt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PaymentPinAttempt_clientId_idx" ON "PaymentPinAttempt"("clientId");

-- CreateIndex
CREATE INDEX "PaymentPinAttempt_mobile_idx" ON "PaymentPinAttempt"("mobile");
