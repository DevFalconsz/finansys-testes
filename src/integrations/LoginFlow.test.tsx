import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '../hooks/useAuth'; // Importar AuthProvider
import { supabase } from '@/integrations/supabase/client'; // Importar supabase mockado

// Mock do React Query para evitar erros de contexto
const queryClient = new QueryClient();

// Mocks para supabase.auth já devem estar em setupTests.ts, mas vamos garantir que estão acessíveis e resetados.
// No entanto, para testes de integração de fluxo de login, precisamos de um controle mais granular.

describe('Login Flow Integration', () => {
  const mockOnAuthStateChangeCallback = vi.fn();
  let onAuthStateChangeSubscription: { data: { subscription: { unsubscribe: () => void } } };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock inicial do Supabase para o estado não autenticado
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    onAuthStateChangeSubscription = vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      mockOnAuthStateChangeCallback.mockImplementation(callback);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }) as any;

    // Simular o estado inicial de não autenticado para onAuthStateChange
    mockOnAuthStateChangeCallback('SIGNED_OUT', null);
  });

  // Componente de teste simples que usa useAuth
  const TestLoginComponent = () => {
    const { signIn, signOut, user, loading } = useAuth();

    const handleLogin = async () => {
      await signIn('test@example.com', 'password123');
    };

    return (
      <div>
        {loading && <div data-testid="loading">Carregando...</div>}
        {user ? (
          <div data-testid="authenticated">Bem-vindo, {user.email}</div>
        ) : (
          <div data-testid="unauthenticated">Não autenticado</div>
        )}
        <button onClick={handleLogin} disabled={loading}>Login</button>
        <button onClick={signOut} disabled={loading}>Logout</button>
      </div>
    );
  };

  it('deve permitir que um usuário faça login e exiba o estado autenticado', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'abc', token_type: 'Bearer', expires_in: 3600, expires_at: Date.now() + 3600000 };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ data: { user: mockUser, session: mockSession }, error: null });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByTestId('unauthenticated')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.signInWithPassword)).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Simula a chamada de onAuthStateChange após o login bem-sucedido
    mockOnAuthStateChangeCallback('SIGNED_IN', mockSession);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      expect(screen.getByText(`Bem-vindo, ${mockUser.email}`)).toBeInTheDocument();
    });
  });

  it('deve permitir que um usuário faça logout e exiba o estado não autenticado', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'abc', token_type: 'Bearer', expires_in: 3600, expires_at: Date.now() + 3600000 };

    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Simula um estado inicial de login para testar o logout
    mockOnAuthStateChangeCallback('SIGNED_IN', mockSession);
    await waitFor(() => expect(screen.getByTestId('authenticated')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));

    await waitFor(() => {
      expect(vi.mocked(supabase.auth.signOut)).toHaveBeenCalled();
    });

    // Simula a chamada de onAuthStateChange após o logout bem-sucedido
    mockOnAuthStateChangeCallback('SIGNED_OUT', null);

    await waitFor(() => {
      expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
    });
  });
});

