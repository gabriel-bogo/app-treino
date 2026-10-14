import { db, obterConfiguracoes } from './banco'
import { dataLocal, diasEntre } from '../domain/datas'
import { avaliarPeso, exigeLiberacaoMedica, pesoTendencia, registrosDePeso } from '../domain/saude'
import { gerarPlano, type ContextoMotor } from '../domain/motor/gerar'
import { revisarVolume } from '../domain/motor/volume'
import { DIAS_REVISAO_VOLUME, totalTreinosReadaptacao } from '../domain/motor/regras'
import { exercicioPorId, mapaAjustes } from '../domain/biblioteca'
import type { DiaPlano, ExercicioPlano, Fase, Grupo, Perfil, Plano } from '../domain/tipos'

// Mantém o plano ativo em dia com o perfil (B15): o plano só é refeito quando
// muda algo que o afeta (perfil, marcações da biblioteca, trocas, fase,
// semana da readaptação ou nível de volume). Nunca muda no meio de um treino.

/** §6.1 + §10: readaptação para iniciante/retornando e para obesidade grau II ou III. */
export function precisaReadaptacao(perfil: Perfil, pesoAtualKg: number, hoje: string): boolean {
  if (perfil.nivel === 'iniciante' || perfil.nivel === 'retornando') return true
  const av = avaliarPeso({ pesoKg: pesoAtualKg, alturaCm: perfil.alturaCm, nascimento: perfil.nascimento, sexo: perfil.sexo, hoje })
  return exigeLiberacaoMedica(av.classe)
}

export function semanaDaReadaptacao(treinosNaFase: number, diasSemana: number): number {
  return Math.floor(treinosNaFase / diasSemana)
}

/** Muda quando as regras do motor mudam: o plano salvo é refeito na próxima abertura. */
const VERSAO_MOTOR = 5

function assinatura(ctx: ContextoMotor): string {
  const marcados = [...ctx.ajustes.values()]
    .filter((a) => a.indisponivel || a.evitar)
    .map((a) => `${a.exercicioId}:${a.indisponivel ? 'i' : ''}${a.evitar ? 'e' : ''}`)
    .sort()
  const p = ctx.perfil
  return JSON.stringify([
    VERSAO_MOTOR,
    p.sexo,
    p.nivel,
    [...p.objetivos].sort(),
    [...p.enfases].sort(),
    p.diasSemana,
    p.treinos,
    p.musculosPorTreino ?? null,
    p.duracaoMin,
    [...p.limitacoes].sort(),
    ctx.fase,
    ctx.semanaReadaptacao,
    ctx.nivelVolume,
    marcados,
    ctx.trocasNoPlano,
    ctx.incluidos ?? [],
  ])
}

async function pesoAtual(perfil: Perfil, hoje: string): Promise<number> {
  const pesos = registrosDePeso(await db.registrosCorpo.toArray())
  return pesoTendencia(pesos, hoje)?.valor ?? perfil.pesoInicialKg
}

/**
 * Garante que existe um plano válido para o perfil atual. Chamado ao abrir a
 * tela inicial/plano e depois de salvar o perfil.
 */
