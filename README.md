# 💵 Finasys

**Autor:** Ítalo Rhide, Patrick Oliveira, Lisia Maria, João Pedro

## 💡 Introdução
O **finasys** é uma aplicação web de **gestão financeira** desenvolvida com **React**, **TypeScript** e **Vite**.  
O sistema permite o controle de receitas, despesas e relatórios financeiros de forma moderna e eficiente.

---

## 📑 Sumário
1. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
2. [Instalação](#-instalação)
3. [Configuração](#-configuração)
4. [Execução](#-execução)
5. [Scripts Disponíveis](#-scripts-disponíveis)
6. [Dependências](#-dependências)
7. [Estrutura do Projeto](#-estrutura-do-projeto)
8. [Contribuição](#-contribuição)
9. [Licença](#-licença)

---

## 🧠 Tecnologias Utilizadas
- ⚛️ React
- 🟦 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🧵 PostCSS
- 🧩 ESLint
- 🖥️ JavaScript

---

## ⚙️ Instalação

### Pré-requisitos
- Node.js >= 18
- npm, yarn ou bun

### Passos
```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/finansys.git

# Entrar no diretório
cd finansys

# Instalar dependências
npm install
# ou
bun install
```

---

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto com o conteúdo:
```env
VITE_API_URL=https://api.seuservidor.com
VITE_APP_NAME=Finansys
```

---

## 🚀 Execução

```bash
npm run dev
```
O servidor será iniciado em: [http://localhost:5173](http://localhost:5173)

---

## 📜 Scripts Disponíveis
| Script | Comando |
|--------|----------|
| `dev` | `vite` |
| `build` | `vite build` |
| `build:dev` | `vite build --mode development` |
| `lint` | `eslint .` |
| `preview` | `vite preview` |
| `test` | `vitest` |


---

## 📦 Dependências Principais
- **@hookform/resolvers**: ^3.10.0
- **@radix-ui/react-accordion**: ^1.2.11
- **@radix-ui/react-alert-dialog**: ^1.1.14
- **@radix-ui/react-aspect-ratio**: ^1.1.7
- **@radix-ui/react-avatar**: ^1.1.10
- **@radix-ui/react-checkbox**: ^1.3.2
- **@radix-ui/react-collapsible**: ^1.1.11
- **@radix-ui/react-context-menu**: ^2.2.15
- **@radix-ui/react-dialog**: ^1.1.14
- **@radix-ui/react-dropdown-menu**: ^2.1.15
- **@radix-ui/react-hover-card**: ^1.1.14
- **@radix-ui/react-label**: ^2.1.7
- **@radix-ui/react-menubar**: ^1.1.15
- **@radix-ui/react-navigation-menu**: ^1.2.13
- **@radix-ui/react-popover**: ^1.1.14
- **@radix-ui/react-progress**: ^1.1.7
- **@radix-ui/react-radio-group**: ^1.3.7
- **@radix-ui/react-scroll-area**: ^1.2.9
- **@radix-ui/react-select**: ^2.2.5
- **@radix-ui/react-separator**: ^1.1.7
- **@radix-ui/react-slider**: ^1.3.5
- **@radix-ui/react-slot**: ^1.2.3
- **@radix-ui/react-switch**: ^1.2.5
- **@radix-ui/react-tabs**: ^1.1.12
- **@radix-ui/react-toast**: ^1.2.14
- **@radix-ui/react-toggle**: ^1.1.9
- **@radix-ui/react-toggle-group**: ^1.1.10
- **@radix-ui/react-tooltip**: ^1.2.7
- **@supabase/supabase-js**: ^2.74.0
- **@tanstack/react-query**: ^5.83.0
- **class-variance-authority**: ^0.7.1
- **clsx**: ^2.1.1
- **cmdk**: ^1.1.1
- **date-fns**: ^3.6.0
- **embla-carousel-react**: ^8.6.0
- **input-otp**: ^1.4.2
- **jspdf**: ^3.0.3
- **lucide-react**: ^0.462.0
- **next-themes**: ^0.3.0
- **react**: ^18.3.1
- **react-day-picker**: ^8.10.1
- **react-dom**: ^18.3.1
- **react-hook-form**: ^7.61.1
- **react-resizable-panels**: ^2.1.9
- **react-router-dom**: ^6.30.1
- **recharts**: ^2.15.4
- **sonner**: ^1.7.4
- **tailwind-merge**: ^2.6.0
- **tailwindcss-animate**: ^1.0.7
- **vaul**: ^0.9.9
- **xlsx**: ^0.18.5
- **zod**: ^3.25.76


### 🧰 Dependências de Desenvolvimento
- **@eslint/js**: ^9.32.0
- **@tailwindcss/typography**: ^0.5.16
- **@testing-library/jest-dom**: ^6.0.0
- **@testing-library/react**: ^14.0.0
- **@types/node**: ^22.16.5
- **@types/react**: ^18.3.23
- **@types/react-dom**: ^18.3.7
- **@vitejs/plugin-react-swc**: ^3.11.0
- **autoprefixer**: ^10.4.21
- **eslint**: ^9.32.0
- **eslint-plugin-react-hooks**: ^5.2.0
- **eslint-plugin-react-refresh**: ^0.4.20
- **globals**: ^15.15.0
- **lovable-tagger**: ^1.1.10
- **postcss**: ^8.5.6
- **tailwindcss**: ^3.4.17
- **typescript**: ^5.8.3
- **typescript-eslint**: ^8.38.0
- **vite**: ^5.4.19
- **vitest**: ^2.0.0


---

## 🧱 Estrutura do Projeto
```
finansys/
|-- components.json
|-- index.html
|-- package.json
|-- tailwind.config.ts
|-- tsconfig.json
|-- vite.config.ts
|-- src/
    |-- components/
    |-- pages/
    |-- hooks/
    |-- styles/
```

---

## 📄 Licença
Este projeto está sob a licença **MIT**.
