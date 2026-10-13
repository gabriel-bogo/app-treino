import { test, expect, type Page } from '@playwright/test'
import { fazerOnboarding } from './ajudantes'

async function comecar(page: Page) {
  await page.getByRole('button', { name: 'Começar treino' }).click()
  await expect(page.getByRole('button', { name: 'Finalizar' })).toBeVisible()
}

test('registrar séries com 1 toque cada: check inicia o timer de descanso (§3, §11)', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: 45 })
  await comecar(page)
  await expect(page.getByText(/0 de \d séries/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Marcar série 1 como feita' }).click()
  await expect(page.getByTestId('painel-descanso')).toBeVisible()
  await expect(page.getByText(/1 de \d séries/).first()).toBeVisible()
  // +15 / Pular
  await page.getByRole('button', { name: '+15s' }).click()
  await page.getByTestId('painel-descanso').getByRole('button', { name: 'Pular' }).click()
  await expect(page.getByTestId('painel-descanso')).toBeHidden()
})

test('fechar o app no meio do treino e reabrir retoma exatamente do mesmo ponto (§11)', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: 45 })
  await comecar(page)
  // muda a carga da 1ª série e marca duas séries
  const carga = page.getByRole('textbox', { name: 'carga da série 1' })
  await carga.fill('17')
  await carga.blur()
  await page.getByRole('button', { name: 'Marcar série 1 como feita' }).click()
  await page.getByRole('button', { name: 'Marcar série 2 como feita' }).click()
  await expect(page.getByRole('button', { name: 'Desmarcar série 2' })).toBeVisible()
  const nome = await page.getByTestId('nome-exercicio').textContent()
  // dá tempo da gravação no IndexedDB terminar (leva poucos milissegundos)
  await page.waitForTimeout(300)

  // "fecha" o app: recarrega do zero
  await page.goto('/')
  await expect(page.getByText('Continuar treino em andamento?')).toBeVisible()
  await expect(page.getByText(new RegExp(`Parou em: ${nome}, série 3`))).toBeVisible()
  await expect(page.getByText(/Descanso: faltam/)).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Continuar treino' }).click()

  await expect(page.getByTestId('nome-exercicio')).toHaveText(nome!)
  await expect(page.getByRole('button', { name: 'Desmarcar série 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Desmarcar série 2' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'carga da série 1' })).toHaveValue('17')
  await expect(page.getByRole('textbox', { name: 'carga da série 3' })).toHaveValue('17')
  await expect(page.getByTestId('painel-descanso')).toBeVisible()
})

test('finalizar grava o treino, mostra o resumo e avança para o próximo da sequência', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: 45 })
  await expect(page.getByText('Treino A · Superior', { exact: true })).toBeVisible()
  await comecar(page)
  // marca todas as séries de todos os exercícios (preenche carga onde estiver vazia)
  for (let i = 0; i < 60; i++) {
    const botao = page.getByRole('button', { name: /Marcar série \d+ como feita/ }).first()
    if (!(await botao.count())) break
    const cargaVazia = page.getByRole('textbox', { name: /carga da série/ }).first()
    if ((await cargaVazia.count()) && !(await cargaVazia.inputValue())) {
      await cargaVazia.fill('10')
      await cargaVazia.blur()
    }
    await botao.click()
  }
  await page.getByRole('button', { name: 'Finalizar' }).first().click()
  await page.getByRole('button', { name: 'Finalizar e salvar' }).click()
  await expect(page.getByText('Treino concluído')).toBeVisible()
  await expect(page.getByText(/Carga inicial registrada|Meta confirmada|Primeiro registro/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Voltar ao início' }).click()
  await expect(page.getByText('Treino B · Inferior', { exact: true })).toBeVisible()
})

test('fora da ordem: deixar pra depois e tocar em outro exercício', async ({ page }) => {
  await fazerOnboarding(page, { nivel: 'Intermediário', dias: '4', duracao: 60 })
  await comecar(page)
  const primeiro = await page.getByTestId('nome-exercicio').textContent()
  await page.getByRole('button', { name: 'Deixar pra depois' }).click()
  await expect(page.getByTestId('nome-exercicio')).not.toHaveText(primeiro!)
  await page.getByRole('button', { name: new RegExp(primeiro!) }).click()
  await expect(page.getByTestId('nome-exercicio')).toHaveText(primeiro!)
})
