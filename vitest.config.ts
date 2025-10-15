import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/integrations/**',
        'src/lib/utils.ts', // Excluir arquivos utilitários se não contiverem lógica de negócio complexa
        'src/components/ui/**' // Excluir componentes UI genéricos se não contiverem lógica de negócio
      ],
    },
  },
});

