-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "purchaseCost" REAL;

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN "documentType" TEXT;

-- AlterTable
ALTER TABLE "InstitutionSettings" ADD COLUMN "address" TEXT;
ALTER TABLE "InstitutionSettings" ADD COLUMN "email" TEXT;
ALTER TABLE "InstitutionSettings" ADD COLUMN "healthRegistryCode" TEXT;
ALTER TABLE "InstitutionSettings" ADD COLUMN "phone" TEXT;
ALTER TABLE "InstitutionSettings" ADD COLUMN "siteName" TEXT;
ALTER TABLE "InstitutionSettings" ADD COLUMN "taxId" TEXT;
