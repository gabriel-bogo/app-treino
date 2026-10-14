import { defineConfig, devices } from '@playwright/test'

// Os testes montam datas fictícias no Node; o fuso precisa ser o mesmo do navegador
// (senão, perto da meia-noite, "hoje" é um dia diferente em cada lado).
process.env.TZ = 'America/Sao_Paulo'

// Testes de ponta a ponta: rodam o app de verdade (build de produção) num
// Chromium e verificam offline, ausência de requisições externas, retomada de
// treino etc. Para rodar: npm run build && npm run test:e2e
const PORTA = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    serviceWorkers: 'allow',
  },
  projects: [
    {
      name: 'celular',
      use: {
        ...devices['Pixel 7'],
        launchOptions: process.env.PW_CHROMIUM_PATH
          ? { executablePath: process.env.PW_CHROMIUM_PATH }
          : undefined,
      },
    },
  ],
  webServer: {
    command: `npx vite preview --port ${PORTA} --strictPort`,
    port: PORTA,
    reuseExistingServer: false,
  },
})
