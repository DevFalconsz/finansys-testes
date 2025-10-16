import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LancamentoDialog } from './LancamentoDialog'; // Importação corrigida
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Importar supabase mockado
import { useToast } from '@/hooks/use-toast'; // Importar useToast mockado

// Mock do React Query para evitar erros de contexto
const queryClient = new QueryClient();

// Mocks para supabase e useToast já devem estar em setupTests.ts, mas vamos garantir que estão acessíveis e resetados.
const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

describe('LancamentoDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetar mocks do Supabase para cada teste
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-id' } as any }, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id_usuario: 'user-id' }, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);
  });

  const renderLancamentoDialog = (props?: any) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LancamentoDialog onSuccess={vi.fn()} {...props} />
      </QueryClientProvider>
    );
  };

  it('deve renderizar o título correto para novo lançamento', async () => {
    renderLancamentoDialog();
    await waitFor(() => expect(screen.getByText('Novo Lançamento')).toBeInTheDocument());
  });

  it('deve renderizar o título correto para edição de lançamento', async () => {
    const lancamento = {
      id_lancamento: 1,
      descricao: 'Salário',
      valor: 3000,
      data: '2023-01-01',
      tipo: 'receita',
      categoria: 'Trabalho',
      id_usuario: 'user-id',
    };
    renderLancamentoDialog({ lancamento });
    await waitFor(() => expect(screen.getByText('Editar Lançamento')).toBeInTheDocument());
  });

  it('deve preencher o formulário com dados do lançamento para edição', async () => {
    const lancamento = {
      id_lancamento: 1,
      descricao: 'Aluguel',
      valor: 1500.00,
      data: '2023-02-15',
      tipo: 'despesa',
      categoria: 'Moradia',
      id_usuario: 'user-id',
    };
    renderLancamentoDialog({ lancamento });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Aluguel')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023-02-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('despesa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Moradia')).toBeInTheDocument();
    });
  });

  it('deve chamar onSuccess e toast de sucesso ao criar um novo lançamento', async () => {
    const onSuccessMock = vi.fn();
    renderLancamentoDialog({ onSuccess: onSuccessMock });

    fireEvent.change(screen.getByLabelText('Descrição *'), { target: { value: 'Venda de Produto' } });
    fireEvent.change(screen.getByLabelText('Valor *'), { target: { value: '250.00' } });
    fireEvent.change(screen.getByLabelText('Data *'), { target: { value: '2023-05-10' } });
    fireEvent.change(screen.getByLabelText('Tipo *'), { target: { value: 'receita' } });
    fireEvent.change(screen.getByLabelText('Categoria *'), { target: { value: 'Vendas' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(supabase.from('lancamento').insert)).toHaveBeenCalledWith({
        descricao: 'Venda de Produto',
        valor: 250.00,
        data: '2023-05-10',
        tipo: 'receita',
        categoria: 'Vendas',
      });
      expect(onSuccessMock).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Lançamento cadastrado com sucesso',
      });
    });
  });

  it('deve chamar onSuccess e toast de sucesso ao atualizar um lançamento existente', async () => {
    const onSuccessMock = vi.fn();
    const lancamento = {
      id_lancamento: 1,
      descricao: 'Salário',
      valor: 3000,
      data: '2023-01-01',
      tipo: 'receita',
      categoria: 'Trabalho',
      id_usuario: 'user-id',
    };
    renderLancamentoDialog({ lancamento, onSuccess: onSuccessMock });

    await waitFor(() => expect(screen.getByText('Editar Lançamento')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Valor *'), { target: { value: '3200.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(supabase.from('lancamento').update)).toHaveBeenCalledWith({
        descricao: 'Salário',
        valor: 3200.00,
        data: '2023-01-01',
        tipo: 'receita',
        categoria: 'Trabalho',
      });
      expect(onSuccessMock).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Lançamento atualizado com sucesso',
      });
    });
  });

  it('deve exibir toast de erro se a criação/atualização falhar', async () => {
    const errorMock = new Error('Erro ao salvar lançamento');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id_usuario: 'user-id' }, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: errorMock }),
      update: vi.fn().mockResolvedValue({ data: [], error: errorMock }),
    } as any);

    renderLancamentoDialog();

    fireEvent.change(screen.getByLabelText('Descrição *'), { target: { value: 'Compra de Material' } });
    fireEvent.change(screen.getByLabelText('Valor *'), { target: { value: '150.00' } });
    fireEvent.change(screen.getByLabelText('Data *'), { target: { value: '2023-06-20' } });
    fireEvent.change(screen.getByLabelText('Tipo *'), { target: { value: 'despesa' } });
    fireEvent.change(screen.getByLabelText('Categoria *'), { target: { value: 'Material' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro ao salvar lançamento',
        description: 'Erro ao salvar lançamento',
        variant: 'destructive',
      });
    });
  });
});

