import { expect, type Page } from '@playwright/test'

// Dados FICTÍCIOS para os testes (repositório público).
export interface OpcoesOnboarding {
  nome?: string
  sexo?: 'Feminino' | 'Masculino'
  nascimento?: string
  altura?: string
  peso?: string
  nivel?: 'Iniciante' | 'Retornando' | 'Intermediário'
  objetivos?: ('Hipertrofia' | 'Emagrecimento' | 'Saúde geral')[]
  /** vazio = equilibrado */
  enfases?: ('Inferiores' | 'Superiores' | 'Glúteos')[]
  dias?: '2' | '3' | '4' | '5' | '6'
  /** quantos treinos diferentes (padrão: a sugestão do app para os dias) */
  treinos?: 2 | 3 | 4 | 5 | 6
  /** minutos (30 a 120, de 5 em 5); padrão 60 */
  duracao?: number
  limitacoes?: ('Joelho' | 'Lombar' | 'Ombro' | 'Punho')[]
  /** false = para na proposta do plano, sem aprovar */
  aprovar?: boolean
}

export async function fazerOnboarding(page: Page, o: OpcoesOnboarding = {}) {
  await page.goto('/')
  await page.getByLabel('Li e entendi o aviso').check()
  await page.getByRole('button', { name: 'Começar' }).click()

  await page.getByLabel('Nome ou apelido').fill(o.nome ?? 'Pessoa Teste')
  await page.getByRole('radio', { name: o.sexo ?? 'Feminino' }).click()
  await page.getByLabel('Data de nascimento').fill(o.nascimento ?? '1992-03-15')
  await page.getByLabel('Altura (cm)').fill(o.altura ?? '168')
  await page.getByLabel('Peso (kg)').fill(o.peso ?? '64,5')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByRole('radio', { name: new RegExp('^' + (o.nivel ?? 'Intermediário')) }).click()
  for (const obj of o.objetivos ?? ['Hipertrofia']) await page.getByRole('button', { name: new RegExp('^' + obj) }).click()
  for (const e of o.enfases ?? []) await page.getByRole('button', { name: new RegExp('^' + e) }).click()
  await page.getByRole('radiogroup', { name: 'Dias por semana' }).getByRole('radio', { name: o.dias ?? '4', exact: true }).click()
  if (o.treinos) await page.getByRole('radiogroup', { name: 'Quantos treinos diferentes?' }).getByRole('radio', { name: new RegExp(`^${o.treinos} treinos`) }).click()
  if (o.duracao) await page.getByRole('slider', { name: /Duração de cada treino/ }).fill(String(o.duracao))
  await page.getByRole('button', { name: 'Continuar' }).click()

  for (const l of o.limitacoes ?? []) await page.getByRole('button', { name: l, exact: true }).click()
  await page.getByRole('button', { name: 'Criar meu plano' }).click()
  // C5: o app apresenta o plano para aprovar
  await expect(page.getByRole('heading', { name: 'Seu plano de treino' })).toBeVisible()
  await expect(page.getByTestId('treino-do-plano').first()).toBeVisible()
  if (o.aprovar === false) return
  await page.getByRole('button', { name: 'Aprovar plano' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Começar treino' })).toBeVisible()
}

/** Perfil fictício para montar backups de teste. */
export function perfilFicticio(mudancas: Record<string, unknown> = {}) {
  return {
    id: 'perfil',
    nome: 'Pessoa Teste',
    sexo: 'masculino',
    nascimento: '1988-03-15',
    alturaCm: 178,
    pesoInicialKg: 86,
    nivel: 'intermediario',
    objetivos: ['hipertrofia'],
    enfases: [],
    diasSemana: 4,
    treinos: 4,
    duracaoMin: 60,
    limitacoes: [],
    nConfirmacoes: 2,
    avisoSaudeAceitoEm: '2026-01-01T10:00:00.000Z',
    criadoEm: '2026-01-01T10:00:00.000Z',
    atualizadoEm: '2026-01-01T10:00:00.000Z',
    ...mudancas,
  }
}

function dataLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Pesos fictícios nos últimos `dias` (oscilando em torno de uma tendência de queda). */
export function pesosFicticios(dias: number, inicio = 86, cinturaCm?: number) {
  const hoje = new Date()
  const r = []
  for (let i = dias; i >= 1; i--) {
    const d = new Date(hoje)
    d.setDate(d.getDate() - i)
    const ruido = ((i * 37) % 11) / 10 - 0.5
    r.push({ data: dataLocal(d), pesoKg: Math.round((inicio - (dias - i) * 0.05 + ruido) * 10) / 10, ...(cinturaCm && i % 7 === 0 ? { cinturaCm } : {}) })
  }
  return r
}

/** Carrega dados pelo fluxo de importação de backup (mesmo caminho do usuário). */
export async function importarBackup(page: Page, tabelas: Record<string, unknown[]>) {
  await page.goto('/#/backup')
  const conteudo = JSON.stringify({ app: 'app-treino', schemaVersion: 3, exportadoEm: new Date().toISOString(), versaoApp: 'teste', tabelas })
  await page.getByTestId('arquivo-backup').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(conteudo) })
  await page.getByRole('button', { name: 'Substituir tudo' }).click()
  await expect(page.getByText('Backup importado com sucesso.')).toBeVisible()
}

/** Faz o treino do dia marcando todas as séries (preenche carga vazia com 10) e finaliza. */
export async function fazerTreinoCompleto(page: Page) {
  await page.getByRole('button', { name: 'Começar treino' }).click()
  await expect(page.getByTestId('nome-exercicio')).toBeVisible()
  for (let i = 0; i < 80; i++) {
    const botao = page.getByRole('button', { name: /^Marcar série .+ como feita$/ }).first()
    if (!(await botao.count())) break
    const cargaVazia = page.getByRole('textbox', { name: /carga da série \d+$/ }).first()
    if ((await cargaVazia.count()) && !(await cargaVazia.inputValue())) {
      await cargaVazia.fill('10')
      await cargaVazia.blur()
    }
    const repsVazias = page.getByRole('textbox', { name: /repetições da série \d+$/ })
    for (const r of await repsVazias.all()) {
      if (!(await r.inputValue())) {
        await r.fill('12')
        await r.blur()
      }
    }
    await botao.click()
  }
  await page.getByRole('button', { name: 'Finalizar', exact: true }).click()
  await page.getByRole('button', { name: 'Finalizar e salvar' }).click()
  await expect(page.getByText('Treino concluído')).toBeVisible()
}
