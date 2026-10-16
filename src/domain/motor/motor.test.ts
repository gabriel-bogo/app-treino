import { describe, expect, it } from 'vitest'
import { avisoFrequencia, frequenciaPorMusculo, textoAvisoFrequencia } from './divisao'
import { treinosRecomendados } from '../perfil'
import { gerarPlano, minutosDoDia, type ContextoMotor, type PlanoGerado } from './gerar'
import { descansoSegundos, focoSuperior, GRANDES, GRUPOS_DO_DIA, gruposDaEnfase } from './regras'
import { BIBLIOTECA, contraindicacaoPara, exercicioPorId } from '../biblioteca'
import type { AjusteExercicio, DiasSemana, DuracaoMin, Enfase, Exercicio, Limitacao, Nivel, Objetivo, Sexo } from '../tipos'

// Critério da seção 11: "Gera plano coerente para todas as combinações de dias
// (2-6) e duração" (C3: agora de 30 a 120 min, de 5 em 5). E: "Com limitação
// ombro, nenhum exercício da lista proibida aparece em plano".

const PROIBIDOS_OMBRO = ['desenvolvimento-nuca', 'puxada-nuca', 'remada-alta', 'mergulho-paralela', 'mergulho-banco', 'mergulho-maquina']

function contexto(perfil: Partial<ContextoMotor['perfil']> = {}, extra: Partial<ContextoMotor> = {}): ContextoMotor {
  const diasSemana = perfil.diasSemana ?? 4
  return {
    // sem `treinos`: um treino diferente por dia (como antes do C10)
    perfil: { sexo: 'masculino', nivel: 'intermediario', objetivos: ['hipertrofia'], enfases: [], diasSemana, treinos: diasSemana, duracaoMin: 60, limitacoes: [], ...perfil },
    fase: 'normal',
    semanaReadaptacao: 0,
    nivelVolume: {},
    ajustes: new Map(),
    trocasNoPlano: {},
    ...extra,
  }
}

const ex = (id: string) => exercicioPorId(id) as Exercicio

