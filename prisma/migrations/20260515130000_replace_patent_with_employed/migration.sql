-- Drop patent columns and add employed
ALTER TABLE "Migrant" DROP COLUMN "patentNumber";
ALTER TABLE "Migrant" DROP COLUMN "patentExpiry";
ALTER TABLE "Migrant" ADD COLUMN "employed" BOOLEAN NOT NULL DEFAULT false;
