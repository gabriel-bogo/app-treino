import { test, expect } from '@playwright/test'
import { importarBackup, perfilFicticio } from './ajudantes'

function dataIso(diasAtras: number) {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString()
}

const config = () => [{ id: 'app', primeiroUsoEm: new Date().toISOString(), som: true, trocasNoPlano: {}, ultimoBackupEm: new Date().toISOString() }]
const progressoSupino = [{ exercicioId: 'supino-reto-barra', modo: 'carga', carga: 30, cargaAnterior: null, alvo: 9, confirmacoes: 0, segurando: false, fase: 'normal' }]

test('aquecimento: cardio de 5 min, séries de aproximação com outra cor e opção de pular (§6.11)', async ({ page }) => {
  await importarBackup(page, { perfil: [perfilFicticio()], configuracoes: config(), progressao: progressoSupino })
  await page.goto('/')
  await page.getByRole('button', { name: 'Começar treino' }).click()
  await expect(page.getByText('5 minutos de cardio leve (esteira, bike ou elíptico).')).toBeVisible()
  // supino com 30 kg/lado (80 kg total): aproximação 50% × 10 e 70% × 5
  await expect(page.getByTestId('nome-exercicio')).toHaveText('Supino reto com barra')
  await expect(page.getByRole('textbox', { name: 'carga da série A1' })).toHaveValue('10')
  await expect(page.getByRole('textbox', { name: 'repetições da série A1' })).toHaveValue('10')
  await expect(page.getByRole('textbox', { name: 'carga da série A2' })).toHaveValue('18')
  await expect(page.getByRole('textbox', { name: 'repetições da série A2' })).toHaveValue('5')
  await expect(page.getByText('0 de 4 séries')).toBeVisible()
  await expect(page.getByText('Total na barra: 80 kg')).toBeVisible()
  // marcar aproximação não inicia descanso
  await page.getByRole('button', { name: 'Marcar série A1 como feita' }).click()
  await expect(page.getByTestId('painel-descanso')).toBeHidden()
  // timer do aquecimento
  await page.getByRole('button', { name: 'Timer 5:00' }).click()
  await expect(page.getByTestId('painel-descanso')).toContainText('Aquecimento')
  await page.getByRole('button', { name: 'Concluir' }).click()
  await expect(page.getByText('5 minutos de cardio leve (esteira, bike ou elíptico).')).toBeHidden()
})

test('pular aquecimento remove aproximação com aviso leve', async ({ page }) => {
  await importarBackup(page, { perfil: [perfilFicticio()], configuracoes: config(), progressao: progressoSupino })
  await page.goto('/')
  await page.getByRole('button', { name: 'Começar treino' }).click()
  await page.getByRole('button', { name: 'Pular aquecimento' }).click()
  await expect(page.getByText(/ajuda a evitar lesões/)).toBeVisible()
  await page.getByRole('button', { name: 'Pular mesmo assim' }).click()
  await expect(page.getByRole('textbox', { name: 'carga da série A2' })).toHaveCount(0)
})

test('trocar exercício: nunca o original nem um do dia; "só hoje" troca na sessão (§6.10, §11)', async ({ page }) => {
  await importarBackup(page, { perfil: [perfilFicticio()], configuracoes: config(), progressao: progressoSupino })
  await page.goto('/')
  await page.getByRole('button', { name: 'Começar treino' }).click()
  const doDia = await page.getByRole('button', { name: /^.+\d+\/\d+$/ }).allTextContents()
  await page.getByRole('button', { name: '⇄ Trocar exercício' }).click()
  await page.getByRole('button', { name: 'Aparelho ocupado' }).click()
  const candidatos = page.getByTestId('candidatos-troca').locator('li p.font-medium')
  await expect(candidatos.first()).toBeVisible()
  const nomes = await candidatos.allTextContents()
  expect(nomes.length).toBeLessThanOrEqual(3)
  for (const n of nomes) {
    expect(n).not.toBe('Supino reto com barra')
    for (const d of doDia) expect(d.startsWith(n)).toBe(false)
  }
  await page.getByRole('button', { name: /Ver todos/ }).click()
  const todos = await candidatos.allTextContents()
  for (const n of todos) for (const d of doDia) expect(d.startsWith(n)).toBe(false)
  const escolhido = nomes[0]
  await page.getByRole('button', { name: `Escolher ${escolhido}` }).click()
  await page.getByRole('button', { name: 'Só hoje' }).click()
  await expect(page.getByTestId('nome-exercicio')).toHaveText(escolhido)
  await expect(page.getByText('No lugar de Supino reto com barra')).toBeVisible()
})

test('retorno após pausa: card explica e as cargas vêm reduzidas (§6.12)', async ({ page }) => {
  const sessaoAntiga = {
    id: 'antiga', diaId: '3', nomeDia: 'Inferior B', fase: 'normal', inicio: dataIso(15), fim: dataIso(15), status: 'concluida',
    estado: { itens: [], atualUid: null, aquecimentoGeral: 'feito', timer: null }, substituicoes: [],
  }
  await importarBackup(page, { perfil: [perfilFicticio()], configuracoes: config(), progressao: progressoSupino, sessoes: [sessaoAntiga] })
  await page.goto('/')
  await page.getByRole('button', { name: 'Começar treino' }).click()
  await expect(page.getByText(/ficou 15 dias sem treinar/)).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Começar treino' }).click()
  await expect(page.getByText('Retorno após pausa')).toBeVisible()
  // 30 kg por lado −10% = 27
  await expect(page.getByRole('textbox', { name: 'carga da série 1' })).toHaveValue('27')
})

test('mais de 60 dias: pergunta se quer refazer a readaptação', async ({ page }) => {
  const sessaoAntiga = {
    id: 'antiga', diaId: '0', nomeDia: 'Superior A', fase: 'normal', inicio: dataIso(70), fim: dataIso(70), status: 'concluida',
    estado: { itens: [], atualUid: null, aquecimentoGeral: 'feito', timer: null }, substituicoes: [],
  }
  await importarBackup(page, { perfil: [perfilFicticio()], configuracoes: config(), progressao: progressoSupino, sessoes: [sessaoAntiga] })
  await page.goto('/')
  await page.getByRole('button', { name: 'Começar treino' }).click()
  await page.getByRole('button', { name: 'Refazer a readaptação' }).click()
  await expect(page.getByText(/Termine cada série com 3 a 4 repetições sobrando/)).toBeVisible()
  await expect(page.getByText(/Full body/)).toBeVisible()
})
