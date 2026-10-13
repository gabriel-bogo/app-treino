import { test, expect, type BrowserContext } from '@playwright/test'

// Critérios de aceite (seção 11):
// - "Funciona em modo avião depois de instalado"
// - "Nenhuma requisição de rede em uso normal"

const ROTAS = ['/', '/#/plano', '/#/historico', '/#/saude', '/#/mais', '/#/sobre', '/#/instalar', '/#/configuracoes', '/#/biblioteca', '/#/biblioteca/agachamento-livre']

function vigiarRequisicoesExternas(context: BrowserContext, origem: string) {
  const externas: string[] = []
  context.on('request', (req) => {
    const url = new URL(req.url())
    if (url.protocol === 'data:' || url.protocol === 'blob:') return
    if (url.origin !== origem) externas.push(req.url())
  })
  return externas
}

test('abre e navega sem internet depois da primeira visita', async ({ page, context, baseURL }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  for (const rota of ROTAS) {
    await page.goto(new URL(rota, baseURL).toString())
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  }
  await page.reload()
  await expect(page.locator('h1').first()).toBeVisible()

  // imagens dos exercícios também vêm do cache (§5: nunca da internet)
  await page.goto(new URL('/#/biblioteca/leg-press', baseURL).toString())
  const img = page.locator('img[alt^="Leg press"]').first()
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
})

test('nenhuma requisição para fora do próprio site', async ({ page, context, baseURL }) => {
  const externas = vigiarRequisicoesExternas(context, new URL(baseURL!).origin)
  for (const rota of ROTAS) {
    await page.goto(new URL(rota, baseURL).toString())
    await expect(page.locator('h1').first()).toBeVisible()
  }
  await page.waitForTimeout(500)
  expect(externas).toEqual([])
})

test('manifest permite instalar como app em tela cheia', async ({ request }) => {
  const resp = await request.get('/manifest.webmanifest')
  expect(resp.ok()).toBe(true)
  const m = await resp.json()
  expect(m.display).toBe('standalone')
  expect(m.lang).toBe('pt-BR')
  expect(m.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true)
  const apple = await request.get('/icons/apple-touch-icon.png')
  expect(apple.ok()).toBe(true)
})