/** Verifica as regras gerais num plano qualquer. Retorna a lista de problemas encontrados. */
function problemas(ctx: ContextoMotor, plano: PlanoGerado): string[] {
  const p: string[] = []
  const { perfil, fase } = ctx
  // C9: a readaptação usa a mesma divisão (mesmo número de dias)
  if (plano.dias.length !== perfil.treinos) p.push(`treinos: ${plano.dias.length} ≠ ${perfil.treinos}`)
  // C8: foco em superiores: nada de glúteo isolado, panturrilha ou abdômen; pernas só no dia de pernas, ~3 exercícios
  if (focoSuperior(perfil.enfases)) {
    for (const dia of plano.dias) {
      const grupos = dia.exercicios.filter((e) => e.papel === 'trabalho').map((e) => ex(e.exercicioId).grupo)
      if (grupos.some((g) => ['gluteos', 'panturrilha', 'core'].includes(g))) p.push(`${dia.nome}: tem ${grupos.join(',')}`)
      const pernas = grupos.filter((g) => g === 'quadriceps' || g === 'posteriores').length
      if (pernas > 3) p.push(`${dia.nome}: ${pernas} exercícios de perna`)
    }
  }
  for (const dia of plano.dias) {
    const trabalho = dia.exercicios.filter((e) => e.papel === 'trabalho')
    if (!trabalho.length) p.push(`${dia.nome}: sem exercícios`)
    const ids = dia.exercicios.map((e) => e.exercicioId)
    if (new Set(ids).size !== ids.length) p.push(`${dia.nome}: exercício repetido`)
    const temAquecOmbro = dia.exercicios.some((e) => e.papel === 'aquecimento_ombro')
    const minutos = minutosDoDia(dia.exercicios.map((e) => ({ ex: ex(e.exercicioId), series: e.series, papel: e.papel, descansoSeg: e.descansoSeg })), temAquecOmbro)
    if (minutos > perfil.duracaoMin) p.push(`${dia.nome}: ${minutos} min > ${perfil.duracaoMin}`)
    if (minutos !== dia.minutosEstimados) p.push(`${dia.nome}: estimativa inconsistente`)
    const temEmpurrar = trabalho.some((e) => ['empurrar_horizontal', 'empurrar_vertical'].includes(ex(e.exercicioId).padrao))
    if (perfil.limitacoes.includes('ombro') && temEmpurrar && !temAquecOmbro) p.push(`${dia.nome}: falta aquecimento de ombro`)
    if (temAquecOmbro && !(perfil.limitacoes.includes('ombro') && temEmpurrar)) p.push(`${dia.nome}: aquecimento de ombro sem necessidade`)
    let aquecendo = true
    const blocos: string[] = []
    for (const e of dia.exercicios) {
      const x = ex(e.exercicioId)
      if (contraindicacaoPara(x, perfil.limitacoes) === 'forte') p.push(`${dia.nome}: ${x.id} contraindicado`)
      if (perfil.limitacoes.includes('ombro') && PROIBIDOS_OMBRO.includes(x.id)) p.push(`${dia.nome}: ${x.id} proibido p/ ombro`)
      if (ctx.ajustes.get(x.id)?.indisponivel || ctx.ajustes.get(x.id)?.evitar) p.push(`${dia.nome}: ${x.id} marcado`)
      if (e.papel === 'aquecimento_ombro') {
        if (!aquecendo) p.push(`${dia.nome}: aquecimento fora do início`)
        continue
      }
      aquecendo = false
      if (x.soAquecimento) p.push(`${dia.nome}: ${x.id} é só aquecimento`)
      if (perfil.nivel === 'iniciante' && x.nivel !== 'iniciante') p.push(`${dia.nome}: ${x.id} nível ${x.nivel}`)
      if (x.nivel === 'avancado' && perfil.nivel !== 'avancado') p.push(`${dia.nome}: ${x.id} avançado`)
      // C22: 3 séries é o padrão (4 no máximo na fase normal)
      if (e.series < 3 || e.series > (fase === 'readaptacao' ? 3 : 4)) p.push(`${dia.nome}: ${x.id} com ${e.series} séries`)
      if (x.tipoCarga !== 'pesoCorpo') {
        const faixa = fase === 'readaptacao' ? [12, 15] : [8, 12]
        if (e.repsMin !== faixa[0] || e.repsMax !== faixa[1]) p.push(`${dia.nome}: ${x.id} faixa ${e.repsMin}-${e.repsMax}`)
      }
      if (e.descansoSeg !== descansoSegundos(perfil.objetivos, x.tipo, perfil.sexo, fase)) p.push(`${dia.nome}: ${x.id} descanso ${e.descansoSeg}`)
      if (x.grupo !== 'core' && !GRUPOS_DO_DIA[dia.tipo].includes(x.grupo)) p.push(`${dia.nome}: ${x.id} fora do agrupamento`)
      if (dia.tipo === 'push' && x.categoria === 'pull') p.push(`${dia.nome}: ${x.id} é pull`)
      if (dia.tipo === 'pull' && x.categoria === 'push') p.push(`${dia.nome}: ${x.id} é push`)
      if (blocos[blocos.length - 1] !== x.grupo) blocos.push(x.grupo)
      if (contraindicacaoPara(x, perfil.limitacoes) === 'leve' && !e.alerta) p.push(`${dia.nome}: ${x.id} sem alerta`)
    }
    // C4: cada músculo num bloco só; grandes antes dos pequenos; core no fim;
    // dentro do músculo, composto antes de isolado
    if (new Set(blocos).size !== blocos.length) p.push(`${dia.nome}: músculo espalhado (${blocos.join(' > ')})`)
    const porte = (g: string) => (g === 'core' ? 2 : GRANDES.includes(g as never) ? 0 : 1)
    if (blocos.some((g, i) => i > 0 && porte(g) < porte(blocos[i - 1]))) p.push(`${dia.nome}: ordem de músculos errada (${blocos.join(' > ')})`)
    const trabalhoEx = trabalho.map((e) => ex(e.exercicioId))
    for (const g of blocos) {
      const tipos = trabalhoEx.filter((x) => x.grupo === g).map((x) => x.tipo)
      if (tipos.indexOf('isolado') >= 0 && tipos.lastIndexOf('composto') > tipos.indexOf('isolado')) p.push(`${dia.nome}: ${g} com isolado antes de composto`)
    }
  }
  return p
}

const DIAS: DiasSemana[] = [2, 3, 4, 5, 6]
const DURACOES: DuracaoMin[] = Array.from({ length: 19 }, (_, i) => 30 + 5 * i) // 30, 35, … 120
const NIVEIS: Nivel[] = ['iniciante', 'retornando', 'intermediario', 'avancado']
/** C2: todas as combinações de ênfase (vazio = equilibrado) */
const ENFASES: Enfase[][] = [[], ['inferior'], ['superior'], ['gluteos'], ['superior', 'gluteos'], ['superior', 'inferior'], ['inferior', 'gluteos'], ['inferior', 'superior', 'gluteos']]
/** C1: combinações de objetivo (variam junto com o resto para não multiplicar o teste) */
const OBJETIVOS: Objetivo[][] = [['hipertrofia'], ['emagrecimento'], ['saude'], ['hipertrofia', 'emagrecimento'], ['emagrecimento', 'saude'], ['hipertrofia', 'emagrecimento', 'saude']]
const SEXOS: Sexo[] = ['feminino', 'masculino']
const LIMITACOES: Limitacao[][] = [[], ['ombro'], ['joelho', 'lombar', 'ombro', 'punho']]

