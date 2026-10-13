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
  await expect(page.getByText(/sua classificação é ABAIXO DO PESO/)).toBeVisible()
  await page.getByRole('button', { name: /^Emagrecimento/ }).click()
  await expect(page.getByText(/Converse com um médico ou nutricionista/)).toBeVisible()
})

test('C7: IMC antes do objetivo, em vermelho, com a classificação e o objetivo recomendado em destaque', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Li e entendi o aviso').check()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByLabel('Nome ou apelido').fill('Pessoa Teste')
  await page.getByRole('radio', { name: 'Masculino' }).click()
  await page.getByLabel('Data de nascimento').fill('1990-01-10')
  await page.getByLabel('Altura (cm)').fill('170')
  await page.getByLabel('Peso (kg)').fill('94') // IMC 32,5 (fictício)
  await page.getByRole('button', { name: 'Continuar' }).click()
  const msg = page.getByTestId('mensagem-imc')
  await expect(msg).toHaveText('Pelo IMC (32,5), sua classificação é OBESIDADE GRAU I. Emagrecimento pode ser um bom objetivo para você.')
  await expect(msg.locator('strong')).toHaveText('OBESIDADE GRAU I')
  await expect(msg).toHaveCSS('background-color', 'oklch(0.577 0.245 27.325)') // red-600
  // a mensagem vem antes das opções de objetivo
  const yMsg = (await msg.boundingBox())!.y
  const emag = page.getByRole('button', { name: /^Emagrecimento/ })
  expect((await emag.boundingBox())!.y).toBeGreaterThan(yMsg)
  await expect(emag).toContainText('Recomendado')
  await expect(emag.locator('span').first()).toHaveCSS('font-weight', '800')
  await expect(page.getByRole('button', { name: /^Hipertrofia/ })).not.toContainText('Recomendado')
  // vários objetivos; ênfase sem "Equilibrado"
  await emag.click()
  await page.getByRole('button', { name: /^Hipertrofia/ }).click()
  await expect(emag).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /^Hipertrofia/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /^Equilibrado/ })).toHaveCount(0)
  await page.getByRole('button', { name: /^Superiores/ }).click()
  await page.getByRole('button', { name: /^Inferiores/ }).click()
  await expect(page.getByText(/se anulam: o treino fica equilibrado/)).toBeVisible()
  // duração na barra deslizante
  const barra = page.getByRole('slider', { name: /Duração de cada treino/ })
  await expect(barra).toHaveAttribute('min', '30')
  await expect(barra).toHaveAttribute('max', '120')
  await barra.fill('95')
  await expect(page.getByText('1 h 35 min').first()).toBeVisible()
})

test('C5: depois do onboarding mostra o plano para aprovar, trocar exercício ou mudar as escolhas', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Iniciante', dias: '5', enfases: ['Superiores'], aprovar: false })
  // readaptação explicada, com a divisão de depois
  await expect(page.getByText('Primeiro: 3 semanas de readaptação')).toBeVisible()
  await expect(page.getByText(/os primeiros 12 treinos são de corpo inteiro/)).toBeVisible()
  await expect(page.getByText(/no máximo 4 treinos por semana/)).toBeVisible()
  await expect(page.getByText('Superior / Inferior / Push / Pull / Legs', { exact: true })).toBeVisible()
  await expect(page.getByText(/^Treino [AB] · Full body$/)).toHaveCount(2)
  await page.getByRole('button', { name: 'Ver como fica depois da readaptação' }).click()
  await expect(page.getByText('Treino E · Legs', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Esconder o plano de depois' }).click()

  // trocar um exercício do Treino A
  const treinoA = page.getByTestId('treino-do-plano').first()
  const botaoTrocar = treinoA.getByRole('button', { name: /^Trocar / }).first()
  const original = (await botaoTrocar.getAttribute('aria-label'))!.replace('Trocar ', '')
  await botaoTrocar.click()
  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByText('A troca vale para todos os treinos em que ele aparece.')).toBeVisible()
  const escolher = dialogo.getByRole('button', { name: /^Escolher / }).first()
  const novo = (await escolher.getAttribute('aria-label'))!.replace('Escolher ', '')
  await escolher.click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(treinoA.getByRole('button', { name: `Trocar ${novo}` })).toBeVisible()
  await expect(treinoA.getByRole('button', { name: `Trocar ${original}`, exact: true })).toHaveCount(0)

  // mudar as escolhas: vira intermediário e sai da readaptação
  await page.getByRole('button', { name: 'Mudar minhas escolhas' }).click()
  await page.getByRole('radio', { name: /^Intermediário/ }).click()
  await page.getByRole('button', { name: 'Salvar e ver o plano' }).click()
  await expect(page.getByRole('heading', { name: 'Seu plano de treino' })).toBeVisible()
  await expect(page.getByText('Superior / Inferior / Push / Pull / Legs', { exact: true })).toBeVisible()
  for (const nome of ['Treino A · Superior', 'Treino B · Inferior', 'Treino C · Push', 'Treino D · Pull', 'Treino E · Legs']) {
    await expect(page.getByText(nome, { exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Aprovar plano' }).click()
  await expect(page.getByText('Treino A · Superior', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Começar treino' })).toBeVisible()
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
