/*
  Warnings:

  - You are about to drop the column `teamId` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TeamToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Element" DROP CONSTRAINT "Element_teamId_fkey";

-- DropForeignKey
ALTER TABLE "_TeamToUser" DROP CONSTRAINT "_TeamToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_TeamToUser" DROP CONSTRAINT "_TeamToUser_B_fkey";

-- AlterTable
ALTER TABLE "Element" DROP COLUMN "teamId";

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "_TeamToUser";
