-- Migration: Add Billing Module tables
-- Run: npx prisma db push (or npx prisma migrate dev --name add_billing)

-- BillingStatus enum
DO $$ BEGIN
  CREATE TYPE "BillingStatus" AS ENUM ('DRAFT', 'FINALISED', 'GOP_CREATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new AuditAction enum values (PostgreSQL requires ALTER TYPE for existing enums)
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BILLING_QUOTE_CREATED';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BILLING_QUOTE_UPDATED';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BILLING_QUOTE_FINALISED';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BILLING_GOP_CREATED';
EXCEPTION WHEN others THEN null; END $$;

-- BillingQuote table
CREATE TABLE IF NOT EXISTS "billing_quotes" (
  "id"                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "quoteNumber"          TEXT NOT NULL UNIQUE,
  "cpiId"                TEXT NOT NULL DEFAULT '',
  "patientName"          TEXT NOT NULL DEFAULT '',
  "dob"                  TIMESTAMPTZ,
  "gender"               TEXT,
  "phoneNumber"          TEXT,
  "departmentId"         TEXT,
  "departmentName"       TEXT,
  "attendingDoctorId"    TEXT,
  "attendingDoctorName"  TEXT,
  "lengthOfStay"         INTEGER,
  "procedureCode"        TEXT,
  "procedureName"        TEXT,
  "diagnosisCode"        TEXT,
  "diagnosisDescription" TEXT,
  "provisionalDiagnosis" TEXT,
  "doctorOrderSetId"     TEXT,
  "doctorOrderSetName"   TEXT,
  "pricingType"          TEXT NOT NULL DEFAULT 'NORMAL',
  "differentPricingId"   TEXT,
  "employerId"           TEXT,
  "employerName"         TEXT,
  "insurerId"            TEXT NOT NULL DEFAULT '',
  "insurerName"          TEXT NOT NULL DEFAULT '',
  "discountPackageId"    TEXT,
  "discountPackageName"  TEXT,
  "marketingPackageId"   TEXT,
  "marketingPackageName" TEXT,
  "quoteDate"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "status"               "BillingStatus" NOT NULL DEFAULT 'DRAFT',
  "totalNetAmount"       NUMERIC(12,2) NOT NULL DEFAULT 0,
  "gopRequestId"         TEXT,
  "createdBy"            TEXT NOT NULL,
  "createdByName"        TEXT NOT NULL DEFAULT '',
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "billing_quotes_cpiId_idx"    ON "billing_quotes"("cpiId");
CREATE INDEX IF NOT EXISTS "billing_quotes_status_idx"   ON "billing_quotes"("status");
CREATE INDEX IF NOT EXISTS "billing_quotes_quoteDate_idx" ON "billing_quotes"("quoteDate");
CREATE INDEX IF NOT EXISTS "billing_quotes_createdAt_idx" ON "billing_quotes"("createdAt" DESC);

-- BillingQuoteItem table
CREATE TABLE IF NOT EXISTS "billing_quote_items" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "quoteId"     TEXT NOT NULL REFERENCES "billing_quotes"("id") ON DELETE CASCADE,
  "department"  TEXT NOT NULL DEFAULT '',
  "type"        TEXT NOT NULL DEFAULT '',
  "code"        TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "unit"        INTEGER NOT NULL DEFAULT 1,
  "price"       NUMERIC(12,2) NOT NULL DEFAULT 0,
  "amount"      NUMERIC(12,2) NOT NULL DEFAULT 0,
  "discount"    NUMERIC(12,2) NOT NULL DEFAULT 0,
  "netAmount"   NUMERIC(12,2) NOT NULL DEFAULT 0,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "billing_quote_items_quoteId_idx" ON "billing_quote_items"("quoteId");
