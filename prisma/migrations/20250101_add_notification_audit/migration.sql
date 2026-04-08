-- Create enums first
CREATE TYPE notification_event AS ENUM (
  'REQUEST_CREATED',
  'REQUEST_ASSIGNED',
  'REQUEST_REASSIGNED',
  'REQUEST_VERIFIED',
  'REQUEST_CORRECTION_REQUESTED',
  'REQUEST_SUBMITTED',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'REQUEST_EXPIRED',
  'PDF_DOWNLOADED'
);

CREATE TYPE audit_actor_role AS ENUM (
  'ADMIN',
  'STAFF',
  'DOCTOR',
  'SYSTEM'
);

CREATE TYPE audit_action AS ENUM (
  'REQUEST_CREATED',
  'REQUEST_UPDATED',
  'REQUEST_ASSIGNED',
  'REQUEST_REASSIGNED',
  'REQUEST_SUBMITTED_FOR_VERIFICATION',
  'REQUEST_VERIFIED',
  'REQUEST_CORRECTION_REQUESTED',
  'REQUEST_SUBMITTED_TO_INSURER',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'REQUEST_EXPIRED',
  'PDF_GENERATED',
  'PDF_DOWNLOADED',
  'NOTES_CREATED',
  'NOTES_EDITED',
  'USER_CREATED',
  'USER_DEACTIVATED',
  'USER_ROLE_CHANGED'
);

-- Notification table
CREATE TABLE "notifications" (
  "id" TEXT PRIMARY KEY,
  "recipientId" TEXT NOT NULL,
  "recipientRole" "Role" NOT NULL,
  "eventType" notification_event NOT NULL,
  "requestId" TEXT,
  "readAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  FOREIGN KEY ("recipientId") REFERENCES "user_metadata"("id")
);

-- AuditEntry table (append-only)
CREATE TABLE "audit_entries" (
  "id" TEXT PRIMARY KEY,
  "requestId" TEXT,
  "actorId" TEXT,
  "actorRole" audit_actor_role NOT NULL,
  "action" audit_action NOT NULL,
  "beforeState" JSONB,
  "afterState" JSONB,
  "ipAddress" TEXT,
  "sessionId" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("actorId") REFERENCES "user_metadata"("id")
);

-- Indexes for Notification
CREATE INDEX "notifications_recipient_read" ON "notifications" ("recipientId", "readAt");
CREATE INDEX "notifications_recipient_time" ON "notifications" ("recipientId", "createdAt" DESC);
CREATE INDEX "notifications_request" ON "notifications" ("requestId");

-- Indexes for AuditEntry
CREATE INDEX "audit_entries_request_time" ON "audit_entries" ("requestId", "createdAt" DESC);
CREATE INDEX "audit_entries_actor_time" ON "audit_entries" ("actorId", "createdAt" DESC);
CREATE INDEX "audit_entries_action_time" ON "audit_entries" ("action", "createdAt" DESC);
CREATE INDEX "audit_entries_time" ON "audit_entries" ("createdAt" DESC);

-- Append-only trigger for AuditEntry (block UPDATE/DELETE)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'AuditEntry table is append-only. No UPDATE or DELETE allowed.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_protect_trigger
  BEFORE UPDATE OR DELETE ON "audit_entries"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Migration comments: No schema change to existing tables required.

-- DOWN MIGRATION (Notification only)
-- DROP TRIGGER IF EXISTS audit_protect_trigger ON "audit_entries";
-- DROP FUNCTION prevent_audit_modification();
-- DROP INDEX IF EXISTS "audit_entries_time";
-- DROP INDEX IF EXISTS "audit_entries_action_time";
-- DROP INDEX IF EXISTS "audit_entries_actor_time";
-- DROP INDEX IF EXISTS "audit_entries_request_time";
-- DROP TABLE IF EXISTS "audit_entries";
-- DROP INDEX IF EXISTS "notifications_request";
-- DROP INDEX IF EXISTS "notifications_recipient_time";
-- DROP INDEX IF EXISTS "notifications_recipient_read";
-- DROP TABLE IF EXISTS "notifications";
-- DROP TYPE IF EXISTS audit_action;
-- DROP TYPE IF EXISTS audit_actor_role;
-- DROP TYPE IF EXISTS notification_event;