describe('motor: todas as combinações (§11)', () => {
  it('gera plano coerente para dias 2-6 × duração 30-120 × nível × ênfases × sexo × limitações × fase', () => {
    const falhas: string[] = []
    let total = 0
    for (const diasSemana of DIAS)
      for (const duracaoMin of DURACOES)
        for (const nivel of NIVEIS)
          for (const enfases of ENFASES)
            for (const sexo of SEXOS)
              for (const limitacoes of LIMITACOES)
                for (const [fase, semana] of [['normal', 0], ['readaptacao', 0], ['readaptacao', 2]] as const) {
                  const objetivos = OBJETIVOS[total % OBJETIVOS.length]
                  // C10: de 2 treinos até um por dia (varia junto, sem multiplicar o teste)
                  const treinos = (2 + (total % (diasSemana - 1))) as DiasSemana
                  const ctx = contexto({ diasSemana, treinos, duracaoMin, nivel, enfases, objetivos, sexo, limitacoes }, { fase, semanaReadaptacao: semana })
                  const plano = gerarPlano(ctx)
                  total++
                  const rotulo = `${diasSemana}d ${treinos}t ${duracaoMin}min ${nivel} ${enfases.join('+') || 'equilibrado'} ${objetivos.join('+')} ${sexo} ${limitacoes.join('+') || 'sem lim'} ${fase}${semana}`
                  for (const pr of problemas(ctx, plano)) falhas.push(`[${rotulo}] ${pr}`)
                }
    expect(total).toBe(5 * 19 * 4 * 8 * 2 * 3 * 3)
    expect(falhas.slice(0, 20)).toEqual([])
  }, 120_000)

  it('é determinístico (mesmas entradas, mesmo plano)', () => {
    const ctx = contexto({ diasSemana: 5, duracaoMin: 75, enfases: ['gluteos'], sexo: 'feminino', limitacoes: ['ombro'] })
    expect(gerarPlano(ctx)).toEqual(gerarPlano(ctx))
  })
})

