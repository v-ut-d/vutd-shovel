-- CreateTable
CREATE TABLE "User" (
    "guildId" VARCHAR(18) NOT NULL,
    "userId" VARCHAR(18) NOT NULL,
    "tone" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "f0" INTEGER NOT NULL,
    "htsvoice" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("guildId","userId")
);

-- CreateTable
CREATE TABLE "Emoji" (
    "guildId" VARCHAR(18) NOT NULL,
    "emojiId" VARCHAR(18) NOT NULL,
    "pronounciation" TEXT NOT NULL,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("guildId","emojiId")
);
