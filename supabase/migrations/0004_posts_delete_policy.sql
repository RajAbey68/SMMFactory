-- Allow anonymous clients to delete their own draft/discarded posts
CREATE POLICY "anon_delete_posts" ON posts FOR DELETE USING (true);