export async function garantirPlano(agora: Date = new Date()): Promise<void> {
  const iso = agora.toISOString()
  const hoje = dataLocal(agora)
  await db.transaction(
    'rw',
    [db.perfil, db.plano, db.diasPlano, db.exerciciosPlano, db.sessoes, db.ajustesExercicio, db.configuracoes, db.registrosCorpo, db.eventosProgressao],
    async () => {
      const perfil = await db.perfil.get('perfil')
      if (!perfil) return
      // nunca mexe no plano com um treino em andamento
      if ((await db.sessoes.where('status').equals('andamento').count()) > 0) return

      let plano = await db.plano.get('atual')
      const faseDoPerfil = async (): Promise<Fase> => (precisaReadaptacao(perfil, await pesoAtual(perfil, hoje), hoje) ? 'readaptacao' : 'normal')
      if (!plano) {
        const fase = await faseDoPerfil()
        plano = {
          id: 'atual',
          fase,
          divisao: '',
          inicioFase: iso,
          treinosNaFase: 0,
          proximoIndice: 0,
          nivelVolume: {},
          ultimaRevisaoVolume: iso,
          geradoEm: iso,
          avisos: [],
          assinatura: '',
          mensagemFase: null,
        }
      }

      // C6: antes do primeiro treino, a fase acompanha o perfil (ex: mudou o nível
      // de "iniciante" para "intermediário" na revisão do plano)
      if (plano.treinosNaFase === 0 && (await db.sessoes.where('status').equals('concluida').count()) === 0) {
        const fase = await faseDoPerfil()
        if (fase !== plano.fase) plano = { ...plano, fase, inicioFase: iso, treinosNaFase: 0, proximoIndice: 0, mensagemFase: null }
      }

      // §6.1: ao final da readaptação, o app avisa e passa para a divisão normal
      if (plano.fase === 'readaptacao' && plano.treinosNaFase >= totalTreinosReadaptacao(perfil.diasSemana)) {
        plano = {
          ...plano,
          fase: 'normal',
          inicioFase: iso,
          treinosNaFase: 0,
          proximoIndice: 0,
          nivelVolume: {},
          ultimaRevisaoVolume: iso,
          mensagemFase:
            'Readaptação concluída! A partir de agora o treino segue o ciclo de 8 a 12 repetições, com mais séries. No primeiro treino de cada exercício, escolha uma carga para fazer cerca de 8 repetições com 1 a 3 sobrando.',
        }
      }

      // A3: revisão do volume a cada 3 semanas na fase normal
      if (plano.fase === 'normal' && diasEntre(plano.ultimaRevisaoVolume, agora) >= DIAS_REVISAO_VOLUME) {
        const exercicios = await db.exerciciosPlano.toArray()
        const porGrupo: Partial<Record<Grupo, string[]>> = {}
        for (const e of exercicios) {
          if (e.papel !== 'trabalho') continue
          const g = exercicioPorId(e.exercicioId)?.grupo
          if (g) (porGrupo[g] ??= []).push(e.exercicioId)
        }
        const eventos = await db.eventosProgressao.where('data').aboveOrEqual(plano.ultimaRevisaoVolume).toArray()
        plano = { ...plano, nivelVolume: revisarVolume({ nivelVolume: plano.nivelVolume, exerciciosPorGrupo: porGrupo, eventos }), ultimaRevisaoVolume: iso }
      }

      const config = await obterConfiguracoes()
      const ctx: ContextoMotor = {
        perfil,
        fase: plano.fase,
        semanaReadaptacao: plano.fase === 'readaptacao' ? semanaDaReadaptacao(plano.treinosNaFase, perfil.diasSemana) : 0,
        nivelVolume: plano.nivelVolume,
        ajustes: mapaAjustes(await db.ajustesExercicio.toArray()),
        trocasNoPlano: config.trocasNoPlano,
        incluidos: config.incluidosNoPlano ?? [],
      }
      const novaAssinatura = assinatura(ctx)
      const temDias = (await db.diasPlano.count()) > 0
      if (novaAssinatura === plano.assinatura && temDias) {
        await db.plano.put(plano)
        return
      }

      const gerado = gerarPlano(ctx)
      const dias: DiaPlano[] = gerado.dias.map((d, ordem) => ({
        id: String(ordem),
        ordem,
        nome: d.nome,
        tipo: d.tipo,
        variante: d.variante,
        grupos: d.grupos,
        minutosEstimados: d.minutosEstimados,
      }))
      const exercicios: ExercicioPlano[] = gerado.dias.flatMap((d, ordem) =>
        d.exercicios.map((e, i) => ({ id: `${ordem}-${i}`, diaId: String(ordem), ordem: i, ...e })),
      )
      const novo: Plano = {
        ...plano,
        divisao: gerado.divisao,
        avisos: gerado.avisos,
        assinatura: novaAssinatura,
        geradoEm: iso,
        proximoIndice: plano.proximoIndice < dias.length ? plano.proximoIndice : 0,
      }
      await db.diasPlano.clear()
      await db.exerciciosPlano.clear()
      await db.diasPlano.bulkAdd(dias)
      await db.exerciciosPlano.bulkAdd(exercicios)
      await db.plano.put(novo)
    },
  )
}

export async function dispensarMensagemFase() {
  const plano = await db.plano.get('atual')
  if (plano) await db.plano.put({ ...plano, mensagemFase: null })
}

/** C14: inclui um exercício num treino do plano (vale nos próximos treinos). */
export async function incluirNoPlano(variante: string, exercicioId: string) {
  const config = await obterConfiguracoes()
  const lista = (config.incluidosNoPlano ?? []).filter((i) => !(i.variante === variante && i.exercicioId === exercicioId))
  await db.configuracoes.put({ ...config, incluidosNoPlano: [...lista, { variante, exercicioId }] })
  await garantirPlano()
}

/** C14: tira do treino um exercício que a pessoa tinha incluído. */
export async function removerDoPlano(variante: string, exercicioId: string) {
  const config = await obterConfiguracoes()
  const lista = (config.incluidosNoPlano ?? []).filter((i) => !(i.variante === variante && i.exercicioId === exercicioId))
  await db.configuracoes.put({ ...config, incluidosNoPlano: lista })
  await garantirPlano()
}
