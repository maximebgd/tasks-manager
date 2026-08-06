-- AlterTable
ALTER TABLE "DailyTodo" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SubTodo" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DailyTodo_deletedAt_idx" ON "DailyTodo"("deletedAt");

-- CreateIndex
CREATE INDEX "SubTodo_deletedAt_idx" ON "SubTodo"("deletedAt");
