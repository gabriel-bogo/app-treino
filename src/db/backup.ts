import { CHAVES, TABELAS, VERSAO_SCHEMA, type BancoTreino, type NomeTabela } from './banco'
import { dataLocal, diasEntre } from '../domain/datas'
import type { Configuracoes, Sessao } from '../domain/tipos'
import { normalizarPerfil } from '../domain/perfil'

// Backup manual (seção 8): exportar todos os dados num arquivo JSON e importar
// de volta ("substituir tudo").

export const IDENTIFICADOR_APP = 'app-treino'

export interface ArquivoBackup {
  app: typeof IDENTIFICADOR_APP
  schemaVersion: number
  exportadoEm: string
  versaoApp: string
  tabelas: Partial<Record<NomeTabela, unknown[]>>
}

export interface ResumoBackup {
  exportadoEm: string
  sessoes: number
  primeiraSessao?: string
  ultimaSessao?: string
  registrosCorpo: number
  temPerfil: boolean
  nomePerfil?: string
}

export type ResultadoValidacao =
  | { ok: true; backup: ArquivoBackup; resumo: ResumoBackup }
  | { ok: false; erro: string }

/** Nome do arquivo: app-treino-backup-AAAA-MM-DD.json */
export function nomeArquivoBackup(agora: Date = new Date()): string {
  return `app-treino-backup-${dataLocal(agora)}.json`
}

export async function gerarBackup(banco: BancoTreino, versaoApp: string, agora: Date = new Date()): Promise<ArquivoBackup> {
  const tabelas: ArquivoBackup['tabelas'] = {}
  await banco.transaction('r', TABELAS.map((t) => banco.table(t)), async () => {
    for (const t of TABELAS) tabelas[t] = await banco.table(t).toArray()
  })
  return {
    app: IDENTIFICADOR_APP,
    schemaVersion: VERSAO_SCHEMA,
    exportadoEm: agora.toISOString(),
    versaoApp,
    tabelas,
  }
}

function resumir(backup: ArquivoBackup): ResumoBackup {
  const sessoes = ((backup.tabelas.sessoes ?? []) as Sessao[]).filter((s) => s.status === 'concluida')
  const datas = sessoes.map((s) => s.inicio).sort()
  const perfil = (backup.tabelas.perfil ?? [])[0] as { nome?: string } | undefined
  return {
    exportadoEm: backup.exportadoEm,
    sessoes: sessoes.length,
    primeiraSessao: datas[0],
    ultimaSessao: datas[datas.length - 1],
    registrosCorpo: (backup.tabelas.registrosCorpo ?? []).length,
    temPerfil: !!perfil,
    nomePerfil: perfil?.nome,
  }
}

/** Confere estrutura e versão do arquivo antes de importar. */
export function validarBackup(conteudo: unknown): ResultadoValidacao {
  let dados = conteudo
  if (typeof conteudo === 'string') {
    try {
      dados = JSON.parse(conteudo)
    } catch {
      return { ok: false, erro: 'O arquivo não é um JSON válido.' }
    }
  }
  if (!dados || typeof dados !== 'object') return { ok: false, erro: 'Arquivo vazio ou inválido.' }
  const b = dados as Partial<ArquivoBackup>
  if (b.app !== IDENTIFICADOR_APP) return { ok: false, erro: 'Este arquivo não é um backup do App Treino.' }
  if (typeof b.schemaVersion !== 'number' || !Number.isInteger(b.schemaVersion) || b.schemaVersion < 1) {
    return { ok: false, erro: 'Versão do backup não reconhecida.' }
  }
  if (b.schemaVersion > VERSAO_SCHEMA) {
    return {
      ok: false,
      erro: 'Este backup foi feito numa versão mais nova do app. Atualize o app antes de importar.',
    }
  }
  if (!b.tabelas || typeof b.tabelas !== 'object') return { ok: false, erro: 'Backup sem dados.' }
  for (const [nome, linhas] of Object.entries(b.tabelas)) {
    if (!(TABELAS as readonly string[]).includes(nome)) continue
    if (!Array.isArray(linhas)) return { ok: false, erro: `Dados corrompidos em "${nome}".` }
    const chave = CHAVES[nome as NomeTabela]
    for (const linha of linhas) {
      if (!linha || typeof linha !== 'object' || (linha as Record<string, unknown>)[chave] == null) {
        return { ok: false, erro: `Registro inválido em "${nome}".` }
      }
    }
  }
  const backup = b as ArquivoBackup
  return { ok: true, backup, resumo: resumir(backup) }
}

/** Substitui TODOS os dados do aparelho pelos do backup (numa única transação). */
export async function restaurarBackup(banco: BancoTreino, backup: ArquivoBackup) {
  await banco.transaction('rw', TABELAS.map((t) => banco.table(t)), async () => {
    for (const t of TABELAS) {
      await banco.table(t).clear()
      let linhas = backup.tabelas[t] ?? []
      // backup de versão anterior (schemaVersion 1): perfil no formato antigo
      if (t === 'perfil') linhas = linhas.map((p) => normalizarPerfil(p as object))
      if (linhas.length) await banco.table(t).bulkAdd(linhas)
    }
  })
}

/** Lembrete na tela inicial se o último backup tiver mais de 14 dias (§8; B12: conta do primeiro uso). */
export function precisaLembrarBackup(config: Pick<Configuracoes, 'ultimoBackupEm' | 'primeiroUsoEm'>, agora: Date = new Date()): boolean {
  const referencia = config.ultimoBackupEm ?? config.primeiroUsoEm
  return diasEntre(referencia, agora) > 14
}
