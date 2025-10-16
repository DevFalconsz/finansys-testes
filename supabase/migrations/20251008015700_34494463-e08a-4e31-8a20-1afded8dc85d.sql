-- Update RLS policies for remaining tables to allow shared access

-- IMPOSTO: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Enable all access for anon" ON imposto;

CREATE POLICY "Authenticated users can view all impostos"
ON imposto FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create impostos"
ON imposto FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update impostos"
ON imposto FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete impostos"
ON imposto FOR DELETE
TO authenticated
USING (true);

-- NFE: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Enable all access for anon" ON nfe;

CREATE POLICY "Authenticated users can view all nfe"
ON nfe FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create nfe"
ON nfe FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update nfe"
ON nfe FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete nfe"
ON nfe FOR DELETE
TO authenticated
USING (true);

-- RELATORIO: Allow all authenticated users to access all data
DROP POLICY IF EXISTS "Enable all access for anon" ON relatorio;

CREATE POLICY "Authenticated users can view all relatorios"
ON relatorio FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create relatorios"
ON relatorio FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update relatorios"
ON relatorio FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete relatorios"
ON relatorio FOR DELETE
TO authenticated
USING (true);

-- USUARIO: Update existing policies for shared viewing
DROP POLICY IF EXISTS "Enable all access for anon" ON usuario;
DROP POLICY IF EXISTS "Users can view their own profile" ON usuario;
DROP POLICY IF EXISTS "Users can update their own profile" ON usuario;
DROP POLICY IF EXISTS "Users can insert their own profile" ON usuario;

CREATE POLICY "Authenticated users can view all usuarios"
ON usuario FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON usuario FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile"
ON usuario FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_id);