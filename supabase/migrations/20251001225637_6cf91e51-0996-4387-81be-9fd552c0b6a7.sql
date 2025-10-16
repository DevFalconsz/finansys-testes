-- Delete NFes without lancamento
DELETE FROM public.nfe WHERE id_lancamento IS NULL;

-- Make id_lancamento NOT NULL and add foreign key constraint
ALTER TABLE public.nfe ALTER COLUMN id_lancamento SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.nfe 
ADD CONSTRAINT nfe_lancamento_fk 
FOREIGN KEY (id_lancamento) 
REFERENCES public.lancamento(id_lancamento) 
ON DELETE CASCADE;