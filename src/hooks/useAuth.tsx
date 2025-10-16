import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error | null }>;
  signUp: (email: string, password: string, userData: Record<string, unknown>) => Promise<{ error?: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }) as { data: { user: User | null, session: Session | null }, error: Error | null };

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return { error: error as Error };
      }

      return { error: null };
    } catch (error: unknown) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, userData: Record<string, unknown>) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      }) as { data: { user: User | null, session: Session | null }, error: Error | null };

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return { error: error as Error };
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return { error: null };
    } catch (error: unknown) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
