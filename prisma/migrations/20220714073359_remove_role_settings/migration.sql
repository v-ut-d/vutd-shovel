/*
  Warnings:

  - You are about to drop the column `dictionaryWriteRole` on the `GuildSettings` table. All the data in the column will be lost.
  - You are about to drop the column `moderatorRole` on the `GuildSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GuildSettings" DROP COLUMN "dictionaryWriteRole",
DROP COLUMN "moderatorRole";
