-- Update caixa@finansys.com to have 'caixa' role
UPDATE user_roles
SET role = 'caixa'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'caixa@finansys.com'
)
AND role = 'user';

-- Update analista@finansys.com to have 'analista' role  
UPDATE user_roles
SET role = 'analista'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'analista@finansys.com'
)
AND role = 'user';