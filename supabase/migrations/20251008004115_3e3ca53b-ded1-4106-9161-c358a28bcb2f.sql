-- Drop existing restrictive policies and create shared access policies

-- MOVIMENTACAO_CAIXA: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Users can view their own movimentacoes" ON movimentacao_caixa;
DROP POLICY IF EXISTS "Users can create their own movimentacoes" ON movimentacao_caixa;
DROP POLICY IF EXISTS "Users can update their own movimentacoes" ON movimentacao_caixa;
DROP POLICY IF EXISTS "Users can delete their own movimentacoes" ON movimentacao_caixa;

CREATE POLICY "Authenticated users can view all movimentacoes"
ON movimentacao_caixa FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create movimentacoes"
ON movimentacao_caixa FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update movimentacoes"
ON movimentacao_caixa FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete movimentacoes"
ON movimentacao_caixa FOR DELETE
TO authenticated
USING (true);

-- LANCAMENTO: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Users can view their own lancamentos" ON lancamento;
DROP POLICY IF EXISTS "Users can create their own lancamentos" ON lancamento;
DROP POLICY IF EXISTS "Users can update their own lancamentos" ON lancamento;
DROP POLICY IF EXISTS "Users can delete their own lancamentos" ON lancamento;

CREATE POLICY "Authenticated users can view all lancamentos"
ON lancamento FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create lancamentos"
ON lancamento FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lancamentos"
ON lancamento FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete lancamentos"
ON lancamento FOR DELETE
TO authenticated
USING (true);

-- DIVIDA: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Users can view their own dividas" ON divida;
DROP POLICY IF EXISTS "Users can create their own dividas" ON divida;
DROP POLICY IF EXISTS "Users can update their own dividas" ON divida;
DROP POLICY IF EXISTS "Users can delete their own dividas" ON divida;

CREATE POLICY "Authenticated users can view all dividas"
ON divida FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create dividas"
ON divida FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update dividas"
ON divida FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete dividas"
ON divida FOR DELETE
TO authenticated
USING (true);

-- META: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Users can view their own metas" ON meta;
DROP POLICY IF EXISTS "Users can create their own metas" ON meta;
DROP POLICY IF EXISTS "Users can update their own metas" ON meta;
DROP POLICY IF EXISTS "Users can delete their own metas" ON meta;

CREATE POLICY "Authenticated users can view all metas"
ON meta FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create metas"
ON meta FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update metas"
ON meta FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete metas"
ON meta FOR DELETE
TO authenticated
USING (true);

-- COMPROVANTE: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Users can view their own comprovantes" ON comprovante;
DROP POLICY IF EXISTS "Users can insert their own comprovantes" ON comprovante;
DROP POLICY IF EXISTS "Users can delete their own comprovantes" ON comprovante;

CREATE POLICY "Authenticated users can view all comprovantes"
ON comprovante FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert comprovantes"
ON comprovante FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update comprovantes"
ON comprovante FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete comprovantes"
ON comprovante FOR DELETE
TO authenticated
USING (true);