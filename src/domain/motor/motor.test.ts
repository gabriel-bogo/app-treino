import { describe, expect, it } from 'vitest'
import { gerarPlano, minutosDoDia, type ContextoMotor, type PlanoGerado } from './gerar'
import { descansoSegundos, GRUPOS_DO_DIA } from './regras'
import { BIBLIOTECA, contraindicacaoPara, exercicioPorId } from '../biblioteca'
import type { AjusteExercicio, DiasSemana, DuracaoMin, Enfase, Exercicio, Limitacao, Nivel, Sexo } from '../tipos'

// Critério da seção 11: "Gera plano coerente para todas as combinações de dias
// (2-6) e duração (30-90)". E: "Com limitação ombro, nenhum exercício da lista
// proibida aparece em plano".

const PROIBIDOS_OMBRO = ['desenvolvimento-nuca', 'puxada-nuca', 'remada-alta', 'mergulho-paralela', 'mergulho-banco', 'mergulho-maquina']

function contexto(perfil: Partial<ContextoMotor['perfil']> = {}, extra: Partial<ContextoMotor> = {}): ContextoMotor {
  return {
    perfil: { sexo: 'masculino', nivel: 'intermediario', objetivo: 'hipertrofia', enfase: 'equilibrado', diasSemana: 4, duracaoMin: 60, limitacoes: [], ...perfil },
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
  const esperadoDias = fase === 'readaptacao' ? Math.min(perfil.diasSemana, 4) : perfil.diasSemana
  if (plano.dias.length !== esperadoDias) p.push(`dias: ${plano.dias.length} ≠ ${esperadoDias}`)
  for (const dia of plano.dias) {
    const trabalho = dia.exercicios.filter((e) => e.papel === 'trabalho')
    if (!trabalho.length) p.push(`${dia.nome}: sem exercícios`)
    const ids = dia.exercicios.map((e) => e.exercicioId)
    if (new Set(ids).size !== ids.length) p.push(`${dia.nome}: exercício repetido`)
    const temAquecOmbro = dia.exercicios.some((e) => e.papel === 'aquecimento_ombro')
    const minutos = minutosDoDia(dia.exercicios.map((e) => ({ ex: ex(e.exercicioId), series: e.series, papel: e.papel })), temAquecOmbro)
    if (minutos > perfil.duracaoMin) p.push(`${dia.nome}: ${minutos} min > ${perfil.duracaoMin}`)
    if (minutos !== dia.minutosEstimados) p.push(`${dia.nome}: estimativa inconsistente`)
    const temEmpurrar = trabalho.some((e) => ['empurrar_horizontal', 'empurrar_vertical'].includes(ex(e.exercicioId).padrao))
    if (perfil.limitacoes.includes('ombro') && temEmpurrar && !temAquecOmbro) p.push(`${dia.nome}: falta aquecimento de ombro`)
    if (temAquecOmbro && !(perfil.limitacoes.includes('ombro') && temEmpurrar)) p.push(`${dia.nome}: aquecimento de ombro sem necessidade`)
    let camadaAnterior = -2
    for (const e of dia.exercicios) {
      const x = ex(e.exercicioId)
      if (contraindicacaoPara(x, perfil.limitacoes) === 'forte') p.push(`${dia.nome}: ${x.id} contraindicado`)
      if (perfil.limitacoes.includes('ombro') && PROIBIDOS_OMBRO.includes(x.id)) p.push(`${dia.nome}: ${x.id} proibido p/ ombro`)
      if (ctx.ajustes.get(x.id)?.indisponivel || ctx.ajustes.get(x.id)?.evitar) p.push(`${dia.nome}: ${x.id} marcado`)
      if (e.papel === 'aquecimento_ombro') {
        if (camadaAnterior > -1) p.push(`${dia.nome}: aquecimento fora do início`)
        continue
      }
      if (x.soAquecimento) p.push(`${dia.nome}: ${x.id} é só aquecimento`)
      if (perfil.nivel === 'iniciante' && x.nivel !== 'iniciante') p.push(`${dia.nome}: ${x.id} nível ${x.nivel}`)
      if (x.nivel === 'avancado') p.push(`${dia.nome}: ${x.id} avançado`)
      if (fase === 'readaptacao' ? ![2, 3].includes(e.series) : e.series < 2 || e.series > 4) p.push(`${dia.nome}: ${x.id} com ${e.series} séries`)
      if (x.tipoCarga !== 'pesoCorpo') {
        const faixa = fase === 'readaptacao' ? [12, 15] : [8, 12]
        if (e.repsMin !== faixa[0] || e.repsMax !== faixa[1]) p.push(`${dia.nome}: ${x.id} faixa ${e.repsMin}-${e.repsMax}`)
      }
      if (e.descansoSeg !== descansoSegundos(perfil.objetivo, x.tipo, perfil.sexo, fase)) p.push(`${dia.nome}: ${x.id} descanso ${e.descansoSeg}`)
      if (x.grupo !== 'core' && !GRUPOS_DO_DIA[dia.tipo].includes(x.grupo)) p.push(`${dia.nome}: ${x.id} fora do agrupamento`)
      if (dia.tipo === 'push' && x.categoria === 'pull') p.push(`${dia.nome}: ${x.id} é pull`)
      if (dia.tipo === 'pull' && x.categoria === 'push') p.push(`${dia.nome}: ${x.id} é push`)
      // §6.4: compostos grandes > compostos menores > isolados > core
      const camada = x.grupo === 'core' ? 3 : x.tipo === 'isolado' ? 2 : ['quadriceps', 'posteriores', 'gluteos', 'peito', 'costas'].includes(x.grupo) ? 0 : 1
      if (camada < camadaAnterior) p.push(`${dia.nome}: ordem errada em ${x.id}`)
      camadaAnterior = camada
      if (contraindicacaoPara(x, perfil.limitacoes) === 'leve' && !e.alerta) p.push(`${dia.nome}: ${x.id} sem alerta`)
    }
  }
  return p
}

const DIAS: DiasSemana[] = [2, 3, 4, 5, 6]
const DURACOES: DuracaoMin[] = [30, 45, 60, 75, 90]
const NIVEIS: Nivel[] = ['iniciante', 'retornando', 'intermediario']
const ENFASES: Enfase[] = ['equilibrado', 'inferior', 'superior', 'gluteos']
const SEXOS: Sexo[] = ['feminino', 'masculino']
const LIMITACOES: Limitacao[][] = [[], ['ombro'], ['joelho', 'lombar', 'ombro', 'punho']]

describe('motor: todas as combinações (§11)', () => {
  it('gera plano coerente para dias 2-6 × duração 30-90 × nível × ênfase × sexo × limitações × fase', () => {
    const falhas: string[] = []
    let total = 0
    for (const diasSemana of DIAS)
      for (const duracaoMin of DURACOES)
        for (const nivel of NIVEIS)
          for (const enfase of ENFASES)
            for (const sexo of SEXOS)
              for (const limitacoes of LIMITACOES)
                for (const [fase, semana] of [['normal', 0], ['readaptacao', 0], ['readaptacao', 2]] as const) {
                  const ctx = contexto({ diasSemana, duracaoMin, nivel, enfase, sexo, limitacoes }, { fase, semanaReadaptacao: semana })
                  const plano = gerarPlano(ctx)
                  total++
                  for (const pr of problemas(ctx, plano)) falhas.push(`[${diasSemana}d ${duracaoMin}min ${nivel} ${enfase} ${sexo} ${limitacoes.join('+') || 'sem lim'} ${fase}${semana}] ${pr}`)
                }
    expect(total).toBe(5 * 5 * 3 * 4 * 2 * 3 * 3)
    expect(falhas.slice(0, 20)).toEqual([])
  })

  it('é determinístico (mesmas entradas, mesmo plano)', () => {
    const ctx = contexto({ diasSemana: 5, duracaoMin: 75, enfase: 'gluteos', sexo: 'feminino', limitacoes: ['ombro'] })
    expect(gerarPlano(ctx)).toEqual(gerarPlano(ctx))
  })
})

describe('divisão (§6.2)', () => {
  const nomes = (p: PlanoGerado) => p.dias.map((d) => d.nome)
  it('2 dias: full body A/B', () => {
    expect(nomes(gerarPlano(contexto({ diasSemana: 2 })))).toEqual(['Full body A', 'Full body B'])
  })
  it('3 dias: full body A/B/C para iniciante e retornando; PPL para intermediário', () => {
    expect(nomes(gerarPlano(contexto({ diasSemana: 3, nivel: 'iniciante' })))).toEqual(['Full body A', 'Full body B', 'Full body C'])
    expect(nomes(gerarPlano(contexto({ diasSemana: 3, nivel: 'retornando' })))).toEqual(['Full body A', 'Full body B', 'Full body C'])
    expect(nomes(gerarPlano(contexto({ diasSemana: 3, nivel: 'intermediario' })))).toEqual(['Push', 'Pull', 'Legs'])
  })
  it('4 dias: Superior/Inferior; com ênfase inferior ou glúteos vira Inferior/Superior/Inferior/Full body', () => {
    expect(nomes(gerarPlano(contexto({ diasSemana: 4 })))).toEqual(['Superior A', 'Inferior A', 'Superior B', 'Inferior B'])
    for (const enfase of ['inferior', 'gluteos'] as const) {
      expect(nomes(gerarPlano(contexto({ diasSemana: 4, enfase })))).toEqual(['Inferior A', 'Superior', 'Inferior B', 'Full body A'])
    }
  })
  it('5 dias: Superior/Inferior/Push/Pull/Legs; 6 dias: PPL × 2', () => {
    expect(nomes(gerarPlano(contexto({ diasSemana: 5 })))).toEqual(['Superior', 'Inferior', 'Push', 'Pull', 'Legs'])
    expect(nomes(gerarPlano(contexto({ diasSemana: 6 })))).toEqual(['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'])
  })
  it('readaptação: full body, no máximo 4 dias (§6.1)', () => {
    for (const diasSemana of DIAS) {
      const p = gerarPlano(contexto({ diasSemana, nivel: 'iniciante' }, { fase: 'readaptacao' }))
      expect(p.dias.length).toBe(Math.min(diasSemana, 4))
      expect(p.dias.every((d) => d.tipo === 'fullbody')).toBe(true)
    }
  })
  it('48 h entre o mesmo grupo nas divisões que separam grupos (§6.3)', () => {
    const porcao = (id: string) => {
      const x = ex(id)
      return x.grupo === 'ombros' ? `ombros-${x.categoria}` : x.grupo
    }
    const casos: [DiasSemana, Nivel][] = [[3, 'intermediario'], [4, 'intermediario'], [5, 'intermediario'], [6, 'intermediario']]
    for (const [diasSemana, nivel] of casos) {
      for (const duracaoMin of DURACOES) {
        const p = gerarPlano(contexto({ diasSemana, nivel, duracaoMin }))
        p.dias.forEach((d, i) => {
          const prox = p.dias[(i + 1) % p.dias.length]
          const a = new Set(d.exercicios.filter((e) => e.papel === 'trabalho' && ex(e.exercicioId).grupo !== 'core').map((e) => porcao(e.exercicioId)))
          const b = prox.exercicios.filter((e) => e.papel === 'trabalho' && ex(e.exercicioId).grupo !== 'core').map((e) => porcao(e.exercicioId))
          expect(b.filter((g) => a.has(g)), `${diasSemana}d ${duracaoMin}min ${d.nome}→${prox.nome}`).toEqual([])
        })
      }
    }
  })
})

describe('volume semanal (§6.3, §6.6)', () => {
  it('com tempo suficiente, todos os grupos atingem o alvo', () => {
    for (const diasSemana of [4, 5, 6] as const) {
      for (const enfase of ENFASES) {
        const p = gerarPlano(contexto({ diasSemana, duracaoMin: 90, enfase }))
        for (const [g, alvo] of Object.entries(p.alvos)) expect(p.volume[g as keyof typeof p.volume], `${diasSemana}d ${enfase} ${g}`).toBeGreaterThanOrEqual(alvo)
        expect(p.avisos).toEqual([])
      }
    }
  })
  it('grupos grandes começam com 8 séries; grupo com ênfase recebe +30 a 40%', () => {
    const eq = gerarPlano(contexto({ enfase: 'equilibrado' }))
    const gl = gerarPlano(contexto({ enfase: 'gluteos' }))
    expect(eq.alvos.peito).toBe(8)
    expect(gl.alvos.gluteos / eq.alvos.gluteos).toBeGreaterThanOrEqual(1.3)
    expect(gl.alvos.gluteos / eq.alvos.gluteos).toBeLessThanOrEqual(1.4)
    expect(gl.alvos.peito).toBe(8)
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
    expect(descansoSegundos('hipertrofia', 'composto', 'feminino', 'normal')).toBe(130)
    expect(descansoSegundos('hipertrofia', 'composto', 'masculino', 'normal')).toBe(150)
  })
  it('sem tempo para o mínimo, o app avisa em vez de passar da duração (A2)', () => {
    const p = gerarPlano(contexto({ diasSemana: 2, duracaoMin: 30 }))
    expect(p.avisos.some((a) => a.includes('abaixo do recomendado'))).toBe(true)
    expect(p.dias.every((d) => d.minutosEstimados <= 30)).toBe(true)
  })
})

describe('descanso e faixas (§6.5, §6.1)', () => {
  it('descanso padrão por objetivo (meio da faixa)', () => {
    expect(descansoSegundos('hipertrofia', 'isolado', 'masculino', 'normal')).toBe(75)
    expect(descansoSegundos('emagrecimento', 'composto', 'masculino', 'normal')).toBe(75)
    expect(descansoSegundos('emagrecimento', 'isolado', 'masculino', 'normal')).toBe(55)
    expect(descansoSegundos('saude', 'composto', 'masculino', 'normal')).toBe(90)
    expect(descansoSegundos('saude', 'isolado', 'masculino', 'normal')).toBe(60)
    expect(descansoSegundos('hipertrofia', 'composto', 'masculino', 'readaptacao')).toBe(90)
  })
  it('readaptação: 2 séries na primeira semana e 3 depois, faixa 12-15', () => {
    const s0 = gerarPlano(contexto({ nivel: 'iniciante', duracaoMin: 60 }, { fase: 'readaptacao', semanaReadaptacao: 0 }))
    const s1 = gerarPlano(contexto({ nivel: 'iniciante', duracaoMin: 60 }, { fase: 'readaptacao', semanaReadaptacao: 1 }))
    const trabalho = (p: PlanoGerado) => p.dias.flatMap((d) => d.exercicios.filter((e) => e.papel === 'trabalho' && ex(e.exercicioId).tipoCarga !== 'pesoCorpo'))
    expect(trabalho(s0).every((e) => e.series === 2 && e.repsMin === 12 && e.repsMax === 15)).toBe(true)
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
