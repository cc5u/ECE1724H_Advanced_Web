/*
  Warnings:

  - The primary key for the `datasets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `csv_url` on the `datasets` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `datasets` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `datasets` table. All the data in the column will be lost.
  - The primary key for the `training_sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `chosen_model` on the `training_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `csv_url` on the `training_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `data_preprocess_hyper_params` on the `training_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `figures_url` on the `training_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `training_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `model_hyper_params` on the `training_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `model_url` on the `training_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `training_sessions` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `models` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `csv_name` to the `datasets` table without a default value. This is not possible if the table is not empty.
  - The required column `dataset_id` was added to the `datasets` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `user_id` on the `datasets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `dataset_id` to the `training_sessions` table without a default value. This is not possible if the table is not empty.
  - The required column `session_id` was added to the `training_sessions` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `user_id` on the `training_sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `user_id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "datasets" DROP CONSTRAINT "datasets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "models" DROP CONSTRAINT "models_training_session_id_fkey";

-- DropForeignKey
ALTER TABLE "models" DROP CONSTRAINT "models_user_id_fkey";

-- DropForeignKey
ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "datasets" DROP CONSTRAINT "datasets_pkey",
DROP COLUMN "csv_url",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "csv_name" TEXT NOT NULL,
ADD COLUMN     "dataset_id" UUID NOT NULL,
ADD COLUMN     "session_id" UUID,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "datasets_pkey" PRIMARY KEY ("dataset_id");

-- AlterTable
ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_pkey",
DROP COLUMN "chosen_model",
DROP COLUMN "csv_url",
DROP COLUMN "data_preprocess_hyper_params",
DROP COLUMN "figures_url",
DROP COLUMN "id",
DROP COLUMN "model_hyper_params",
DROP COLUMN "model_url",
DROP COLUMN "updated_at",
ADD COLUMN     "dataset_id" UUID NOT NULL,
ADD COLUMN     "hyper_params" JSONB,
ADD COLUMN     "session_id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("session_id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- DropTable
DROP TABLE "models";

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("dataset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
