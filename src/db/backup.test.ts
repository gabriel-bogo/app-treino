import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { BancoTreino, TABELAS, VERSAO_SCHEMA, apagarTudo } from './banco'
import { gerarBackup, nomeArquivoBackup, precisaLembrarBackup, restaurarBackup, validarBackup } from './backup'
import type { Perfil, RegistroCorpo, Sessao } from '../domain/tipos'

// Dados FICTÍCIOS (repositório público: nunca usar dados reais).
const perfil: Perfil = {
  id: 'perfil',
  nome: 'Pessoa Teste',
  sexo: 'feminino',
  nascimento: '1990-05-20',
  alturaCm: 165,
  pesoInicialKg: 62.5,
  nivel: 'iniciante',
  objetivos: ['saude'],
  enfases: [],
  diasSemana: 3,
  duracaoMin: 60,
  limitacoes: [],
  nConfirmacoes: 2,
  avisoSaudeAceitoEm: '2026-01-01T10:00:00.000Z',
  criadoEm: '2026-01-01T10:00:00.000Z',
  atualizadoEm: '2026-01-01T10:00:00.000Z',
}

function sessao(id: string, inicio: string): Sessao {
  return {
    id,
    diaId: 'A',
    nomeDia: 'Full body A',
    fase: 'readaptacao',
    inicio,
    fim: inicio,
    status: 'concluida',
    estado: { itens: [], atualUid: null, aquecimentoGeral: 'feito', timer: null },
    substituicoes: [],
  }
}

let contador = 0
function bancoNovo() {
  return new BancoTreino(`teste-${Date.now()}-${contador++}`)
}

async function popular(banco: BancoTreino) {
  await banco.perfil.put(perfil)
  await banco.sessoes.bulkPut([sessao('s1', '2026-02-01T10:00:00.000Z'), sessao('s2', '2026-02-03T10:00:00.000Z')])
  const corpo: RegistroCorpo[] = [
    { data: '2026-02-01', pesoKg: 62.4 },
    { data: '2026-02-02', pesoKg: 62.1, cinturaCm: 74 },
  ]
  await banco.registrosCorpo.bulkPut(corpo)
  await banco.series.put({
    id: 'r1',
    sessaoId: 's1',
    exercicioId: 'supino',
    ordemExercicio: 0,
    serie: 1,
    tipo: 'trabalho',
    carga: 20,
    reps: 12,
    repsAlvo: 12,
    feitaEm: '2026-02-01T10:10:00.000Z',
    data: '2026-02-01',
  })
  await banco.configuracoes.put({ id: 'app', primeiroUsoEm: '2026-01-01T10:00:00.000Z', som: true, trocasNoPlano: { a: 'b' } })
}

async function despejar(banco: BancoTreino) {
  const r: Record<string, unknown[]> = {}
  for (const t of TABELAS) r[t] = await banco.table(t).toArray()
  return r
}