describe('divisão (§6.2)', () => {
  const nomes = (p: PlanoGerado) => p.dias.map((d) => d.nome)
  it('C18: 2 treinos: Superior/Inferior (nunca full body)', () => {
    expect(nomes(gerarPlano(contexto({ diasSemana: 2 })))).toEqual(['Treino A · Superior', 'Treino B · Inferior'])
    expect(nomes(gerarPlano(contexto({ diasSemana: 2, enfases: ['gluteos'] })))).toEqual(['Treino A · Inferior', 'Treino B · Superior'])
  })
  it('C18: 3 treinos: Push/Pull/Legs para qualquer nível (nunca full body)', () => {
    for (const nivel of NIVEIS) {
      expect(nomes(gerarPlano(contexto({ diasSemana: 3, nivel })))).toEqual(['Treino A · Push', 'Treino B · Pull', 'Treino C · Legs'])
    }
  })
  it('C18: nenhuma divisão sugerida é full body', () => {
    for (const diasSemana of DIAS)
      for (const nivel of NIVEIS)
        for (const enfases of ENFASES)
          for (const fase of ['normal', 'readaptacao'] as const)
            expect(gerarPlano(contexto({ diasSemana, nivel, enfases }, { fase })).dias.some((d) => d.tipo === 'fullbody'), `${diasSemana} ${nivel} ${enfases}`).toBe(false)
  })
  it('4 dias: Superior/Inferior; com ênfase só de inferiores começa por Inferior (C2, C18)', () => {
    // (só "Superiores" marcado usa a divisão de foco em superiores, C8)
    const supInf = ['Treino A · Superior', 'Treino B · Inferior', 'Treino C · Superior', 'Treino D · Inferior']
    const infSup = ['Treino A · Inferior', 'Treino B · Superior', 'Treino C · Inferior', 'Treino D · Superior']
    expect(nomes(gerarPlano(contexto({ diasSemana: 4 })))).toEqual(supInf)
    for (const enfases of [['inferior'], ['gluteos'], ['inferior', 'gluteos'], ['inferior', 'superior', 'gluteos']] as Enfase[][]) {
      expect(nomes(gerarPlano(contexto({ diasSemana: 4, enfases }))), enfases.join('+')).toEqual(infSup)
    }
    for (const enfases of [['superior', 'gluteos'], ['superior', 'inferior']] as Enfase[][]) {
      expect(nomes(gerarPlano(contexto({ diasSemana: 4, enfases }))), enfases.join('+')).toEqual(supInf)
    }
  })
  it('5 dias: Superior/Inferior/Push/Pull/Legs; 6 dias: PPL × 2', () => {
    expect(nomes(gerarPlano(contexto({ diasSemana: 5 })))).toEqual(['Treino A · Superior', 'Treino B · Inferior', 'Treino C · Push', 'Treino D · Pull', 'Treino E · Legs'])
    expect(nomes(gerarPlano(contexto({ diasSemana: 6 })))).toEqual([
      'Treino A · Push',
      'Treino B · Pull',
      'Treino C · Legs',
      'Treino D · Push',
      'Treino E · Pull',
      'Treino F · Legs',
    ])
  })
  it('C9: readaptação usa a mesma divisão e os mesmos exercícios, só com menos séries', () => {
    for (const diasSemana of DIAS) {
      for (const enfases of [[], ['superior']] as Enfase[][]) {
        const normal = gerarPlano(contexto({ diasSemana, nivel: 'retornando', enfases }))
        const read = gerarPlano(contexto({ diasSemana, nivel: 'retornando', enfases }, { fase: 'readaptacao' }))
        expect(nomes(read)).toEqual(nomes(normal))
        // mesmos músculos em cada treino (os exercícios extras podem variar, porque a readaptação usa no máximo 3 séries e completa o tempo com mais exercícios)
        const grupos = (p: PlanoGerado) => p.dias.map((d) => [...new Set(d.exercicios.filter((e) => e.papel === 'trabalho').map((e) => ex(e.exercicioId).grupo))].sort())
        // C28: a readaptação descansa menos (cabe mais no tempo), então pode ganhar um músculo a mais, nunca perder
        grupos(normal).forEach((g, i) => expect(grupos(read)[i]).toEqual(expect.arrayContaining(g.filter((x) => x !== 'core'))))
        expect(read.divisao).toBe(`${normal.divisao} (readaptação)`)
      }
    }
  })
  it('C10: 5 dias com 3 treinos → A, B, C revezando; volume conta a frequência real', () => {
    const p = gerarPlano(contexto({ diasSemana: 5, treinos: 3, duracaoMin: 90, enfases: ['superior'] }))
    expect(nomes(p)).toEqual(['Treino A · Ombros e tríceps', 'Treino B · Peito, costas e bíceps', 'Treino C · Pernas'])
    // cada treino cai 5/3 vezes por semana: o volume semanal chega ao alvo
    for (const g of ['peito', 'costas', 'ombros'] as const) expect(p.volume[g]).toBeGreaterThanOrEqual(p.alvos[g])
    expect(nomes(gerarPlano(contexto({ diasSemana: 4, treinos: 2 })))).toEqual(['Treino A · Superior', 'Treino B · Inferior'])
  })
  it('C11: músculos escolhidos por treino (ex: peito + tríceps / ombros + costas + bíceps / pernas)', () => {
    const musculosPorTreino: ContextoMotor['perfil']['musculosPorTreino'] = [['peito', 'triceps'], ['costas', 'ombros', 'biceps'], ['quadriceps', 'posteriores']]
    for (const fase of ['normal', 'readaptacao'] as const) {
      const ctx = contexto({ diasSemana: 5, treinos: 3, duracaoMin: 90, enfases: ['superior'], limitacoes: ['ombro'], musculosPorTreino }, { fase })
      const p = gerarPlano(ctx)
      expect(nomes(p)).toEqual(['Treino A · Peito e tríceps', 'Treino B · Costas, ombros e bíceps', 'Treino C · Quadríceps e posteriores'])
      p.dias.forEach((d, i) => {
        const grupos = new Set(d.exercicios.filter((e) => e.papel === 'trabalho').map((e) => ex(e.exercicioId).grupo))
        expect(grupos, d.nome).toEqual(new Set(musculosPorTreino![i]))
        expect(d.minutosEstimados).toBeLessThanOrEqual(90)
      })
      expect(p.avisos.filter((a) => a.includes('abaixo do recomendado'))).toEqual([])
    }
    // abdômen só quando escolhido
    const comCore = gerarPlano(contexto({ diasSemana: 3, treinos: 3, musculosPorTreino: [['peito', 'core'], ['costas'], ['quadriceps']] }))
    expect(comCore.dias[0].exercicios.some((e) => ex(e.exercicioId).grupo === 'core')).toBe(true)
    expect(comCore.dias[1].exercicios.some((e) => ex(e.exercicioId).grupo === 'core')).toBe(false)
    // mesmo músculo em treinos seguidos: só avisa
    const seguidos = gerarPlano(contexto({ diasSemana: 3, treinos: 3, musculosPorTreino: [['peito'], ['peito', 'costas'], ['quadriceps']] }))
    expect(seguidos.avisos.some((a) => a.includes('Treino A e Treino B trabalham peito'))).toBe(true)
    // escolha com número de itens diferente dos treinos: ignorada
    expect(nomes(gerarPlano(contexto({ diasSemana: 3, treinos: 3, musculosPorTreino: [['peito']] })))[0]).not.toMatch(/Peito$/)
  })
  it('C13: usa o tempo escolhido (mais exercícios nos músculos do treino)', () => {
    const musculosPorTreino: ContextoMotor['perfil']['musculosPorTreino'] = [['peito', 'triceps'], ['costas', 'ombros', 'biceps'], ['quadriceps', 'posteriores']]
    const p = gerarPlano(contexto({ diasSemana: 5, treinos: 3, duracaoMin: 60, enfases: ['superior'], limitacoes: ['ombro'], musculosPorTreino }))
    const a = p.dias[0].exercicios.filter((e) => e.papel === 'trabalho').map((e) => ex(e.exercicioId).grupo)
    expect(a.filter((g) => g === 'triceps').length).toBeGreaterThanOrEqual(2)
    for (const d of p.dias) expect(d.minutosEstimados, d.nome).toBeGreaterThanOrEqual(50)
    for (const d of p.dias) expect(d.minutosEstimados, d.nome).toBeLessThanOrEqual(60)
    // todo músculo escolhido tem exercício
    expect(new Set(p.dias[1].exercicios.filter((e) => e.papel === 'trabalho').map((e) => ex(e.exercicioId).grupo))).toEqual(new Set(['costas', 'ombros', 'biceps']))
  })
  it('C14: exercício incluído pela pessoa entra no treino, não é cortado e avisa se passar do tempo', () => {
    const base = contexto({ diasSemana: 3, treinos: 3, duracaoMin: 30, musculosPorTreino: [['peito'], ['costas'], ['quadriceps']] })
    const normal = gerarPlano(base)
    const extras = ['elevacao-lateral', 'desenvolvimento-maquina', 'voador-invertido'].filter((id) => exercicioPorId(id))
    expect(extras.length).toBeGreaterThan(0)
    const p = gerarPlano({ ...base, incluidos: extras.map((exercicioId) => ({ variante: normal.dias[0].variante, exercicioId })) })
    const ids = p.dias[0].exercicios.map((e) => e.exercicioId)
    for (const id of extras) expect(ids).toContain(id)
    expect(p.dias[0].exercicios.filter((e) => e.incluido).map((e) => e.exercicioId).sort()).toEqual([...extras].sort())
    if (p.dias[0].minutosEstimados > 30) expect(p.avisos.some((a) => a.includes('exercícios incluídos'))).toBe(true)
  })
  it('C15: exercício excluído sai do treino e nada entra no lugar', () => {
    const base = contexto({ diasSemana: 3, treinos: 3, duracaoMin: 60, musculosPorTreino: [['peito', 'triceps'], ['costas'], ['quadriceps']] })
    const antes = gerarPlano(base)
    const a = antes.dias[0]
    const tira = a.exercicios.filter((e) => e.papel === 'trabalho').slice(0, 2).map((e) => e.exercicioId)
    const depois = gerarPlano({ ...base, excluidos: tira.map((exercicioId) => ({ variante: a.variante, exercicioId })) })
    const idsDepois = depois.dias[0].exercicios.map((e) => e.exercicioId)
    expect(idsDepois).toEqual(a.exercicios.map((e) => e.exercicioId).filter((id) => !tira.includes(id)))
    expect(depois.dias[0].minutosEstimados).toBeLessThan(a.minutosEstimados)
    // outros treinos não mudam
    expect(depois.dias[1]).toEqual(antes.dias[1])
    // tirar todo o tríceps: avisa
    const triceps = a.exercicios.filter((e) => ex(e.exercicioId).grupo === 'triceps').map((e) => e.exercicioId)
    const semTriceps = gerarPlano({ ...base, excluidos: triceps.map((exercicioId) => ({ variante: a.variante, exercicioId })) })
    expect(semTriceps.avisos.some((x) => x.includes('ficou sem exercício de tríceps'))).toBe(true)
  })
  it('C19: avisa quando algum músculo treina só 1 vez por semana e sugere menos treinos', () => {
    const base = { nivel: 'intermediario' as const, enfases: [] as Enfase[] }
    // 3 dias com 3 treinos (PPL): tudo 1×/semana → sugere 2 (Superior/Inferior revezando = 1,5×)
    expect(frequenciaPorMusculo({ ...base, diasSemana: 3, treinos: 3 }).peito).toBe(1)
    expect(avisoFrequencia({ ...base, diasSemana: 3, treinos: 3 })?.sugestao).toBe(2)
    expect(textoAvisoFrequencia({ ...base, diasSemana: 3, treinos: 3 })).toMatch(/Sugestão: 2 treinos/)
    // 5 dias com 3 treinos: ~1,7× → sem aviso; 4 dias com 4 treinos: 2× → sem aviso
    expect(avisoFrequencia({ ...base, diasSemana: 5, treinos: 3 })).toBeNull()
    expect(avisoFrequencia({ ...base, diasSemana: 4, treinos: 4 })).toBeNull()
    // 2 dias: não tem como chegar a 2× sem full body → avisa sem sugestão
    expect(avisoFrequencia({ ...base, diasSemana: 2, treinos: 2 })?.sugestao).toBeNull()
    // a sugestão padrão de treinos para os dias nunca deixa músculo a 1×, exceto com 2 dias
    for (const d of [3, 4, 5, 6] as DiasSemana[]) expect(avisoFrequencia({ ...base, diasSemana: d, treinos: treinosRecomendados(d) }), `${d} dias`).toBeNull()
    // o aviso também vai para o plano
    expect(gerarPlano(contexto({ diasSemana: 3, treinos: 3 })).avisos.some((a) => a.includes('só 1 vez por semana'))).toBe(true)
  })
  it('C13/C22: os treinos usam o tempo escolhido (com 3 séries por exercício)', () => {
    // até 60 min o tempo é sempre usado; acima disso o teto semanal (20 séries por músculo) pode deixar treinos mais curtos
    for (const duracaoMin of [45, 60])
      for (const diasSemana of [3, 4, 5, 6] as DiasSemana[])
        for (const nivel of NIVEIS)
          for (const fase of ['normal', 'readaptacao'] as const) {
            const p = gerarPlano(contexto({ diasSemana, treinos: treinosRecomendados(diasSemana), duracaoMin, nivel }, { fase }))
            // C28: treino curto só quando o volume semanal não deixa encher, e com aviso
            for (const d of p.dias)
              if (d.minutosEstimados < duracaoMin * 0.75) expect(p.avisos.join(' '), `${duracaoMin}min ${diasSemana}d ${nivel} ${fase} ${d.nome}`).toContain(`${d.nome.split(' · ')[0]} ~${d.minutosEstimados} min`)
          }
  })
  it('C28: estimativa usa o descanso de cada exercício (treino real de 15 séries com descanso curto ≈ 37 min)', () => {
    // 2 compostos + 3 isolados × 3 séries, descanso 75 s / 60 s, com aquecimento de ombro
    const itens = [
      ...['puxada-frontal', 'desenvolvimento-halter'].map((id) => ({ ex: ex(id), series: 3, papel: 'trabalho', descansoSeg: 75 })),
      ...['elevacao-lateral', 'rosca-alternada', 'rosca-w'].map((id) => ({ ex: ex(id), series: 3, papel: 'trabalho', descansoSeg: 60 })),
    ]
    expect(itens.every((i) => i.ex)).toBe(true)
    const m = minutosDoDia(itens, true)
    expect(m).toBeGreaterThanOrEqual(34)
    expect(m).toBeLessThanOrEqual(40)
    // descanso maior = treino mais longo
    expect(minutosDoDia(itens.map((i) => ({ ...i, descansoSeg: i.descansoSeg * 2 })), true)).toBeGreaterThan(m + 10)
  })
  it('C28: o tempo que sobra é dividido em rodízio (os dois Pull têm bíceps)', () => {
    for (const fase of ['normal', 'readaptacao'] as const) {
      const p = gerarPlano(contexto({ diasSemana: 6, nivel: 'retornando' }, { fase }))
      for (const d of p.dias.filter((x) => x.nome.endsWith('Pull'))) {
        expect(d.exercicios.some((e) => ex(e.exercicioId).grupo === 'biceps'), `${fase} ${d.nome}`).toBe(true)
      }
    }
  })
  it('C8: só "Superiores" marcado vira ficha com foco em superiores', () => {
    const d = (diasSemana: DiasSemana) => nomes(gerarPlano(contexto({ diasSemana, enfases: ['superior'] })))
    expect(d(2)).toEqual(['Treino A · Peito, ombros e tríceps', 'Treino B · Costas, bíceps e pernas'])
    expect(d(3)).toEqual(['Treino A · Ombros e tríceps', 'Treino B · Peito, costas e bíceps', 'Treino C · Pernas'])
    expect(d(4)).toEqual(['Treino A · Ombros e tríceps', 'Treino B · Peito, costas e bíceps', 'Treino C · Pernas', 'Treino D · Peito, costas e bíceps'])
    expect(d(5)).toEqual([
      'Treino A · Ombros e tríceps',
      'Treino B · Peito, costas e bíceps',
      'Treino C · Pernas',
      'Treino D · Ombros e tríceps',
      'Treino E · Peito, costas e bíceps',
    ])
    expect(d(6)).toHaveLength(6)
    // dia de pernas: 3 exercícios (2 de quadríceps, 1 de posteriores), 3 séries cada
    const p = gerarPlano(contexto({ diasSemana: 5, duracaoMin: 90, enfases: ['superior'] }))
    const pernas = p.dias[2].exercicios.map((e) => ex(e.exercicioId))
    expect(pernas.map((x) => x.grupo).sort()).toEqual(['posteriores', 'quadriceps', 'quadriceps'])
    // dia de ombros e tríceps só tem ombros e tríceps
    expect(new Set(p.dias[0].exercicios.map((e) => ex(e.exercicioId).grupo))).toEqual(new Set(['ombros', 'triceps']))
  })
  it('48 h: treinos seguidos nunca repetem músculo, inclusive abdômen (§6.3, C18)', () => {
    const porcao = (id: string) => {
      const x = ex(id)
      return x.grupo === 'ombros' ? `ombros-${x.categoria}` : x.grupo
    }
    const casos: [DiasSemana, Nivel, Enfase[]][] = DIAS.flatMap((d) => NIVEIS.flatMap((n) => ENFASES.map((e): [DiasSemana, Nivel, Enfase[]] => [d, n, e])))
    for (const [diasSemana, nivel, enfases] of casos) {
      for (const duracaoMin of [30, 60, 90, 120]) {
        const p = gerarPlano(contexto({ diasSemana, nivel, duracaoMin, enfases }))
        p.dias.forEach((d, i) => {
          const prox = p.dias[(i + 1) % p.dias.length]
          if (prox === d) return
          const a = new Set(d.exercicios.filter((e) => e.papel === 'trabalho').map((e) => porcao(e.exercicioId)))
          const b = prox.exercicios.filter((e) => e.papel === 'trabalho').map((e) => porcao(e.exercicioId))
          expect(b.filter((g) => a.has(g)), `${diasSemana}d ${duracaoMin}min ${d.nome}→${prox.nome}`).toEqual([])
        })
      }
    }
  })
})

