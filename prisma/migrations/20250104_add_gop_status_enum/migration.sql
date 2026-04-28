-- Add GOPStatus enum
CREATE TYPE "GOPStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'DOCTOR_REVIEW', 'SUBMITTED_TO_INSURER', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Convert existing status values to enum
ALTER TABLE "gop_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "gop_requests" ALTER COLUMN "status" TYPE "GOPStatus" USING "status"::"GOPStatus";
ALTER TABLE "gop_requests" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- DOWN
-- ALTER TABLE "gop_requests" ALTER COLUMN "status" DROP DEFAULT;
-- ALTER TABLE "gop_requests" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
-- ALTER TABLE "gop_requests" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
-- DROP TYPE IF EXISTS "GOPStatus";

