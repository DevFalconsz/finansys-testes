import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('deve renderizar o layout principal da aplicação', () => {
    render(<App />);
    // Assumindo que o App renderiza um elemento principal que pode ser identificado, por exemplo, um 'main' ou um 'div' com um papel específico.
    // Se o seu App tiver um componente de layout principal, você pode procurar por um texto ou role dentro dele.
    // Exemplo: se houver um título "Finansys Dashboard" em algum lugar da aplicação:
    // expect(screen.getByText(/Finansys Dashboard/i)).toBeInTheDocument();
    // Ou, se houver uma barra de navegação:
    // expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Para este exemplo, vamos procurar por um elemento genérico que indica que a aplicação foi renderizada.
    // Se o seu App.tsx renderiza um <div id="root"></div> e o conteúdo é injetado lá, você pode verificar se o root está vazio ou contém algo.
    // No entanto, é melhor testar o conteúdo real que o App renderiza.
    
    // Por enquanto, vou manter um teste que verifica se o componente App pode ser renderizado sem erros.
    // Idealmente, você testaria a presença de elementos-chave da UI que o App renderiza.
    // Por exemplo, se o App renderiza um router que leva a uma página inicial com um título:
    // expect(screen.getByText(/Bem-vindo ao Finansys/i)).toBeInTheDocument();
    
    // Como não tenho o conteúdo exato do App.tsx, vou verificar a renderização de um elemento básico que deve estar presente.
    // Se o App.tsx renderiza um <div className="App"> ou similar, podemos procurar por ele.
    // Para um teste mais robusto, você deve substituir isso por um seletor que faça sentido para o seu layout.
    expect(screen.queryByText(/Finansys/i)).toBeInTheDocument(); // Exemplo: verifica se o nome da aplicação aparece em algum lugar
  });
});

