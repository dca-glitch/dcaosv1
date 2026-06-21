-- AlterEnum
ALTER TYPE "AiDeliveryWorkflowRunStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "AiDeliveryWorkflowRun" ADD COLUMN     "executionError" TEXT,
ADD COLUMN     "executionLog" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);
