import { db } from './banco'
import { novoId } from '../domain/ids'
import { exercicioPorId, mapaAjustes } from '../domain/biblioteca'
import { aplicarTreino, estadoInicial, faixaDaFase, passarParaCargaExtra, prepararParaFase, type SerieFeita } from '../domain/progressao/ciclo'
import { aplicarPausa, regraDePausa, type RegraPausa } from '../domain/progressao/pausa'
import { configDoExercicio } from '../domain/progressao/sugestao'
import { diasEntre } from '../domain/datas'
import type { EstadoProgressao, EventoProgressao, Perfil, Sessao } from '../domain/tipos'

/**
 * Ao finalizar a sessão: aplica o resultado de cada exercício ao seu ciclo de
 * progressão (§6.8, §6.13) e registra aumentos e regressões no histórico.
 * Só séries de trabalho planejadas e marcadas contam (A7); aquecimento e
 * séries extras não entram (§6.11).
 */
export async function aplicarProgressaoDaSessao(sessao: Sessao, perfil: Perfil): Promise<EventoProgressao[]> {
  const ajustes = mapaAjustes(await db.ajustesExercicio.toArray())
  const registrados: EventoProgressao[] = []
  await db.transaction('rw', db.progressao, db.eventosProgressao, async () => {
    for (const item of sessao.estado.itens) {
      if (item.papel !== 'trabalho') continue
      const ex = exercicioPorId(item.exercicioId)
      if (!ex) continue
      const feitas: SerieFeita[] = item.series
        .filter((s) => s.tipo === 'trabalho' && s.feita && s.reps !== null)
        .map((s) => ({ carga: s.carga, reps: s.reps! }))
      if (!feitas.length) continue
      const salvo = await db.progressao.get(ex.id)
      const atual = salvo ? prepararParaFase(salvo, sessao.fase) : estadoInicial(ex.id, sessao.fase, ex.tipoCarga === 'pesoCorpo')
      const cfg = configDoExercicio(ex, perfil, ajustes.get(ex.id), sessao.fase)
      const r = aplicarTreino(atual, feitas, cfg, sessao.inicio, item.esforco)
      await db.progressao.put(r.estado)
      for (const ev of r.eventos) {
        const evento: EventoProgressao = { id: novoId(), exercicioId: ex.id, data: sessao.inicio, sessaoId: sessao.id, ...ev }
        await db.eventosProgressao.put(evento)
        registrados.push(evento)
      }
    }
  })
  return registrados
}

/** Dias desde o último treino concluído (null se nunca treinou). */
export async function diasSemTreinar(agora: Date = new Date()): Promise<{ dias: number; ultimaSessaoId: string } | null> {
  const concluidas = await db.sessoes.where('status').equals('concluida').toArray()
  if (!concluidas.length) return null
  const ultima = concluidas.sort((a, b) => b.inicio.localeCompare(a.inicio))[0]
  return { dias: diasEntre(ultima.inicio, agora), ultimaSessaoId: ultima.id }
}

/** Regra de pausa ainda não aplicada (§6.12; aplicada uma vez por pausa). */
export async function pausaPendente(agora: Date = new Date()): Promise<(RegraPausa & { ultimaSessaoId: string }) | null> {
  const info = await diasSemTreinar(agora)
  if (!info) return null
  const regra = regraDePausa(info.dias)
  if (!regra) return null
  const config = await db.configuracoes.get('app')
  if (config?.pausaAplicadaApos === info.ultimaSessaoId) return null
  return { ...regra, ultimaSessaoId: info.ultimaSessaoId }
}

/** Reduz as cargas de todos os exercícios conforme a pausa e marca como aplicada. */
export async function aplicarPausaNosExercicios(regra: RegraPausa & { ultimaSessaoId: string }, perfil: Perfil, agora: Date = new Date()) {
  const ajustes = mapaAjustes(await db.ajustesExercicio.toArray())
  const plano = await db.plano.get('atual')
  const fase = plano?.fase ?? 'normal'
  await db.transaction('rw', db.progressao, db.eventosProgressao, db.configuracoes, async () => {
    const estados: EstadoProgressao[] = await db.progressao.toArray()
    for (const e of estados) {
      const ex = exercicioPorId(e.exercicioId)
      if (!ex) continue
      const cfg = configDoExercicio(ex, perfil, ajustes.get(ex.id), fase)
      const novo = aplicarPausa(e, regra, cfg.incremento, faixaDaFase(fase).min, ex.assistido)
      if (novo === e) continue
      await db.progressao.put(novo)
      await db.eventosProgressao.put({
        id: novoId(),
        exercicioId: e.exercicioId,
        data: agora.toISOString(),
        tipo: 'retorno_pausa',
        de: { carga: e.carga, alvo: e.alvo },
        para: { carga: novo.carga, alvo: novo.alvo },
      })
    }
    const config = await db.configuracoes.get('app')
    if (config) await db.configuracoes.put({ ...config, pausaAplicadaApos: regra.ultimaSessaoId })
  })
}

// ───────────── Escolhas do peso do corpo (§6.13) ─────────────

/** No teto: adicionar carga (cinto/colete/halter) e entrar no ciclo 6.8 em 8 reps. */
export async function escolherCargaExtra(exercicioId: string) {
  const e = await db.progressao.get(exercicioId)
  if (e) await db.progressao.put(passarParaCargaExtra(e))
}

/** Usa outro exercício no lugar deste nos próximos treinos (variação mais difícil ou versão assistida). */
export async function trocarExercicioNoPlano(origemId: string, destinoId: string) {
  const config = await db.configuracoes.get('app')
  if (config) {
    // se o exercício já era um substituto (A → B) e agora vira C, a troca fica A → C;
    // voltar ao original desfaz a troca
    const trocas = { ...config.trocasNoPlano }
    const chave = Object.keys(trocas).find((k) => trocas[k] === origemId) ?? origemId
    if (chave === destinoId) delete trocas[chave]
    else trocas[chave] = destinoId
    await db.configuracoes.put({ ...config, trocasNoPlano: trocas })
  }
  const e = await db.progressao.get(origemId)
  if (e) await db.progressao.put({ ...e, noTeto: false, sugerirAssistida: false })
}

export async function dispensarOferta(exercicioId: string) {
  const e = await db.progressao.get(exercicioId)
  if (e) await db.progressao.put({ ...e, noTeto: false, sugerirAssistida: false })
}
