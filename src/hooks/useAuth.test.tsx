import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './useAuth'; // Ajuste o caminho conforme necessário
import { vi } from 'vitest';

// Mock do Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn((callback) => {
  // Simula uma mudança de estado inicial (usuário logado ou não)
  callback('SIGNED_OUT', null);
  return { data: { subscription: { unsubscribe: vi.fn() } } };
});

vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar o estado inicial de autenticação', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true); // Inicialmente carregando
  });

  it('deve atualizar o estado quando o usuário faz login', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: { user: { id: '123', email: 'test@example.com' } }, error: null });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Simula a chamada de onAuthStateChange após o login
    mockOnAuthStateChange.mock.calls[0][0]('SIGNED_IN', { id: '123', email: 'test@example.com' });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: '123', email: 'test@example.com' });
    expect(result.current.isLoading).toBe(false);
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('deve lidar com erro de login', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid credentials' } });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrongpassword');
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error?.message).toBe('Invalid credentials');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('deve fazer logout do usuário', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    // Simula um estado inicial de login para testar o logout
    act(() => {
      mockOnAuthStateChange.mock.calls[0][0]('SIGNED_IN', { id: '123', email: 'test@example.com' });
    });
    await waitForNextUpdate(); // Espera o estado de login ser processado

    await act(async () => {
      await result.current.logout();
    });

    // Simula a chamada de onAuthStateChange após o logout
    mockOnAuthStateChange.mock.calls[0][0]('SIGNED_OUT', null);

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockSignOut).toHaveBeenCalled();
  });
});

