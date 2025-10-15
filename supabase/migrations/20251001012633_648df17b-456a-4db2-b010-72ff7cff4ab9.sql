-- Primeiro, adicionar constraint unique no auth_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuario_auth_id_key'
  ) THEN
    ALTER TABLE public.usuario ADD CONSTRAINT usuario_auth_id_key UNIQUE (auth_id);
  END IF;
END $$;

-- Atualizar registros existentes na tabela usuario com o auth_id correspondente
UPDATE public.usuario u
SET auth_id = au.id
FROM auth.users au
WHERE u.email = au.email 
  AND u.auth_id IS NULL;

-- Inserir novos registros para usuários do auth.users que não existem na tabela usuario
INSERT INTO public.usuario (auth_id, email, nome, login, senha, perfil)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nome', au.email),
  au.email,
  '',
  COALESCE(au.raw_user_meta_data->>'perfil', 'usuario')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuario u WHERE u.email = au.email
);