-- Tornar o campo id_lancamento nullable na tabela nfe
-- Isso permite criar NFes sem necessariamente ter um lançamento associado
ALTER TABLE public.nfe ALTER COLUMN id_lancamento DROP NOT NULL;