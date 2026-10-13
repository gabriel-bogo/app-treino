import { test, expect } from '@playwright/test'
import { fazerOnboarding, fazerTreinoCompleto } from './ajudantes'

test('histórico mostra o treino feito, as séries e a evolução por exercício', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: 45 })
  await fazerTreinoCompleto(page)
  await page.getByRole('button', { name: 'Voltar ao início' }).click()
  await page.getByRole('button', { name: 'Histórico' }).click()
  await expect(page.getByText('Treino A · Superior')).toBeVisible()
  await page.getByText('Treino A · Superior').click()
  await expect(page.getByRole('cell', { name: '1ª' }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: '10 kg' }).first()).toBeVisible()

  await page.goto('/#/historico')
  await page.getByRole('tab', { name: 'Exercícios' }).click()
  const primeiro = page.getByRole('main').getByRole('button').first()
  await primeiro.click()
  await expect(page.getByText('Próximo treino')).toBeVisible()
  await expect(page.getByText(/Início:/)).toBeVisible()
})

test('peso do corpo no 1º treino: pede as repetições antes de marcar e define o alvo', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: 45 })
  await page.getByRole('button', { name: 'Começar treino' }).click()
  await page.getByRole('button', { name: /Abdominal/ }).click()
  await expect(page.getByTestId('nome-exercicio')).toHaveText('Abdominal (crunch)')
  await page.getByRole('button', { name: 'Marcar série 1 como feita' }).click()
  await expect(page.getByText('Digite quantas repetições você fez antes de marcar a série.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Marcar série 1 como feita' })).toBeVisible()
  await page.getByRole('textbox', { name: 'repetições da série 1' }).fill('15')
  await page.getByRole('textbox', { name: 'repetições da série 1' }).blur()
  await page.getByRole('button', { name: 'Marcar série 1 como feita' }).click()
  await expect(page.getByRole('button', { name: 'Desmarcar série 1' })).toBeVisible()
})
