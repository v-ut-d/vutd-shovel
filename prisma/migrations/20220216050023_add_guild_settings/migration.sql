-- CreateTable
CREATE TABLE "GuildSettings" (
    "guildId" TEXT NOT NULL,
    "readMultiLine" BOOLEAN NOT NULL DEFAULT true,
    "readSpeakersName" BOOLEAN NOT NULL DEFAULT false,
    "readEmojis" BOOLEAN NOT NULL DEFAULT true,
    "omitThreashold" INTEGER NOT NULL DEFAULT 200,
    "dictionaryWriteRole" TEXT,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("guildId")
);
