-- Enable Row Level Security on all tables if not already enabled
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('usuario', 'lancamento', 'comprovante', 'divida', 'imposto', 'meta', 'nfe', 'relatorio')
  LOOP
    EXECUTE 'ALTER TABLE public.' || table_record.tablename || ' ENABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

-- Update usuario table to work with Supabase Auth
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or update RLS policies for usuario table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuario;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.usuario;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuario;

CREATE POLICY "Users can view their own profile" 
ON public.usuario 
FOR SELECT 
USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" 
ON public.usuario 
FOR UPDATE 
USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile" 
ON public.usuario 
FOR INSERT 
WITH CHECK (auth.uid() = auth_id);

-- Create RLS policies for lancamento table
DROP POLICY IF EXISTS "Users can view their own lancamentos" ON public.lancamento;
DROP POLICY IF EXISTS "Users can create their own lancamentos" ON public.lancamento;
DROP POLICY IF EXISTS "Users can update their own lancamentos" ON public.lancamento;
DROP POLICY IF EXISTS "Users can delete their own lancamentos" ON public.lancamento;

CREATE POLICY "Users can view their own lancamentos" 
ON public.lancamento 
FOR SELECT 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = lancamento.id_usuario));

CREATE POLICY "Users can create their own lancamentos" 
ON public.lancamento 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = lancamento.id_usuario));

CREATE POLICY "Users can update their own lancamentos" 
ON public.lancamento 
FOR UPDATE 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = lancamento.id_usuario));

CREATE POLICY "Users can delete their own lancamentos" 
ON public.lancamento 
FOR DELETE 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = lancamento.id_usuario));

-- Create RLS policies for divida table
DROP POLICY IF EXISTS "Users can view their own dividas" ON public.divida;
DROP POLICY IF EXISTS "Users can create their own dividas" ON public.divida;
DROP POLICY IF EXISTS "Users can update their own dividas" ON public.divida;
DROP POLICY IF EXISTS "Users can delete their own dividas" ON public.divida;

CREATE POLICY "Users can view their own dividas" 
ON public.divida 
FOR SELECT 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = divida.id_usuario));

CREATE POLICY "Users can create their own dividas" 
ON public.divida 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = divida.id_usuario));

CREATE POLICY "Users can update their own dividas" 
ON public.divida 
FOR UPDATE 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = divida.id_usuario));

CREATE POLICY "Users can delete their own dividas" 
ON public.divida 
FOR DELETE 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = divida.id_usuario));

-- Create RLS policies for meta table
DROP POLICY IF EXISTS "Users can view their own metas" ON public.meta;
DROP POLICY IF EXISTS "Users can create their own metas" ON public.meta;
DROP POLICY IF EXISTS "Users can update their own metas" ON public.meta;
DROP POLICY IF EXISTS "Users can delete their own metas" ON public.meta;

CREATE POLICY "Users can view their own metas" 
ON public.meta 
FOR SELECT 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = meta.id_usuario));

CREATE POLICY "Users can create their own metas" 
ON public.meta 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = meta.id_usuario));

CREATE POLICY "Users can update their own metas" 
ON public.meta 
FOR UPDATE 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = meta.id_usuario));

CREATE POLICY "Users can delete their own metas" 
ON public.meta 
FOR DELETE 
USING (auth.uid() = (SELECT auth_id FROM public.usuario WHERE id_usuario = meta.id_usuario));

-- Create or replace function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates where applicable
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usuario_updated_at') THEN
    CREATE TRIGGER update_usuario_updated_at
    BEFORE UPDATE ON public.usuario
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;