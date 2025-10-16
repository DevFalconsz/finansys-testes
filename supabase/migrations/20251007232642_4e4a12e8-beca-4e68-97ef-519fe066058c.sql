-- Add new roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'analista';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'caixa';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'contador';