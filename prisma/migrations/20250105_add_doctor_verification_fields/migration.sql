-- Add doctor verification timestamp and actor fields to gop_requests
ALTER TABLE "gop_requests"
  ADD COLUMN "surgeonVerifiedAt"      TIMESTAMP(3),
  ADD COLUMN "surgeonVerifiedBy"      TEXT,
  ADD COLUMN "anaesthetistVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "anaesthetistVerifiedBy" TEXT;
