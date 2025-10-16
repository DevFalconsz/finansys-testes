-- Função para criar automaticamente um registro na tabela usuario quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuario (auth_id, email, nome, login, senha, perfil)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    '', -- senha vazia pois a autenticação é gerenciada pelo Supabase Auth
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'usuario')
  );
  RETURN NEW;
END;
$$;

-- Trigger que executa a função sempre que um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();