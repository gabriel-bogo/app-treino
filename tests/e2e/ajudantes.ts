import { expect, type Page } from '@playwright/test'

// Dados FICTÍCIOS para os testes (repositório público).
export interface OpcoesOnboarding {
  nome?: string
  sexo?: 'Feminino' | 'Masculino'
  nascimento?: string
  altura?: string
  peso?: string
  nivel?: 'Iniciante' | 'Retornando' | 'Intermediário'
  objetivo?: 'Hipertrofia' | 'Emagrecimento' | 'Saúde geral'
  enfase?: 'Equilibrado' | 'Inferiores' | 'Superiores' | 'Glúteos'
  dias?: '2' | '3' | '4' | '5' | '6'
  duracao?: '30 min' | '45 min' | '60 min' | '75 min' | '90 min'
  limitacoes?: ('Joelho' | 'Lombar' | 'Ombro' | 'Punho')[]
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
  await page.getByRole('radio', { name: new RegExp('^' + (o.objetivo ?? 'Hipertrofia')) }).click()
  await page.getByRole('radio', { name: new RegExp('^' + (o.enfase ?? 'Equilibrado')) }).click()
  await page.getByRole('radiogroup', { name: 'Dias por semana' }).getByRole('radio', { name: o.dias ?? '4', exact: true }).click()
  await page.getByRole('radio', { name: o.duracao ?? '60 min' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  for (const l of o.limitacoes ?? []) await page.getByRole('button', { name: l, exact: true }).click()
  await page.getByRole('button', { name: 'Criar meu plano' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
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
    objetivo: 'hipertrofia',
    enfase: 'equilibrado',
    diasSemana: 4,
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
  const conteudo = JSON.stringify({ app: 'app-treino', schemaVersion: 1, exportadoEm: new Date().toISOString(), versaoApp: 'teste', tabelas })
  await page.getByTestId('arquivo-backup').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(conteudo) })
  await page.getByRole('button', { name: 'Substituir tudo' }).click()
  await expect(page.getByText('Backup importado com sucesso.')).toBeVisible()
}
