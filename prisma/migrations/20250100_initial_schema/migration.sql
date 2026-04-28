-- Baseline migration: create base tables and enums required by subsequent migrations

-- Role enum (used by user_metadata and notifications)
CREATE TYPE "Role" AS ENUM (
  'INSURANCE_STAFF',
  'FINANCE',
  'DOCTOR',
  'BILLING_STAFF',
  'IT_ADMIN',
  'ADMIN'
);

-- UserMetadata table
CREATE TABLE "user_metadata" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "entraObjectId" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'INSURANCE_STAFF',
  "preferences" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- InsurerConfig table
CREATE TABLE "insurer_config" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL UNIQUE,
  "contactEmail" TEXT,
  "emailTemplate" TEXT,
  "questionnaireFhirId" TEXT,
  "coPayRuleSummary" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NotificationRule table
CREATE TABLE "notification_rule" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "eventType", "channel")
);

-- FeatureFlag table
CREATE TABLE "feature_flag" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "config" JSONB
);

-- DOWN
-- DROP TABLE IF EXISTS "feature_flag";
-- DROP TABLE IF EXISTS "notification_rule";
-- DROP TABLE IF EXISTS "insurer_config";
-- DROP TABLE IF EXISTS "user_metadata";
-- DROP TYPE IF EXISTS "Role";

