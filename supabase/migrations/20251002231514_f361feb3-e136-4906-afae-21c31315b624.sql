-- Tornar a coluna id_lancamento opcional na tabela comprovante
ALTER TABLE public.comprovante 
ALTER COLUMN id_lancamento DROP NOT NULL;