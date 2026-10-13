import { db } from './banco'
import { garantirPlano } from './plano'
import { aplicarProgressaoDaSessao } from './progressao'
import { novoId } from '../domain/ids'
import { dataLocal } from '../domain/datas'
import { exercicioPorId, mapaAjustes } from '../domain/biblioteca'
import { configDoExercicio, sugestaoParaTreino } from '../domain/progressao/sugestao'
import { criarItem, estadoInicialTreino, temTrabalhoFeito, type DadosSubstituto } from '../domain/treino/sessao'
import { precisaAproximacao, seriesAproximacao } from '../domain/treino/aquecimento'
import type { AjustePausa, EstadoTreino, EventoProgressao, Fase, ItemTreino, Perfil, RegistroSerie, Sessao } from '../domain/tipos'

export const HORAS_SESSAO_LONGA = 4

export async function sessaoEmAndamento(): Promise<Sessao | undefined> {
  return db.sessoes.where('status').equals('andamento').first()
}

/** Cria a sessão do próximo treino da sequência (§6.2), com cargas e reps pré-preenchidas (§3). */
export async function iniciarSessao(agora: Date = new Date(), ajustePausa?: AjustePausa): Promise<Sessao> {
  const existente = await sessaoEmAndamento()
  if (existente) return existente
  await garantirPlano(agora)
  const perfil = await db.perfil.get('perfil')
  const plano = await db.plano.get('atual')
  if (!perfil || !plano) throw new Error('Sem perfil ou plano')
  const dia = await db.diasPlano.where('ordem').equals(plano.proximoIndice).first()
  if (!dia) throw new Error('Plano sem dias')
  const exercicios = (await db.exerciciosPlano.where('diaId').equals(dia.id).toArray()).sort((a, b) => a.ordem - b.ordem)
  const ajustes = mapaAjustes(await db.ajustesExercicio.toArray())
  // §6.11: aproximação antes do primeiro composto de cada grupo grande do dia
  const trabalho = exercicios.filter((e) => e.papel === 'trabalho').map((e) => exercicioPorId(e.exercicioId)!)
  const marcas = precisaAproximacao(trabalho)
  const comAproximacao = new Set(trabalho.filter((_, i) => marcas[i]).map((x) => x.id))

  const itens = []
  for (const e of exercicios) {
    const ex = exercicioPorId(e.exercicioId)
    if (!ex) continue
    if (e.papel === 'aquecimento_ombro') {
      itens.push(criarItem({ ...e, cargaSugerida: null, alvo: e.repsMax }))
      continue
    }
    const estado = await db.progressao.get(ex.id)
    const cfg = configDoExercicio(ex, perfil, ajustes.get(ex.id), plano.fase)
    const sug = sugestaoParaTreino(estado, ex, cfg, plano.fase)
    const aproximacao = comAproximacao.has(ex.id) ? seriesAproximacao(ex, sug.carga, cfg.incremento, ajustes.get(ex.id)) : []
    itens.push(criarItem({ ...e, cargaSugerida: sug.carga, alvo: sug.alvo, aproximacao }))
  }

  const sessao: Sessao = {
    id: novoId(),
    diaId: dia.id,
    nomeDia: dia.nome,
    fase: plano.fase,
    inicio: agora.toISOString(),
    status: 'andamento',
    estado: estadoInicialTreino(itens),
    substituicoes: [],
    ...(ajustePausa ? { ajustePausa } : {}),
  }
  await db.sessoes.put(sessao)
  return sessao
}

/** Dados do substituto (§6.10): última carga registrada nele, alvo pelo seu próprio ciclo. */
export async function dadosSubstituto(exercicioId: string, original: ItemTreino, perfil: Perfil, fase: Fase): Promise<DadosSubstituto> {
  const ex = exercicioPorId(exercicioId)!
  const ajuste = await db.ajustesExercicio.get(exercicioId)
  const cfg = configDoExercicio(ex, perfil, ajuste, fase)
  const sug = sugestaoParaTreino(await db.progressao.get(exercicioId), ex, cfg, fase)
  const tinhaAproximacao = original.series.some((s) => s.tipo === 'aproximacao' && !s.feita)
  return {
    exercicioId,
    cargaSugerida: sug.carga,
    alvo: sug.alvo,
    aproximacao: tinhaAproximacao && ex.tipo === 'composto' ? seriesAproximacao(ex, sug.carga, cfg.incremento, ajuste) : [],
  }
}

/** Salva o estado do treino a cada toque (§3: "Treino nunca se perde"). */
export async function salvarEstado(sessaoId: string, estado: EstadoTreino) {
  await db.sessoes.update(sessaoId, { estado })
}

export async function atualizarSessao(sessaoId: string, mudancas: Partial<Sessao>) {
  await db.sessoes.update(sessaoId, mudancas)
}

export async function descartarSessao(sessaoId: string) {
  await db.sessoes.update(sessaoId, { status: 'descartada', fim: new Date().toISOString() })
}

/**
 * Finaliza com o que foi registrado: grava as séries (setLogs), aplica a
 * progressão de cada exercício e avança a sequência do plano.
 * Sem nenhuma série de trabalho feita, o treino é descartado.
 */
export async function finalizarSessao(sessaoId: string, agora: Date = new Date()): Promise<{ status: 'concluida' | 'descartada'; eventos: EventoProgressao[] }> {
  const sessao = await db.sessoes.get(sessaoId)
  const perfil = await db.perfil.get('perfil')
  if (!sessao || !perfil || sessao.status !== 'andamento') return { status: 'descartada', eventos: [] }
  if (!temTrabalhoFeito(sessao.estado)) {
    await descartarSessao(sessaoId)
    return { status: 'descartada', eventos: [] }
  }
  const fim = agora.toISOString()
  const concluida: Sessao = {
    ...sessao,
    status: 'concluida',
    fim,
    duracaoSeg: Math.max(0, Math.round((agora.getTime() - new Date(sessao.inicio).getTime()) / 1000)),
    estado: { ...sessao.estado, timer: null },
  }
  const registros: RegistroSerie[] = []
  concluida.estado.itens.forEach((item, ordemExercicio) => {
    let n = 0
    for (const s of item.series) {
      if (!s.feita) continue
      n++
      registros.push({
        id: novoId(),
        sessaoId,
        exercicioId: item.exercicioId,
        ordemExercicio,
        serie: n,
        tipo: s.tipo,
        carga: s.carga,
        reps: s.reps,
        repsAlvo: s.repsAlvo,
        ...(item.dor ? { dor: true } : {}),
        feitaEm: s.feitaEm ?? fim,
        ...(s.descansoRealSeg !== undefined ? { descansoRealSeg: s.descansoRealSeg } : {}),
        data: dataLocal(new Date(sessao.inicio)),
      })
    }
  })

  await db.transaction('rw', db.sessoes, db.series, db.plano, db.diasPlano, async () => {
    await db.sessoes.put(concluida)
    await db.series.bulkPut(registros)
    const plano = await db.plano.get('atual')
    if (plano) {
      const totalDias = await db.diasPlano.count()
      const ordemFeita = Number(sessao.diaId)
      await db.plano.put({
        ...plano,
        treinosNaFase: plano.fase === sessao.fase ? plano.treinosNaFase + 1 : plano.treinosNaFase,
        proximoIndice: totalDias ? (ordemFeita + 1) % totalDias : 0,
      })
    }
  })
  const eventos = await aplicarProgressaoDaSessao(concluida, perfil)
  await garantirPlano(agora)
  return { status: 'concluida', eventos }
}
