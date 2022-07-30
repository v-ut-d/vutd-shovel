/*
  Warnings:

  - You are about to drop the column `f0` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `htsvoice` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `speed` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `Member` table. All the data in the column will be lost.
  - Added the required column `synthesisEngine` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `synthesisOptions` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Member"
ADD COLUMN     "synthesisEngine" TEXT,
ADD COLUMN     "synthesisOptions" JSONB;

UPDATE "Member" SET "synthesisEngine"='openjtalk',
"synthesisOptions"=('{"f0":'||"f0"||',"htsvoice":"'||"htsvoice"||'","speed":'||"speed"||',"tone":'||"tone"||'}')::jsonb;

ALTER TABLE "Member" 
DROP COLUMN "f0",
DROP COLUMN "htsvoice",
DROP COLUMN "speed",
DROP COLUMN "tone",
ALTER COLUMN     "synthesisEngine" SET NOT NULL,
ALTER COLUMN     "synthesisOptions" SET NOT NULL;
