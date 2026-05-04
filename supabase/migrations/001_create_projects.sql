-- Tabela de projetos exportados por usuário
CREATE TABLE IF NOT EXISTS projects (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT        NOT NULL,
  format_id    TEXT        NOT NULL,
  format_label TEXT        NOT NULL,
  width        INTEGER     NOT NULL,
  height       INTEGER     NOT NULL,
  storage_path TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS: cada usuário acessa apenas seus próprios projetos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON projects
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket para os exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS do bucket: usuário só acessa sua pasta
CREATE POLICY "owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text
  );