describe('volume semanal (§6.3, §6.6)', () => {
  it('com tempo suficiente, todos os grupos atingem o alvo', () => {
    for (const diasSemana of [4, 5, 6] as const) {
      for (const enfases of ENFASES) {
        const p = gerarPlano(contexto({ diasSemana, duracaoMin: 90, enfases }))
        if (focoSuperior(enfases)) continue // C8: pernas com volume fixo, conferido no teste da divisão
        for (const [g, alvo] of Object.entries(p.alvos)) expect(p.volume[g as keyof typeof p.volume], `${diasSemana}d ${enfases.join('+')} ${g}`).toBeGreaterThanOrEqual(alvo)
        expect(p.avisos.filter((a) => !a.includes('volume semanal recomendado'))).toEqual([])
      }
    }
  })
  it('grupos grandes começam com 8 séries; grupo com ênfase recebe +30 a 40%', () => {
    const eq = gerarPlano(contexto({ enfases: [] }))
    const gl = gerarPlano(contexto({ enfases: ['gluteos'] }))
    expect(eq.alvos.peito).toBe(8)
    expect(gl.alvos.gluteos / eq.alvos.gluteos).toBeGreaterThanOrEqual(1.3)
    expect(gl.alvos.gluteos / eq.alvos.gluteos).toBeLessThanOrEqual(1.4)
    expect(gl.alvos.peito).toBe(8)
  })
  it('C2: várias ênfases somam grupos; superior + inferior se anulam; glúteos continua valendo', () => {
    expect(gruposDaEnfase([])).toEqual([])
    expect(gruposDaEnfase(['superior', 'gluteos']).sort()).toEqual(['biceps', 'costas', 'gluteos', 'ombros', 'peito', 'triceps'])
    expect(gruposDaEnfase(['superior', 'inferior'])).toEqual([])
    expect(gruposDaEnfase(['superior', 'inferior', 'gluteos'])).toEqual(['gluteos'])
    expect(gruposDaEnfase(['inferior', 'gluteos']).sort()).toEqual(gruposDaEnfase(['inferior']).sort())
    const supGlu = gerarPlano(contexto({ enfases: ['superior', 'gluteos'] }))
    expect(supGlu.alvos.peito).toBe(11)
    expect(supGlu.alvos.gluteos).toBe(11)
    expect(supGlu.alvos.quadriceps).toBe(8)
    expect(gerarPlano(contexto({ enfases: ['superior', 'inferior'] })).alvos).toEqual(gerarPlano(contexto({ enfases: [] })).alvos)
  })
  it('aumento gradual: nível de volume maior gera mais séries, até 16 (A3)', () => {
    const p = gerarPlano(contexto({ duracaoMin: 90 }, { nivelVolume: { peito: 12 } }))
    expect(p.alvos.peito).toBe(12)
    expect(p.volume.peito).toBeGreaterThanOrEqual(12)
  })
  it('feminino: tolerância de volume ~10% maior e descanso ~15% menor (§6.6)', () => {
    const m = gerarPlano(contexto({ sexo: 'masculino' }, { nivelVolume: { peito: 10 } }))
    const f = gerarPlano(contexto({ sexo: 'feminino' }, { nivelVolume: { peito: 10 } }))
    expect(f.alvos.peito).toBe(11)
    expect(m.alvos.peito).toBe(10)
    expect(descansoSegundos(['hipertrofia'], 'composto', 'feminino', 'normal')).toBe(130)
    expect(descansoSegundos(['hipertrofia'], 'composto', 'masculino', 'normal')).toBe(150)
  })
  it('sem tempo para o mínimo, o app avisa em vez de passar da duração (A2)', () => {
    const p = gerarPlano(contexto({ diasSemana: 2, duracaoMin: 30 }))
    expect(p.avisos.some((a) => a.includes('abaixo do recomendado'))).toBe(true)
    expect(p.dias.every((d) => d.minutosEstimados <= 30)).toBe(true)
  })
})

