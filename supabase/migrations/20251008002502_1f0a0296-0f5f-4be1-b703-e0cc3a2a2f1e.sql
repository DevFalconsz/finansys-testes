-- Remove duplicate 'user' roles when user has a more specific role
DELETE FROM user_roles
WHERE role = 'user'
AND user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role IN ('admin', 'analista', 'caixa', 'contador')
);