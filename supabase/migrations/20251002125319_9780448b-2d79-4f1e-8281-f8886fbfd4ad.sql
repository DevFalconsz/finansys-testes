-- Create movimentacao_caixa table for cash flow management
CREATE TABLE public.movimentacao_caixa (
  id_movimentacao SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL,
  descricao TEXT,
  valor NUMERIC NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria VARCHAR,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.movimentacao_caixa ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own movimentacoes"
ON public.movimentacao_caixa
FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM usuario WHERE id_usuario = movimentacao_caixa.id_usuario));

CREATE POLICY "Users can create their own movimentacoes"
ON public.movimentacao_caixa
FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM usuario WHERE id_usuario = movimentacao_caixa.id_usuario));

CREATE POLICY "Users can update their own movimentacoes"
ON public.movimentacao_caixa
FOR UPDATE
USING (auth.uid() = (SELECT auth_id FROM usuario WHERE id_usuario = movimentacao_caixa.id_usuario));

CREATE POLICY "Users can delete their own movimentacoes"
ON public.movimentacao_caixa
FOR DELETE
USING (auth.uid() = (SELECT auth_id FROM usuario WHERE id_usuario = movimentacao_caixa.id_usuario));

-- Enable all access for anon (same as other tables)
CREATE POLICY "Enable all access for anon"
ON public.movimentacao_caixa
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_movimentacao_caixa_updated_at
BEFORE UPDATE ON public.movimentacao_caixa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();