-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "migrantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inspection_migrantId_fkey" FOREIGN KEY ("migrantId") REFERENCES "Migrant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