describe('descanso e faixas (§6.5, §6.1)', () => {
  it('descanso padrão por objetivo (meio da faixa)', () => {
    expect(descansoSegundos(['hipertrofia'], 'isolado', 'masculino', 'normal')).toBe(75)
    expect(descansoSegundos(['emagrecimento'], 'composto', 'masculino', 'normal')).toBe(75)
    // C20: nunca abaixo de 60 s (52,5 → 60)
    expect(descansoSegundos(['emagrecimento'], 'isolado', 'masculino', 'normal')).toBe(60)
    expect(descansoSegundos(['emagrecimento'], 'isolado', 'feminino', 'normal')).toBe(60)
    expect(descansoSegundos(['saude'], 'composto', 'masculino', 'normal')).toBe(90)
    expect(descansoSegundos(['saude'], 'isolado', 'masculino', 'normal')).toBe(60)
    expect(descansoSegundos(['hipertrofia'], 'composto', 'masculino', 'readaptacao')).toBe(90)
  })
  it('C1: vários objetivos usam a média dos descansos', () => {
    // hipertrofia 150 s + emagrecimento 75 s → 112,5 → 115 s (arredonda de 5 em 5)
    expect(descansoSegundos(['hipertrofia', 'emagrecimento'], 'composto', 'masculino', 'normal')).toBe(115)
    // (150 + 75 + 90) / 3 = 105
    expect(descansoSegundos(['hipertrofia', 'emagrecimento', 'saude'], 'composto', 'masculino', 'normal')).toBe(105)
    // feminino: 112,5 × 0,85 = 95,6 → 95
    expect(descansoSegundos(['hipertrofia', 'emagrecimento'], 'composto', 'feminino', 'normal')).toBe(95)
    // a ordem não importa
    expect(descansoSegundos(['emagrecimento', 'hipertrofia'], 'isolado', 'masculino', 'normal')).toBe(descansoSegundos(['hipertrofia', 'emagrecimento'], 'isolado', 'masculino', 'normal'))
    // readaptação continua com o descanso de saúde geral
    expect(descansoSegundos(['hipertrofia', 'emagrecimento'], 'composto', 'masculino', 'readaptacao')).toBe(90)
  })
  it('C22: readaptação com 3 séries desde a 1ª semana, faixa 12-15', () => {
    const s0 = gerarPlano(contexto({ nivel: 'iniciante', duracaoMin: 60 }, { fase: 'readaptacao', semanaReadaptacao: 0 }))
    const s1 = gerarPlano(contexto({ nivel: 'iniciante', duracaoMin: 60 }, { fase: 'readaptacao', semanaReadaptacao: 1 }))
    const trabalho = (p: PlanoGerado) => p.dias.flatMap((d) => d.exercicios.filter((e) => e.papel === 'trabalho' && ex(e.exercicioId).tipoCarga !== 'pesoCorpo'))
    expect(trabalho(s0).every((e) => e.series === 3 && e.repsMin === 12 && e.repsMax === 15)).toBe(true)
    expect(trabalho(s1).every((e) => e.series === 3)).toBe(true)
  })
})

