-- CreateEnum
CREATE TYPE "TaskRepeat" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "repeat" "TaskRepeat",
ADD COLUMN     "repeatParentId" UUID;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_repeatParentId_fkey" FOREIGN KEY ("repeatParentId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
