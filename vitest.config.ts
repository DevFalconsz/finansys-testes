import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "./src/setupTests.ts")],
    css: false,
    exclude: ["**/tests/e2e.spec.ts"], // Excluir arquivos de teste E2E do Vitest
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/integrations/**",
        "src/lib/utils.ts", // Excluir arquivos utilitários se não contiverem lógica de negócio complexa
        "src/components/ui/**" // Excluir componentes UI genéricos se não contiverem lógica de negócio
      ],
    },
  },
});

