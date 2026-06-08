-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NotificationDismissal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "dismissedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationDismissal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationDismissal_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "PushNotification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PushNotification_createdAt_idx" ON "PushNotification"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationDismissal_clientId_idx" ON "NotificationDismissal"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDismissal_clientId_notificationId_key" ON "NotificationDismissal"("clientId", "notificationId");
