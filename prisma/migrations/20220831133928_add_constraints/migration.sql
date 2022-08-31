-- DropForeignKey
ALTER TABLE "Habit" DROP CONSTRAINT "Habit_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "HabitEntry" DROP CONSTRAINT "HabitEntry_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "HabitEntry" DROP CONSTRAINT "HabitEntry_habitId_fkey";

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitEntry" ADD CONSTRAINT "HabitEntry_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitEntry" ADD CONSTRAINT "HabitEntry_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
