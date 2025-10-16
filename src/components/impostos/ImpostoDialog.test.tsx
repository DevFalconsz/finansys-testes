import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImpostoDialog } from './ImpostoDialog'; // Importação corrigida
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Importar supabase mockado
import { useToast } from '@/hooks/use-toast'; // Importar useToast mockado

// Mock do React Query para evitar erros de contexto
const queryClient = new QueryClient();

// Mocks para supabase e useToast já devem estar em setupTests.ts, mas vamos garantir que estão acessíveis e resetados.
const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

describe('ImpostoDialog', () => {
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

  const renderImpostoDialog = (props?: any) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ImpostoDialog onSuccess={vi.fn()} {...props} />
      </QueryClientProvider>
    );
  };

  it('deve renderizar o título correto para novo imposto', async () => {
    renderImpostoDialog();
    await waitFor(() => expect(screen.getByText('Novo Imposto')).toBeInTheDocument());
  });

  it('deve renderizar o título correto para edição de imposto', async () => {
    const imposto = {
      id_imposto: 1,
      tipo: 'ICMS',
      valor: 100,
      periodo: '2023-01',
      id_lancamento: 1,
    };
    renderImpostoDialog({ imposto });
    await waitFor(() => expect(screen.getByText('Editar Imposto')).toBeInTheDocument());
  });

  it('deve preencher o formulário com dados do imposto para edição', async () => {
    const imposto = {
      id_imposto: 1,
      tipo: 'ICMS',
      valor: 100.50,
      periodo: '2023-01',
      id_lancamento: 1,
    };
    renderImpostoDialog({ imposto });

    await waitFor(() => {
      expect(screen.getByDisplayValue('ICMS')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023-01')).toBeInTheDocument();
    });
  });

  it('deve chamar onSuccess e toast de sucesso ao criar um novo imposto', async () => {
    const onSuccessMock = vi.fn();
    renderImpostoDialog({ onSuccess: onSuccessMock });

    // Simular lançamentos disponíveis
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id_usuario: 'user-id' }, error: null }),
      order: vi.fn().mockResolvedValue({ data: [{ id_lancamento: 1, descricao: 'Salário', data: '2023-01-01', valor: 2000 }], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    await waitFor(() => expect(screen.getByText('Selecione o lançamento')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Tipo de Imposto *'), { target: { value: 'ICMS' } });
    fireEvent.change(screen.getByLabelText('Valor *'), { target: { value: '50.00' } });
    fireEvent.change(screen.getByLabelText('Período *'), { target: { value: '2023-03' } });
    
    // Selecionar lançamento
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Lançamento *' }));
    await waitFor(() => expect(screen.getByText('Salário - 01/01/2023 - R$ 2.000,00')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Salário - 01/01/2023 - R$ 2.000,00'));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(supabase.from('imposto').insert)).toHaveBeenCalledWith({
        tipo: 'ICMS',
        valor: 50.00,
        periodo: '2023-03',
        id_lancamento: 1,
      });
      expect(onSuccessMock).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Imposto cadastrado com sucesso',
      });
    });
  });

  it('deve chamar onSuccess e toast de sucesso ao atualizar um imposto existente', async () => {
    const onSuccessMock = vi.fn();
    const imposto = {
      id_imposto: 1,
      tipo: 'ICMS',
      valor: 100,
      periodo: '2023-01',
      id_lancamento: 1,
    };
    renderImpostoDialog({ imposto, onSuccess: onSuccessMock });

    // Simular lançamentos disponíveis
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id_usuario: 'user-id' }, error: null }),
      order: vi.fn().mockResolvedValue({ data: [{ id_lancamento: 1, descricao: 'Salário', data: '2023-01-01', valor: 2000 }], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    await waitFor(() => expect(screen.getByText('Editar Imposto')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Valor *'), { target: { value: '120.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(supabase.from('imposto').update)).toHaveBeenCalledWith({
        tipo: 'ICMS',
        valor: 120.00,
        periodo: '2023-01',
        id_lancamento: 1,
      });
      expect(onSuccessMock).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Imposto atualizado com sucesso',
      });
    });
  });

  it('deve exibir toast de erro se a criação/atualização falhar', async () => {
    const errorMock = new Error('Erro ao salvar imposto');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id_usuario: 'user-id' }, error: null }),
      order: vi.fn().mockResolvedValue({ data: [{ id_lancamento: 1, descricao: 'Salário', data: '2023-01-01', valor: 2000 }], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: errorMock }),
      update: vi.fn().mockResolvedValue({ data: [], error: errorMock }),
    } as any);

    renderImpostoDialog();

    await waitFor(() => expect(screen.getByText('Selecione o lançamento')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Tipo de Imposto *'), { target: { value: 'IPI' } });
    fireEvent.change(screen.getByLabelText('Valor *'), { target: { value: '25.00' } });
    fireEvent.change(screen.getByLabelText('Período *'), { target: { value: '2023-04' } });
    
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Lançamento *' }));
    await waitFor(() => expect(screen.getByText('Salário - 01/01/2023 - R$ 2.000,00')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Salário - 01/01/2023 - R$ 2.000,00'));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro ao salvar imposto',
        description: 'Erro ao salvar imposto',
        variant: 'destructive',
      });
    });
  });
});

