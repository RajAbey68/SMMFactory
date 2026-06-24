CREATE TABLE campaigns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tag         text NOT NULL UNIQUE,
  description text,
  color       text NOT NULL DEFAULT '#6366f1',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "anon_insert_campaigns" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_campaigns" ON campaigns FOR UPDATE USING (true);

-- Allow inserting communities from the UI
CREATE POLICY "anon_insert_communities" ON communities FOR INSERT WITH CHECK (true);

-- Seed the existing Brampton campaign
INSERT INTO campaigns (name, tag, description, color)
VALUES (
  'Brampton Charging Order K34YX552',
  'brampton-k34yx552',
  'Public advocacy campaign — unlawful charging order obtained by default. No contested hearing in 3 years.',
  '#e94560'
);