describe('backup (seção 8)', () => {
  it('nome do arquivo segue app-treino-backup-AAAA-MM-DD.json', () => {
    expect(nomeArquivoBackup(new Date(2026, 9, 3, 15, 0))).toBe('app-treino-backup-2026-10-03.json')
  })

  it('exportar → apagar tudo → importar volta exatamente igual (critério da seção 11)', async () => {
    const banco = bancoNovo()
    await popular(banco)
    const antes = await despejar(banco)

    const backup = await gerarBackup(banco, '0.1.0')
    const texto = JSON.stringify(backup)

    await apagarTudo(banco)
    expect(await banco.perfil.count()).toBe(0)
    expect(await banco.sessoes.count()).toBe(0)

    const v = validarBackup(texto)
    expect(v.ok).toBe(true)
    if (!v.ok) return
    await restaurarBackup(banco, v.backup)
    expect(await despejar(banco)).toEqual(antes)
  })

  it('resumo mostra nº de sessões e datas antes de confirmar', async () => {
    const banco = bancoNovo()
    await popular(banco)
    const v = validarBackup(JSON.stringify(await gerarBackup(banco, '0.1.0')))
    expect(v.ok).toBe(true)
    if (!v.ok) return
    expect(v.resumo.sessoes).toBe(2)
    expect(v.resumo.primeiraSessao).toBe('2026-02-01T10:00:00.000Z')
    expect(v.resumo.ultimaSessao).toBe('2026-02-03T10:00:00.000Z')
    expect(v.resumo.registrosCorpo).toBe(2)
    expect(v.resumo.temPerfil).toBe(true)
  })

  it('importar substitui tudo (não mistura com o que havia)', async () => {
    const banco = bancoNovo()
    await popular(banco)
    const backup = await gerarBackup(banco, '0.1.0')
    await banco.registrosCorpo.put({ data: '2026-03-01', pesoKg: 70 })
    await restaurarBackup(banco, backup)
    expect(await banco.registrosCorpo.get('2026-03-01')).toBeUndefined()
    expect(await banco.registrosCorpo.count()).toBe(2)
  })

  it('rejeita arquivos inválidos', () => {
    expect(validarBackup('isso não é json').ok).toBe(false)
    expect(validarBackup({ app: 'outro-app', schemaVersion: 1, tabelas: {} }).ok).toBe(false)
    expect(validarBackup({ app: 'app-treino', tabelas: {} }).ok).toBe(false)
    expect(validarBackup({ app: 'app-treino', schemaVersion: VERSAO_SCHEMA + 1, tabelas: {} }).ok).toBe(false)
    expect(validarBackup({ app: 'app-treino', schemaVersion: 1, tabelas: { sessoes: 'x' } }).ok).toBe(false)
    expect(validarBackup({ app: 'app-treino', schemaVersion: 1, tabelas: { sessoes: [{ semId: true }] } }).ok).toBe(false)
  })

  it('aceita backup vazio (app sem dados)', () => {
    const v = validarBackup({ app: 'app-treino', schemaVersion: 1, exportadoEm: '2026-01-01T00:00:00Z', versaoApp: '0.1.0', tabelas: {} })
    expect(v.ok).toBe(true)
  })
})

describe('lembrete de backup (§8: mais de 14 dias)', () => {
  const agora = new Date('2026-03-20T12:00:00')
  it('não lembra com backup recente', () => {
    expect(precisaLembrarBackup({ primeiroUsoEm: '2026-01-01T12:00:00', ultimoBackupEm: '2026-03-10T12:00:00' }, agora)).toBe(false)
  })
  it('não lembra com exatamente 14 dias', () => {
    expect(precisaLembrarBackup({ primeiroUsoEm: '2026-01-01T12:00:00', ultimoBackupEm: '2026-03-06T12:00:00' }, agora)).toBe(false)
  })
  it('lembra com 15 dias', () => {
    expect(precisaLembrarBackup({ primeiroUsoEm: '2026-01-01T12:00:00', ultimoBackupEm: '2026-03-05T12:00:00' }, agora)).toBe(true)
  })
  it('nunca fez backup: conta a partir do primeiro uso (B12)', () => {
    expect(precisaLembrarBackup({ primeiroUsoEm: '2026-03-10T12:00:00' }, agora)).toBe(false)
    expect(precisaLembrarBackup({ primeiroUsoEm: '2026-03-01T12:00:00' }, agora)).toBe(true)
  })

  it('importa backup da versão anterior (perfil com objetivo e ênfase únicos)', async () => {
    const banco = bancoNovo()
    const { objetivos: _o, enfases: _e, ...resto } = perfil
    const antigo = {
      app: 'app-treino',
      schemaVersion: 1,
      exportadoEm: '2026-02-05T10:00:00.000Z',
      versaoApp: '0.1.0',
      tabelas: { perfil: [{ ...resto, objetivo: 'emagrecimento', enfase: 'equilibrado', duracaoMin: 75 }] },
    }
    const v = validarBackup(JSON.stringify(antigo))
    expect(v.ok).toBe(true)
    if (!v.ok) return
    await restaurarBackup(banco, v.backup)
    const p = (await banco.perfil.get('perfil')) as unknown as Record<string, unknown>
    expect(p.objetivos).toEqual(['emagrecimento'])
    expect(p.enfases).toEqual([])
    expect(p.duracaoMin).toBe(75)
    expect('objetivo' in p).toBe(false)
    expect('enfase' in p).toBe(false)
    expect(VERSAO_SCHEMA).toBe(2)
  })
})
