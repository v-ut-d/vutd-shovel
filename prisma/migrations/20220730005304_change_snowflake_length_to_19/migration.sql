/*
  Warnings:

  - The primary key for the `Emoji` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Member` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Emoji" DROP CONSTRAINT "Emoji_pkey",
ALTER COLUMN "guildId" SET DATA TYPE VARCHAR(19),
ALTER COLUMN "emojiId" SET DATA TYPE VARCHAR(19),
ADD CONSTRAINT "Emoji_pkey" PRIMARY KEY ("guildId", "emojiId");

-- AlterTable
ALTER TABLE "Member" DROP CONSTRAINT "Member_pkey",
ALTER COLUMN "guildId" SET DATA TYPE VARCHAR(19),
ALTER COLUMN "userId" SET DATA TYPE VARCHAR(19),
ADD CONSTRAINT "Member_pkey" PRIMARY KEY ("guildId", "userId");
