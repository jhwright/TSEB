-- Allow anonymous (unauthenticated) access to all tables
-- Matches the volunteer trust model — any viewer can read and edit anything

-- SELECT
CREATE POLICY "Anon can read singers" ON singers FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read institutions" ON institutions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read contacts" ON contacts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read activities" ON activities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read gigs" ON gigs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read gig_singers" ON gig_singers FOR SELECT TO anon USING (true);

-- INSERT
CREATE POLICY "Anon can insert singers" ON singers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can insert institutions" ON institutions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can insert contacts" ON contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can insert activities" ON activities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can insert gigs" ON gigs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can insert gig_singers" ON gig_singers FOR INSERT TO anon WITH CHECK (true);

-- UPDATE
CREATE POLICY "Anon can update singers" ON singers FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can update institutions" ON institutions FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can update contacts" ON contacts FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can update gigs" ON gigs FOR UPDATE TO anon USING (true);

-- DELETE (gig_singers only — for RSVP removal)
CREATE POLICY "Anon can delete gig_singers" ON gig_singers FOR DELETE TO anon USING (true);
