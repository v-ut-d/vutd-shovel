-- CreateTable
CREATE TABLE "Member" (
    "guildId" VARCHAR(18) NOT NULL,
    "userId" VARCHAR(18) NOT NULL,
    "tone" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "f0" DOUBLE PRECISION NOT NULL,
    "htsvoice" TEXT NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("guildId","userId")
);

-- CreateTable
CREATE TABLE "Emoji" (
    "guildId" VARCHAR(18) NOT NULL,
    "emojiId" VARCHAR(18) NOT NULL,
    "pronounciation" TEXT NOT NULL,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("guildId","emojiId")
);
