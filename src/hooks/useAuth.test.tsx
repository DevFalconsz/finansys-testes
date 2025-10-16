import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth, AuthProvider } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Mock the entire supabase module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      // Simulate initial state (no session)
      callback('SIGNED_OUT', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('deve retornar o estado inicial de autenticação', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('deve atualizar o estado quando o usuário faz login', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'abc', token_type: 'Bearer', expires_in: 3600, expires_at: Date.now() + 3600000 };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ data: { user: mockUser, session: mockSession }, error: null });
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: mockSession }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false)); // Wait for initial loading to finish

    await result.current.signIn('test@example.com', 'password123');

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.loading).toBe(false);
    });

    expect(vi.mocked(supabase.auth.signInWithPassword)).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('deve lidar com erro de login', async () => {
    const loginError = new Error('Invalid credentials');
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ data: { user: null, session: null }, error: loginError });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const { error } = await result.current.signIn('test@example.com', 'wrongpassword');

    expect(error).toEqual(loginError);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Erro no login',
      description: 'Invalid credentials',
      variant: 'destructive',
    });
  });

  it('deve fazer logout do usuário', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'abc', token_type: 'Bearer', expires_in: 3600, expires_at: Date.now() + 3600000 };

    // Simulate a logged-in state initially
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: mockSession }, error: null });
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementationOnce((callback) => {
      callback('SIGNED_IN', mockSession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await result.current.signOut();

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.loading).toBe(false);
    });
    expect(vi.mocked(supabase.auth.signOut)).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso.',
    });
  });
});

