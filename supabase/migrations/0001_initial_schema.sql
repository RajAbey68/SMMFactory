CREATE TABLE communities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('reddit','rss','firecrawl','email')),
  url         text NOT NULL,
  rss_url     text,
  color       text NOT NULL DEFAULT '#6366f1',
  campaign_tag text NOT NULL DEFAULT 'brampton-k34yx552',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE threads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id         uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  external_id          text,
  title                text NOT NULL,
  url                  text NOT NULL,
  posted_by_us         boolean NOT NULL DEFAULT false,
  status               text NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','archived')),
  firecrawl_monitor_id text,
  campaign_tag         text NOT NULL DEFAULT 'brampton-k34yx552',
  created_at           timestamptz DEFAULT now(),
  last_activity_at     timestamptz DEFAULT now()
);

CREATE TABLE replies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id           uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  external_id         text UNIQUE,
  author              text NOT NULL,
  content             text NOT NULL,
  url                 text,
  source              text NOT NULL CHECK (source IN ('rss','firecrawl','reddit_api','manual')),
  notified_discord    boolean NOT NULL DEFAULT false,
  notified_leadsync   boolean NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id),
  thread_id    uuid REFERENCES threads(id),
  content      text NOT NULL,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','posted','scheduled')),
  post_method  text NOT NULL CHECK (post_method IN ('reddit_api','manual_clipboard','email')),
  posted_at    timestamptz,
  campaign_tag text NOT NULL DEFAULT 'brampton-k34yx552',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_communities" ON communities FOR SELECT USING (true);
CREATE POLICY "anon_read_threads" ON threads FOR SELECT USING (true);
CREATE POLICY "anon_read_replies" ON replies FOR SELECT USING (true);
CREATE POLICY "anon_read_posts" ON posts FOR SELECT USING (true);
CREATE POLICY "anon_insert_posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_posts" ON posts FOR UPDATE USING (true);

INSERT INTO communities (name, type, url, rss_url, color, campaign_tag) VALUES
  ('Reddit r/LegalAdviceUK', 'reddit', 'https://www.reddit.com/r/LegalAdviceUK/', 'https://www.reddit.com/r/LegalAdviceUK.rss', '#ff4500', 'brampton-k34yx552'),
  ('LegalBeagles', 'firecrawl', 'https://www.legalbeagles.info/forums/', null, '#2563eb', 'brampton-k34yx552'),
  ('MoneySavingExpert', 'firecrawl', 'https://forums.moneysavingexpert.com/', null, '#16a34a', 'brampton-k34yx552'),
  ('MumsNet Legal', 'rss', 'https://www.mumsnet.com/talk/legal_matters', null, '#db2777', 'brampton-k34yx552');
