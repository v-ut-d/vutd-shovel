-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(18) NOT NULL,
    "tone" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "f0" INTEGER NOT NULL,
    "htsvoice" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emoji" (
    "id" VARCHAR(18) NOT NULL,
    "pronounciation" TEXT NOT NULL,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("id")
);