describe('limitações e preferências (§6.7, §6.10)', () => {
  it('ombro: prefere halteres/pegada neutra nos empurrar e insere aquecimento específico', () => {
    const p = gerarPlano(contexto({ limitacoes: ['ombro'] }))
    const empurrar = p.dias.flatMap((d) => d.exercicios).filter((e) => e.papel === 'trabalho' && ['empurrar_horizontal', 'empurrar_vertical'].includes(ex(e.exercicioId).padrao))
    expect(empurrar.length).toBeGreaterThan(0)
    expect(empurrar.every((e) => ex(e.exercicioId).amigavelOmbro)).toBe(true)
    const superior = p.dias[0]
    expect(superior.exercicios.slice(0, 2).map((e) => e.exercicioId)).toEqual(['rotacao-externa-elastico', 'face-pull'])
    expect(superior.exercicios[0].series).toBe(2)
    expect(superior.exercicios[0].repsMax).toBe(15)
  })
  it('ombro sem elástico usa rotação externa na polia', () => {
    const ajustes = new Map<string, AjusteExercicio>([['rotacao-externa-elastico', { exercicioId: 'rotacao-externa-elastico', indisponivel: true }]])
    const p = gerarPlano(contexto({ limitacoes: ['ombro'] }, { ajustes }))
    expect(p.dias[0].exercicios[0].exercicioId).toBe('rotacao-externa-cabo')
  })
  it('contraindicação leve: o motor prefere alternativas; se usar, mostra alerta', () => {
    const p = gerarPlano(contexto({ limitacoes: ['joelho'] }))
    expect(p.dias.flatMap((d) => d.exercicios).some((e) => e.exercicioId === 'agachamento-livre')).toBe(false)
    // sem alternativas sem contraindicação para agachar, o agachamento livre entra com alerta
    const semAlternativa = ['leg-press', 'agachamento-halteres', 'agachamento-corpo']
    const ajustes = new Map(semAlternativa.map((id) => [id, { exercicioId: id, indisponivel: true }]))
    const p2 = gerarPlano(contexto({ limitacoes: ['joelho'] }, { ajustes }))
    const agach = p2.dias.flatMap((d) => d.exercicios).find((e) => ex(e.exercicioId).padrao === 'agachar')
    expect(agach?.alerta).toMatch(/joelho/)
  })
  it('equipamentos indisponíveis nunca entram no plano', () => {
    const maquinas = BIBLIOTECA.filter((e) => e.equipamento === 'maquina' || e.equipamento === 'cabo')
    const ajustes = new Map(maquinas.map((e) => [e.id, { exercicioId: e.id, indisponivel: true }]))
    for (const diasSemana of DIAS) {
      const ctx = contexto({ diasSemana }, { ajustes })
      expect(problemas(ctx, gerarPlano(ctx))).toEqual([])
    }
  })
  it('"Trocar no plano" substitui o exercício nos próximos planos', () => {
    const antes = gerarPlano(contexto())
    expect(antes.dias[0].exercicios.some((e) => e.exercicioId === 'supino-reto-barra')).toBe(true)
    const depois = gerarPlano(contexto({}, { trocasNoPlano: { 'supino-reto-barra': 'supino-maquina' } }))
    expect(depois.dias[0].exercicios.some((e) => e.exercicioId === 'supino-maquina')).toBe(true)
    expect(depois.dias.flatMap((d) => d.exercicios).some((e) => e.exercicioId === 'supino-reto-barra')).toBe(false)
  })
})
