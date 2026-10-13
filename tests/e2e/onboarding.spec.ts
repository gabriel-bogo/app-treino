import { test, expect } from '@playwright/test'
import { fazerOnboarding } from './ajudantes'

test('primeira abertura exige aceitar o aviso de saúde', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('não substitui médico')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Começar' })).toBeDisabled()
  await page.getByLabel('Li e entendi o aviso').check()
  await expect(page.getByRole('button', { name: 'Começar' })).toBeEnabled()
})

test('valida os dados pessoais antes de avançar', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Li e entendi o aviso').check()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Digite seu nome ou apelido.')).toBeVisible()
  await expect(page.getByText('Altura entre 100 e 250 cm.')).toBeVisible()
})

test('mostra a classificação do IMC ao escolher o objetivo e alerta abaixo do peso', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Li e entendi o aviso').check()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByLabel('Nome ou apelido').fill('Pessoa Teste')
  await page.getByRole('radio', { name: 'Feminino' }).click()
  await page.getByLabel('Data de nascimento').fill('1995-01-10')
  await page.getByLabel('Altura (cm)').fill('170')
  await page.getByLabel('Peso (kg)').fill('50')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText(/sua classificação é abaixo do peso/)).toBeVisible()
  await page.getByRole('radio', { name: /^Emagrecimento/ }).click()
  await expect(page.getByText(/Converse com um médico ou nutricionista/)).toBeVisible()
})

test('onboarding completo cria o perfil e grava o peso inicial; perfil é editável', async ({ page }) => {
  await fazerOnboarding(page, { limitacoes: ['Ombro'] })
  await page.goto('/#/perfil')
  await expect(page.getByLabel('Nome ou apelido')).toHaveValue('Pessoa Teste')
  await expect(page.getByRole('button', { name: 'Ombro', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Confirme com seu fisioterapeuta quais exercícios evitar.')).toBeVisible()
  await page.getByRole('button', { name: 'Ombro', exact: true }).click()
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText(/Perfil salvo/)).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Nenhuma' })).toHaveAttribute('aria-pressed', 'true')
})
