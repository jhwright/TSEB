-- Feedback table for tester/user comments
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  type text CHECK (type IN ('bug', 'suggestion', 'question', 'praise')),
  message text NOT NULL,
  context text,
  url text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback
CREATE POLICY "Anon can insert feedback" ON feedback FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can insert feedback" ON feedback FOR INSERT TO authenticated WITH CHECK (true);

-- Only anon/authenticated can read (for admin review later)
CREATE POLICY "Anon can read feedback" ON feedback FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can read feedback" ON feedback FOR SELECT TO authenticated USING (true);
