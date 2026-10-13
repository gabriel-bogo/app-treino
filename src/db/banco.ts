import Dexie, { type EntityTable } from 'dexie'
import type {
  AjusteExercicio,
  Configuracoes,
  DiaPlano,
  EstadoProgressao,
  EventoProgressao,
  Exercicio,
  ExercicioPlano,
  Perfil,
  Plano,
  RegistroCorpo,
  RegistroSerie,
  Sessao,
} from '../domain/tipos'
import { normalizarPerfil } from '../domain/perfil'

// Banco local (IndexedDB via Dexie), seção 7 da especificação.
// Correspondência com os nomes da spec:
//   profile → perfil              customExercises → exerciciosProprios
//   unavailableEquipment / flags → ajustesExercicio (indisponível, evitar, incremento)
//   plan → plano   planDays → diasPlano   planExercises → exerciciosPlano
//   sessions → sessoes   setLogs → series   settings → configuracoes
//   bodyLogs → registrosCorpo
//   (extra) progressao + eventosProgressao: estado do ciclo 8→12 por exercício (§6.8)
//
// A biblioteca base de exercícios NÃO é copiada para o banco: ela vem do
// arquivo src/data/exercises.ptbr.json, que faz parte do app. Assim, uma versão
// nova do app traz a biblioteca atualizada sem migração. O que é do usuário
// (marcações e incrementos) fica em ajustesExercicio.
//
// Versionamento: cada mudança de estrutura cria um novo db.version(n) abaixo.
// VERSAO_SCHEMA vai junto no arquivo de backup.

export const VERSAO_SCHEMA = 2
export const NOME_BANCO = 'app-treino'

export class BancoTreino extends Dexie {
  perfil!: EntityTable<Perfil, 'id'>
  ajustesExercicio!: EntityTable<AjusteExercicio, 'exercicioId'>
  exerciciosProprios!: EntityTable<Exercicio, 'id'>
  plano!: EntityTable<Plano, 'id'>
  diasPlano!: EntityTable<DiaPlano, 'id'>
  exerciciosPlano!: EntityTable<ExercicioPlano, 'id'>
  sessoes!: EntityTable<Sessao, 'id'>
  series!: EntityTable<RegistroSerie, 'id'>
  progressao!: EntityTable<EstadoProgressao, 'exercicioId'>
  eventosProgressao!: EntityTable<EventoProgressao, 'id'>
  configuracoes!: EntityTable<Configuracoes, 'id'>
  registrosCorpo!: EntityTable<RegistroCorpo, 'data'>

  constructor(nome = NOME_BANCO) {
    super(nome)
    this.version(1).stores({
      perfil: 'id',
      ajustesExercicio: 'exercicioId',
      exerciciosProprios: 'id',
      plano: 'id',
      diasPlano: 'id, ordem',
      exerciciosPlano: 'id, diaId, exercicioId',
      sessoes: 'id, status, inicio',
      series: 'id, sessaoId, exercicioId, data',
      progressao: 'exercicioId',
      eventosProgressao: 'id, exercicioId, data',
      configuracoes: 'id',
      registrosCorpo: 'data',
    })
    // v2: perfil com vários objetivos e ênfases e duração livre (C1 a C3).
    // Mesmas tabelas e índices; só converte o perfil salvo.
    this.version(2)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('perfil')
          .toCollection()
          .modify((p) => {
            const novo = normalizarPerfil(p)
            delete p.objetivo
            delete p.enfase
            Object.assign(p, novo)
          }),
      )
  }
}

/** Nomes de todas as tabelas (backup exporta/importa todas). */
export const TABELAS = [
  'perfil',
  'ajustesExercicio',
  'exerciciosProprios',
  'plano',
  'diasPlano',
  'exerciciosPlano',
  'sessoes',
  'series',
  'progressao',
  'eventosProgressao',
  'configuracoes',
  'registrosCorpo',
] as const

export type NomeTabela = (typeof TABELAS)[number]

/** Chave primária de cada tabela (usada na validação do backup). */
export const CHAVES: Record<NomeTabela, string> = {
  perfil: 'id',
  ajustesExercicio: 'exercicioId',
  exerciciosProprios: 'id',
  plano: 'id',
  diasPlano: 'id',
  exerciciosPlano: 'id',
  sessoes: 'id',
  series: 'id',
  progressao: 'exercicioId',
  eventosProgressao: 'id',
  configuracoes: 'id',
  registrosCorpo: 'data',
}

export const db = new BancoTreino()

/** Configurações do app, criando o registro padrão no primeiro uso. */
export async function obterConfiguracoes(banco: BancoTreino = db): Promise<Configuracoes> {
  const atual = await banco.configuracoes.get('app')
  if (atual) return atual
  const padrao: Configuracoes = {
    id: 'app',
    primeiroUsoEm: new Date().toISOString(),
    som: true,
    trocasNoPlano: {},
  }
  await banco.configuracoes.put(padrao)
  return padrao
}

export async function atualizarConfiguracoes(mudancas: Partial<Omit<Configuracoes, 'id'>>, banco: BancoTreino = db) {
  const atual = await obterConfiguracoes(banco)
  await banco.configuracoes.put({ ...atual, ...mudancas })
}

/** Apaga TODOS os dados do app neste aparelho. */
export async function apagarTudo(banco: BancoTreino = db) {
  await banco.transaction('rw', TABELAS.map((t) => banco.table(t)), async () => {
    for (const t of TABELAS) await banco.table(t).clear()
  })
}
