-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LadderStanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "stepLabel" TEXT NOT NULL DEFAULT 'Initiate',
    "level" INTEGER DEFAULT 5,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LadderStanding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LadderStanding" ("id", "level", "points", "stepLabel", "updatedAt", "userId") SELECT "id", "level", "points", "stepLabel", "updatedAt", "userId" FROM "LadderStanding";
DROP TABLE "LadderStanding";
ALTER TABLE "new_LadderStanding" RENAME TO "LadderStanding";
CREATE UNIQUE INDEX "LadderStanding_userId_key" ON "LadderStanding"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
