import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImpostoDialog from './ImpostoDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock do useForm e useToast
const mockUseForm = vi.fn();
const mockUseToast = vi.fn(() => ({ toast: vi.fn() }));

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useForm: mockUseForm,
  };
});

vi.mock('@/components/ui/use-toast', () => ({
  useToast: mockUseToast,
}));

// Mock do React Query para evitar erros de contexto
const queryClient = new QueryClient();

describe('ImpostoDialog', () => {
  const defaultFormValues = {
    id: undefined,
    nome: '',
    valor: 0,
    dataVencimento: new Date(),
    status: 'pendente',
  };

  const renderImpostoDialog = (props = {}) => {
    mockUseForm.mockReturnValue({
      register: vi.fn(),
      handleSubmit: vi.fn((cb) => cb),
      formState: { errors: {} },
      reset: vi.fn(),
      setValue: vi.fn(),
      getValues: vi.fn(() => defaultFormValues),
      ...props.formHookProps,
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ImpostoDialog open={true} onClose={vi.fn()} {...props} />
      </QueryClientProvider>
    );
  };

  it('deve renderizar o título correto para novo imposto', () => {
    renderImpostoDialog();
    expect(screen.getByText('Adicionar Novo Imposto')).toBeInTheDocument();
  });

  it('deve renderizar o título correto para edição de imposto', () => {
    renderImpostoDialog({ imposto: { id: '1', nome: 'IPTU', valor: 100, dataVencimento: new Date(), status: 'pendente' } });
    expect(screen.getByText('Editar Imposto')).toBeInTheDocument();
  });

  it('deve exibir mensagens de erro de validação', async () => {
    const errors = { nome: { message: 'Nome é obrigatório' } };
    renderImpostoDialog({ formHookProps: { formState: { errors } } });

    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão de fechar', () => {
    const onCloseMock = vi.fn();
    renderImpostoDialog({ onClose: onCloseMock });

    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('deve submeter o formulário com dados válidos', async () => {
    const onSubmitMock = vi.fn();
    renderImpostoDialog({ formHookProps: { handleSubmit: vi.fn((cb) => (e) => cb(defaultFormValues)(e)) }, onSubmit: onSubmitMock });

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(defaultFormValues);
    });
  });
});

