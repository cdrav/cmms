-- CreateTable
CREATE TABLE "WorkOrderChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrderChecklistItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrderMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "unit" TEXT,
    "referenceValue" REAL,
    "measuredValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrderMeasurement_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrderSignature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerRole" TEXT NOT NULL,
    "imageDataUrl" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrderSignature_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdverseEventCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "patientDocumentType" TEXT NOT NULL,
    "patientSex" TEXT NOT NULL,
    "patientAgeValue" INTEGER,
    "patientAgeUnit" TEXT,
    "eventDate" DATETIME NOT NULL,
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timing" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "outcome" TEXT,
    "outcomeOther" TEXT,
    "probableCauses" TEXT NOT NULL,
    "causeOther" TEXT,
    "correctiveActionsInitiated" BOOLEAN NOT NULL DEFAULT false,
    "reportedToDistributor" BOOLEAN NOT NULL DEFAULT false,
    "distributorReportDate" DATETIME,
    "distributorSentDate" DATETIME,
    "institutionalEmail" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABIERTO',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdverseEventCase_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdverseEventCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstitutionSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "institutionName" TEXT NOT NULL DEFAULT '',
    "logoDataUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "updatedAt" DATETIME NOT NULL
);
