-- CreateEnum
CREATE TYPE "TrainingJobStatus" AS ENUM (
    'queued',
    'running',
    'evaluating',
    'completed',
    'error',
    'cancelled'
);

-- AlterTable
ALTER TABLE "training_sessions"
ADD COLUMN "status" "TrainingJobStatus" NOT NULL DEFAULT 'queued',
ADD COLUMN "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "error_message" TEXT,
ADD COLUMN "started_at" TIMESTAMP(3),
ADD COLUMN "completed_at" TIMESTAMP(3);
