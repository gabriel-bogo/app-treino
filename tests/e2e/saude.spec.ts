import { test, expect } from '@playwright/test'
import { fazerOnboarding, importarBackup, perfilFicticio, pesosFicticios } from './ajudantes'

test('registrar peso de hoje na tela inicial; registrar de novo substitui', async ({ page }) => {
  await fazerOnboarding(page, { peso: '64,5' })
  // o peso inicial já conta como registro de hoje
  await expect(page.getByText('64,5 kg')).toBeVisible()
  await page.getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Peso (kg)').fill('64,1')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('64,1 kg')).toBeVisible()
  await page.goto('/#/saude')
  await expect(page.locator('tbody tr')).toHaveCount(1)
})

test('saúde mostra tendência, gráfico, IMC, faixa adequada e cintura', async ({ page }) => {
  await importarBackup(page, {
    perfil: [perfilFicticio()],
    registrosCorpo: pesosFicticios(40, 86, 90),
    configuracoes: [{ id: 'app', primeiroUsoEm: new Date().toISOString(), som: true, trocasNoPlano: {} }],
  })
  await page.goto('/#/saude')
  await expect(page.getByText('Peso de tendência')).toBeVisible()
  await expect(page.getByRole('img', { name: /Gráfico de peso/ })).toBeVisible()
  await expect(page.getByText(/Para 1,78 m: 58,6 a 78,9 kg/)).toBeVisible()
  await expect(page.getByText('Sobrepeso', { exact: true })).toBeVisible()
  await expect(page.getByText(/90,0 cm · Sem risco aumentado/)).toBeVisible()
  await expect(page.getByText(/Provável massa muscular/)).toBeVisible()
  await expect(page.getByText(/IMC é uma estimativa/)).toBeVisible()
  // lembrete visual: não registrou hoje
  await page.goto('/')
  await expect(page.getByText('Você ainda não registrou o peso hoje.')).toBeVisible()
})
