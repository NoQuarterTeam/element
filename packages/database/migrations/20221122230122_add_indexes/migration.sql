-- CreateIndex
CREATE INDEX "Element_parentId_idx" ON "Element"("parentId");

-- CreateIndex
CREATE INDEX "Element_creatorId_idx" ON "Element"("creatorId");

-- CreateIndex
CREATE INDEX "Habit_startDate_idx" ON "Habit"("startDate");

-- CreateIndex
CREATE INDEX "Habit_creatorId_idx" ON "Habit"("creatorId");

-- CreateIndex
CREATE INDEX "HabitEntry_createdAt_idx" ON "HabitEntry"("createdAt");

-- CreateIndex
CREATE INDEX "HabitEntry_habitId_idx" ON "HabitEntry"("habitId");

-- CreateIndex
CREATE INDEX "HabitEntry_creatorId_idx" ON "HabitEntry"("creatorId");

-- CreateIndex
CREATE INDEX "Task_date_idx" ON "Task"("date");

-- CreateIndex
CREATE INDEX "Task_elementId_idx" ON "Task"("elementId");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");
