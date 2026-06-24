-- Migration 0003: Replace campaign_tag string FK with campaign_id UUID FK
--
-- Context: communities, threads, and posts all use campaign_tag (text) as a
-- de-facto foreign key to campaigns.tag. This is fragile — no referential
-- integrity, no cascade, no index alignment. Replace with campaign_id UUID FK.
--
-- Companion app code changes needed after applying:
--   - src/hooks/useDraftPosts.ts  : .eq('campaign_tag', ...) → .eq('campaign_id', ...)
--   - src/components/composer/PostingPane.tsx : insert campaign_id instead of campaign_tag
--   - src/App.tsx                 : pass campaign.id (not campaign.tag) as prop
--   - src/types/index.ts          : remove campaign_tag fields, add campaign_id fields
--   - supabase/types.ts           : regenerate via `supabase gen types`

-- Step 1: add nullable campaign_id column to each table (nullable for safe backfill)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE;
ALTER TABLE threads     ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE;
ALTER TABLE posts       ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE;

-- Step 2: backfill from the existing campaign_tag values
UPDATE communities c
  SET campaign_id = cam.id
  FROM campaigns cam
  WHERE cam.tag = c.campaign_tag;

UPDATE threads t
  SET campaign_id = cam.id
  FROM campaigns cam
  WHERE cam.tag = t.campaign_tag;

UPDATE posts p
  SET campaign_id = cam.id
  FROM campaigns cam
  WHERE cam.tag = p.campaign_tag;

-- Step 3: enforce NOT NULL now that backfill is complete
ALTER TABLE communities ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE threads     ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE posts       ALTER COLUMN campaign_id SET NOT NULL;

-- Step 4: add indexes for the FK columns (queries will filter by campaign_id)
CREATE INDEX IF NOT EXISTS idx_communities_campaign_id ON communities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_threads_campaign_id     ON threads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_campaign_id       ON posts(campaign_id);

-- Step 5: drop the old campaign_tag columns
ALTER TABLE communities DROP COLUMN IF EXISTS campaign_tag;
ALTER TABLE threads     DROP COLUMN IF EXISTS campaign_tag;
ALTER TABLE posts       DROP COLUMN IF EXISTS campaign_tag;

-- Step 6: update RLS policies that reference campaign_tag (none currently do,
-- but ensure the read/write policies are correct for the new column)
-- Existing anon_read/insert/update/delete policies on posts are column-agnostic
-- (they use USING (true)), so no policy changes are needed.
