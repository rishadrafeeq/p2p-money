-- CreateTable
CREATE TABLE "SupportThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportThread_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "body" TEXT,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "readByClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SupportThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportThread_clientId_key" ON "SupportThread"("clientId");

-- CreateIndex
CREATE INDEX "SupportThread_updatedAt_idx" ON "SupportThread"("updatedAt");

-- CreateIndex
CREATE INDEX "SupportMessage_threadId_idx" ON "SupportMessage"("threadId");

-- CreateIndex
CREATE INDEX "SupportMessage_createdAt_idx" ON "SupportMessage"("createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_readByAdmin_idx" ON "SupportMessage"("readByAdmin");

-- CreateIndex
CREATE INDEX "SupportMessage_readByClient_idx" ON "SupportMessage"("readByClient");
