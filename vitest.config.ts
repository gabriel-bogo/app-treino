import { defineConfig } from 'vitest/config'

// Testes de lógica (src/**/*.test.ts). Os testes de ponta a ponta (navegador)
// ficam em tests/e2e e rodam com o Playwright.
export default defineConfig({
  define: {
    __VERSAO_APP__: JSON.stringify('teste'),
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
})
