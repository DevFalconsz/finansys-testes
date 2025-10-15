-- Atualizar tabela comprovante para incluir data de pagamento e melhorar estrutura
ALTER TABLE public.comprovante 
ADD COLUMN IF NOT EXISTS data_pagamento DATE,
ADD COLUMN IF NOT EXISTS arquivo_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS id_usuario INTEGER;

-- Criar bucket de storage para comprovantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para storage bucket comprovantes
CREATE POLICY "Users can view their own comprovantes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own comprovantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Atualizar RLS policies da tabela comprovante para usuários autenticados
DROP POLICY IF EXISTS "Enable all access for anon" ON public.comprovante;

CREATE POLICY "Users can view their own comprovantes"
ON public.comprovante FOR SELECT
TO authenticated
USING (
  auth.uid() = (SELECT auth_id FROM usuario WHERE id_usuario = comprovante.id_usuario)
);

CREATE POLICY "Users can insert their own comprovantes"
ON public.comprovante FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = (SELECT auth_id FROM usuario WHERE id_usuario = comprovante.id_usuario)
);

CREATE POLICY "Users can delete their own comprovantes"
ON public.comprovante FOR DELETE
TO authenticated
USING (
  auth.uid() = (SELECT auth_id FROM usuario WHERE id_usuario = comprovante.id_usuario)
);