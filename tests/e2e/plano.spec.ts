import { test, expect } from '@playwright/test'
import { fazerOnboarding } from './ajudantes'

test('depois do onboarding a tela inicial mostra o próximo treino e o plano da semana', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: '60 min' })
  await expect(page.getByText('Próximo treino')).toBeVisible()
  await expect(page.getByText('Superior A', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ver plano da semana' }).click()
  await expect(page.getByText('Superior / Inferior / Superior / Inferior')).toBeVisible()
  for (const nome of ['Superior A', 'Inferior A', 'Superior B', 'Inferior B']) await expect(page.getByText(new RegExp(`\\d\\. ${nome}`))).toBeVisible()
  await expect(page.getByText('Próximo', { exact: true })).toBeVisible()
})

test('iniciante começa na readaptação com full body', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Iniciante', dias: '5', duracao: '45 min' })
  await expect(page.getByText('Readaptação', { exact: true })).toBeVisible()
  await page.goto('/#/plano')
  await expect(page.getByText(/Fase de readaptação: treino 1 de 12/)).toBeVisible()
  await expect(page.getByText(/^\d\. Full body/)).toHaveCount(4)
})

test('com limitação de ombro: aquecimento específico e nada da lista proibida (§11)', async ({ page }) => {
  await fazerOnboarding(page, { limitacoes: ['Ombro'], dias: '6', duracao: '90 min' })
  await page.goto('/#/plano')
  await expect(page.getByText('Rotação externa com elástico').first()).toBeVisible()
  for (const proibido of ['Desenvolvimento por trás da nuca', 'Puxada por trás da nuca', 'Remada alta', 'Mergulho']) {
    await expect(page.getByText(new RegExp(proibido))).toHaveCount(0)
  }
})

test('mudar o perfil refaz o plano', async ({ page }) => {
  await fazerOnboarding(page, { dias: '4' })
  await page.goto('/#/perfil')
  await page.getByRole('radiogroup', { name: 'Dias por semana' }).getByRole('radio', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await page.goto('/#/plano')
  await expect(page.getByText('Full body A / B', { exact: true })).toBeVisible()
})
