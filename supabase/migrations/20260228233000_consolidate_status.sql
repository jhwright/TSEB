-- Migration: Consolidate pipeline_stage into status, rename eliminated → inactive

-- Step 1: Drop old CHECK constraint on status first so we can set new values
ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_status_check;

-- Step 2: Migrate pipeline_stage values into status where status was generic
UPDATE institutions SET status = pipeline_stage
WHERE pipeline_stage IS NOT NULL
  AND pipeline_stage != ''
  AND status IN ('outreach', 'pending');

-- Step 3: Remap any remaining old status values
UPDATE institutions SET status = 'initial_contact' WHERE status = 'outreach';
UPDATE institutions SET status = 'initial_contact' WHERE status = 'pending';
UPDATE institutions SET status = 'inactive' WHERE status = 'eliminated';

-- Step 4: Rename column elimination_reason → inactive_reason
ALTER TABLE institutions RENAME COLUMN elimination_reason TO inactive_reason;

-- Step 5: Drop old pipeline_stage column
ALTER TABLE institutions DROP COLUMN IF EXISTS pipeline_stage;

-- Step 6: Add new CHECK constraint with consolidated values
ALTER TABLE institutions ADD CONSTRAINT institutions_status_check
  CHECK (status IN ('initial_contact', 'in_conversation', 'site_visit', 'active', 'on_hold', 'previous', 'inactive'));

-- Step 7: Update default
ALTER TABLE institutions ALTER COLUMN status SET DEFAULT 'initial_contact';
