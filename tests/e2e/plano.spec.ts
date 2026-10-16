import { test, expect } from '@playwright/test'
import { fazerOnboarding } from './ajudantes'

test('depois do onboarding a tela inicial mostra o próximo treino e o plano da semana', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: 60 })
  await expect(page.getByText('Próximo treino')).toBeVisible()
  await expect(page.getByText('Treino A · Superior', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ver plano da semana' }).click()
  await expect(page.getByText('Superior / Inferior / Superior / Inferior')).toBeVisible()
  for (const nome of ['Treino A · Superior', 'Treino B · Inferior', 'Treino C · Superior', 'Treino D · Inferior']) {
    await expect(page.getByText(nome, { exact: true })).toBeVisible()
  }
  await expect(page.getByText(/Ordem dos treinos: A → B → C → D/)).toBeVisible()
  await expect(page.getByText('Próximo', { exact: true })).toBeVisible()
  // C4: seções por músculo
  await expect(page.getByRole('heading', { name: 'Peito' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Quadríceps' }).first()).toBeVisible()
})

test('iniciante começa na readaptação com full body', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Iniciante', dias: '5', duracao: 45 })
  await expect(page.getByText('Readaptação', { exact: true })).toBeVisible()
  await page.goto('/#/plano')
  await expect(page.getByText(/Fase de readaptação: treino 1 de 15/)).toBeVisible()
  // C9: readaptação na divisão escolhida (5 dias), só mais leve
  // C24: 5 dias com a sugestão de 5 treinos
  await expect(page.getByText(/^Treino [A-E] · /)).toHaveCount(5)
  await expect(page.getByText(/Ordem dos treinos: A → B → C → D → E\./)).toBeVisible()
  await expect(page.getByText(/os mesmos treinos passam para 3 a 4 séries de 8 a 12/)).toBeVisible()
})

test('com limitação de ombro: aquecimento específico e nada da lista proibida (§11)', async ({ page }) => {
  await fazerOnboarding(page, { limitacoes: ['Ombro'], dias: '6', duracao: 90 })
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
  await expect(page.getByText('Superior / Inferior', { exact: true })).toBeVisible()
})

test('C25: pular treino mostra o seguinte no lugar', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4' })
  await expect(page.getByText('Treino A · Superior', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pular treino' }).click()
  await expect(page.getByText('Treino B · Inferior', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Treino B · Inferior', { exact: true })).toBeVisible()
  // C26: desfazer
  await page.getByRole('button', { name: 'Desfazer pulo (voltar para Treino A)' }).click()
  await expect(page.getByText('Treino A · Superior', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Desfazer pulo/ })).toHaveCount(0)
})
