-- CreateTable
CREATE TABLE "GuildDictionary" (
    "guildId" TEXT NOT NULL,
    "replaceFrom" TEXT NOT NULL,
    "replaceTo" TEXT NOT NULL,

    CONSTRAINT "GuildDictionary_pkey" PRIMARY KEY ("guildId","replaceFrom")
);
