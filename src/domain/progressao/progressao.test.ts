import { describe, expect, it } from 'vitest'
import { ajustePorEsforco, aplicarTreino, classificar, estadoInicial, passarParaCargaExtra, prepararParaFase, type ConfigProgressao, type SerieFeita } from './ciclo'
import { arredondarParaBaixo, cargaAbaixo, ehMultiplo, incrementoEfetivo, modoConservador, proximaCargaAcima, descreverCarga } from './carga'
import { aplicarPausa, regraDePausa } from './pausa'
import { configDoExercicio, sugestaoParaTreino } from './sugestao'
import { exercicioPorId } from '../biblioteca'
import type { EstadoProgressao, Exercicio } from '../tipos'

const ex = (id: string) => exercicioPorId(id) as Exercicio
const CFG: ConfigProgressao = { n: 2, incremento: 2, faixa: { min: 8, max: 12 } }
const series = (carga: number | null, ...reps: number[]): SerieFeita[] => reps.map((r) => ({ carga, reps: r }))

function estado(carga: number | null, alvo: number, extra: Partial<EstadoProgressao> = {}): EstadoProgressao {
  return { exercicioId: 'x', modo: 'carga', carga, cargaAnterior: null, alvo, confirmacoes: 0, segurando: false, fase: 'normal', ...extra }
}

/** Repete o mesmo resultado em `vezes` treinos. */
function treinar(e: EstadoProgressao, s: SerieFeita[], vezes = 1, cfg = CFG) {
  let atual = e
  for (let i = 0; i < vezes; i++) atual = aplicarTreino(atual, s, cfg, '2026-01-01').estado
  return atual
}

describe('classificação do treino (§6.8)', () => {
  it('sucesso: bateu o alvo em todas as séries (mais reps também vale)', () => {
    expect(classificar(8, [8, 8, 8])).toBe('sucesso')
    expect(classificar(8, [10, 9, 8])).toBe('sucesso')
  })
  it('manter: errou por 1 rep em só 1 série', () => {
    expect(classificar(10, [10, 10, 9])).toBe('manter')
  })
  it('falha: errou por 2+ reps em alguma série, ou errou em 2+ séries', () => {
    expect(classificar(10, [10, 10, 8])).toBe('falha')
    expect(classificar(10, [9, 9, 10])).toBe('falha')
  })
  it('sem séries feitas não conta', () => {
    expect(classificar(10, [])).toBe('nao_conta')
  })
})

describe('ciclo 8 → 12 (§6.8, critério da seção 11)', () => {
  it('ciclo completo: 8 → 9 → 10 → 11 → 12 → carga nova em 8, com N = 2', () => {
    let e = estado(40, 8)
    const alvos: number[] = []
    for (let alvo = 8; alvo <= 12; alvo++) {
      e = treinar(e, series(e.carga, alvo, alvo, alvo))
      expect(e.alvo, 'uma confirmação ainda não sobe').toBe(alvo)
      e = treinar(e, series(e.carga, alvo, alvo, alvo))
      alvos.push(e.alvo!)
    }
    expect(alvos).toEqual([9, 10, 11, 12, 8])
    expect(e.carga).toBe(42)
    expect(e.cargaAnterior).toBe(40)
  })

  it('N configurável: com N = 1 sobe a cada treino; com N = 3 precisa de 3', () => {
    const e1 = treinar(estado(40, 8), series(40, 8, 8, 8), 1, { ...CFG, n: 1 })
    expect(e1.alvo).toBe(9)
    let e3 = treinar(estado(40, 8), series(40, 8, 8, 8), 2, { ...CFG, n: 3 })
    expect(e3.alvo).toBe(8)
    e3 = treinar(e3, series(40, 8, 8, 8), 1, { ...CFG, n: 3 })
    expect(e3.alvo).toBe(9)
  })

  it('manter não conta, não regride e repete a meta', () => {
    let e = treinar(estado(40, 10), series(40, 10, 10, 10))
    expect(e.confirmacoes).toBe(1)
    e = treinar(e, series(40, 10, 9, 10))
    expect(e.alvo).toBe(10)
    expect(e.confirmacoes).toBe(1)
    e = treinar(e, series(40, 10, 10, 10))
    expect(e.alvo).toBe(11)
  })

  it('regressão de repetição: falhou com repetição nova volta para o alvo anterior, mesma carga', () => {
    const e = treinar(estado(40, 10), series(40, 10, 8, 8))
    expect(e.alvo).toBe(9)
    expect(e.carga).toBe(40)
    expect(e.segurando).toBe(true)
  })

  it('regressão de carga: falhou com carga nova volta para a carga anterior com alvo 12', () => {
    // sobe de 40×12 para 42×8 e falha
    let e = treinar(estado(40, 12), series(40, 12, 12, 12), 2)
    expect([e.carga, e.alvo]).toEqual([42, 8])
    e = treinar(e, series(42, 7, 6, 6))
    expect([e.carga, e.alvo]).toEqual([40, 12])
    expect(e.segurando).toBe(true)
  })

  it('espera de N+1 treinos depois de regredir antes de subir de novo', () => {
    let e = treinar(estado(40, 10), series(40, 10, 7, 7)) // regride para 9
    expect(e.alvo).toBe(9)
    e = treinar(e, series(40, 9, 9, 9), 2)
    expect(e.alvo, 'com N = 2, ainda segura').toBe(9)
    e = treinar(e, series(40, 9, 9, 9))
    expect(e.alvo, 'na 3ª confirmação (N+1) sobe').toBe(10)
    expect(e.segurando).toBe(false)
    // depois de subir, volta a precisar só de N
    e = treinar(e, series(40, 10, 10, 10), 2)
    expect(e.alvo).toBe(11)
  })

  it('falhar de novo enquanto segura desce mais um degrau (A6)', () => {
    let e = treinar(estado(40, 9), series(40, 9, 6, 6))
    expect(e.alvo).toBe(8)
    e = treinar(e, series(40, 8, 5, 5))
    // em 8 sem carga anterior: desce um incremento e mantém o alvo
    expect([e.carga, e.alvo]).toEqual([38, 8])
  })

  it('falha logo na primeira carga (sem aumento antes): carga − incremento, alvo 8 (A6)', () => {
    let e = treinar(estadoInicial('x', 'normal', false), series(30, 8, 8, 8))
    expect([e.carga, e.alvo]).toEqual([30, 8])
    e = treinar(e, series(30, 6, 5, 5))
    expect([e.carga, e.alvo]).toEqual([28, 8])
  })

  it('primeira vez: a carga usada vira a base do ciclo (A4/§6.10)', () => {
    const r = aplicarTreino(estadoInicial('x', 'normal', false), series(25, 9, 8, 8), CFG, '2026-01-01')
    expect(r.estado.carga).toBe(25)
    expect(r.classificacao).toBe('sucesso')
    expect(r.eventos[0].tipo).toBe('inicio')
  })

  it('carga maior que a sugerida vira carga nova com alvo 8 (A5)', () => {
    const r = aplicarTreino(estado(40, 11), series(44, 9, 8, 8), CFG, '2026-01-01')
    expect([r.estado.carga, r.estado.alvo, r.estado.cargaAnterior]).toEqual([44, 8, 40])
    expect(r.eventos.map((e) => e.tipo)).toEqual(['carga_nova'])
    expect(r.estado.confirmacoes).toBe(1)
  })

  it('carga menor que a sugerida não conta (A5)', () => {
    const antes = estado(40, 10, { confirmacoes: 1 })
    const r = aplicarTreino(antes, series(36, 12, 12, 12), CFG, '2026-01-01')
    expect(r.classificacao).toBe('nao_conta')
    expect(r.estado).toEqual(antes)
  })

  it('cargas diferentes entre séries: vale a menor (A5)', () => {
    const r = aplicarTreino(estado(40, 10), [{ carga: 42, reps: 10 }, { carga: 40, reps: 10 }, { carga: 40, reps: 10 }], CFG, '2026-01-01')
    expect(r.estado.carga).toBe(40)
    expect(r.classificacao).toBe('sucesso')
  })

  it('readaptação usa a faixa 12-15 (§6.1)', () => {
    const cfg = { ...CFG, faixa: { min: 12, max: 15 } }
    let e = estado(20, 15, { fase: 'readaptacao' })
    e = treinar(e, series(20, 15, 15), 2, cfg)
    expect([e.carga, e.alvo]).toEqual([22, 12])
  })

  it('ao sair da readaptação: entra no ciclo em 8 com carga a confirmar e referência (§6.8)', () => {
    const e = prepararParaFase(estado(20, 14, { fase: 'readaptacao' }), 'normal')
    expect([e.carga, e.alvo, e.cargaReferencia, e.fase]).toEqual([null, 8, 20, 'normal'])
  })
})

describe('esforço percebido (C27)', () => {
  const com = (e: EstadoProgressao, s: SerieFeita[], esforco: 1 | 2 | 3 | 4 | 5 | null) => aplicarTreino(e, s, CFG, '2026-01-01', esforco).estado
  it('tabela: falha sempre desce; 5 desce; 1 com sucesso sobe; 4 não conta; 2/3/sem resposta seguem a regra normal', () => {
    expect(ajustePorEsforco('falha', 1)).toBe('descer')
    expect(ajustePorEsforco('sucesso', 5)).toBe('descer')
    expect(ajustePorEsforco('manter', 5)).toBe('descer')
    expect(ajustePorEsforco('sucesso', 1)).toBe('subir')
    expect(ajustePorEsforco('manter', 1)).toBe('nada')
    expect(ajustePorEsforco('sucesso', 4)).toBe('nada')
    expect(ajustePorEsforco('sucesso', 3)).toBe('contar')
    expect(ajustePorEsforco('sucesso', 2)).toBe('contar')
    expect(ajustePorEsforco('sucesso', null)).toBe('contar')
    expect(ajustePorEsforco('sucesso', undefined)).toBe('contar')
  })
  it('1 (super tranquilo) + bateu o alvo: sobe já no próximo treino, sem esperar N', () => {
    expect(com(estado(40, 9), series(40, 9, 9, 9), 1)).toMatchObject({ carga: 40, alvo: 10, confirmacoes: 0 })
    // no topo da faixa: carga nova com alvo 8
    expect(com(estado(40, 12), series(40, 12, 12, 12), 1)).toMatchObject({ carga: 42, alvo: 8, cargaAnterior: 40 })
  })
  it('4 (difícil) + bateu o alvo: repete o mesmo degrau, sem contar confirmação', () => {
    expect(com(estado(40, 9, { confirmacoes: 1 }), series(40, 9, 9, 9), 4)).toMatchObject({ carga: 40, alvo: 9, confirmacoes: 1 })
  })
  it('5 (muito difícil): desce um degrau mesmo batendo o alvo', () => {
    expect(com(estado(40, 10), series(40, 10, 10, 10), 5)).toMatchObject({ carga: 40, alvo: 9, segurando: true })
    expect(com(estado(42, 8, { cargaAnterior: 40 }), series(42, 8, 8, 8), 5)).toMatchObject({ carga: 40, alvo: 12 })
  })
  it('3 (na medida) segue a regra de N confirmações', () => {
    const e1 = com(estado(40, 9), series(40, 9, 9, 9), 3)
    expect(e1).toMatchObject({ alvo: 9, confirmacoes: 1 })
    expect(com(e1, series(40, 9, 9, 9), 3)).toMatchObject({ alvo: 10, confirmacoes: 0 })
  })
  it('peso do corpo: 1 sobe +1 rep na hora, 5 desce 1 rep', () => {
    const pc = (alvo: number) => ({ ...estado(null, alvo), modo: 'reps' as const })
    expect(com(pc(10), series(null, 10, 10, 10), 1)).toMatchObject({ alvo: 11 })
    expect(com(pc(10), series(null, 10, 10, 10), 5)).toMatchObject({ alvo: 9, segurando: true })
  })
})

describe('peso do corpo (§6.13)', () => {
  const cfg: ConfigProgressao = { ...CFG, teto: 12 }
  it('primeiro treino sem alvo: o que fizer em todas as séries vira o alvo (A8)', () => {
    const r = aplicarTreino(estadoInicial('barra-fixa', 'normal', true), series(null, 7, 6, 6), cfg, '2026-01-01')
    expect(r.estado.alvo).toBe(6)
  })
  it('sobe +1 rep a cada N treinos até o teto e então oferece carga extra ou variação', () => {
    let e: EstadoProgressao = { ...estadoInicial('x', 'normal', true), alvo: 11 }
    e = treinar(e, series(null, 11, 11, 11), 2, cfg)
    expect(e.alvo).toBe(12)
    expect(e.noTeto).toBeFalsy()
    e = treinar(e, series(null, 12, 12, 12), 2, cfg)
    expect(e.alvo).toBe(12)
    expect(e.noTeto).toBe(true)
  })
  it('flexão e abdominais têm teto 20', () => {
    expect(ex('flexao').tetoReps).toBe(20)
    expect(ex('abdominal').tetoReps).toBe(20)
    expect(ex('barra-fixa').tetoReps).toBe(12)
  })
  it('menos que o mínimo (5): sugere versão assistida', () => {
    const e = treinar({ ...estadoInicial('x', 'normal', true), alvo: 5 }, series(null, 4, 3, 3), 1, cfg)
    expect(e.sugerirAssistida).toBe(true)
    expect(ex('barra-fixa').versaoAssistida).toContain('barra-graviton')
  })
  it('regressão igual à 6.8: falhou volta um degrau e segura N+1', () => {
    let e = treinar({ ...estadoInicial('x', 'normal', true), alvo: 10 }, series(null, 10, 7, 7), 1, cfg)
    expect(e.alvo).toBe(9)
    e = treinar(e, series(null, 9, 9, 9), 2, cfg)
    expect(e.alvo).toBe(9)
    e = treinar(e, series(null, 9, 9, 9), 1, cfg)
    expect(e.alvo).toBe(10)
  })
  it('adicionar carga: entra no ciclo 6.8 em 8 reps; falhar na primeira carga volta ao peso do corpo com 12', () => {
    let e = passarParaCargaExtra({ ...estadoInicial('x', 'normal', true), alvo: 12, noTeto: true })
    expect([e.modo, e.alvo, e.carga]).toEqual(['carga', 8, null])
    e = treinar(e, series(5, 8, 8, 8), 1, cfg)
    expect(e.carga).toBe(5)
    e = treinar(e, series(5, 6, 5, 5), 1, cfg)
    expect([e.carga, e.alvo]).toEqual([0, 12])
  })
  it('máquina assistida (graviton): subir de nível é diminuir a ajuda', () => {
    const cfgA: ConfigProgressao = { ...CFG, assistido: true, incremento: 5 }
    let e = estado(30, 12)
    e = treinar(e, series(30, 12, 12, 12), 2, cfgA)
    expect([e.carga, e.alvo]).toEqual([25, 8])
    // usar mais ajuda que a sugerida não conta
    expect(aplicarTreino(e, series(35, 12, 12, 12), cfgA, 'd').classificacao).toBe('nao_conta')
  })
})

describe('carga e incremento (§6.14)', () => {
  it('nenhuma carga sugerida fica fora do incremento configurado (critério da seção 11)', () => {
    const incrementos = [0.5, 1, 1.25, 2, 2.5, 4, 5, 10]
    for (const inc of incrementos) {
      for (const base of [7, 13.3, 21, 40, 42.5, 57.1, 101]) {
        expect(ehMultiplo(arredondarParaBaixo(base, inc), inc), `${base}/${inc}`).toBe(true)
        expect(ehMultiplo(proximaCargaAcima(base, inc), inc)).toBe(true)
        expect(ehMultiplo(cargaAbaixo(base, inc), inc)).toBe(true)
        expect(proximaCargaAcima(base, inc)).toBeGreaterThan(base)
        expect(cargaAbaixo(base, inc)).toBeLessThan(base)
      }
    }
  })
  it('sugestão arredonda para o incremento atual (ex: máquina de 5 em 5)', () => {
    const exercicio = ex('leg-press')
    const cfg = configDoExercicio(exercicio, { limitacoes: [], nConfirmacoes: 2 }, { exercicioId: 'leg-press', incrementoCarga: 5 }, 'normal')
    const s = sugestaoParaTreino(estado(82, 8), exercicio, cfg, 'normal')
    expect(s.carga).toBe(80)
    // e a subida de carga também respeita o incremento
    expect(proximaCargaAcima(82, 5)).toBe(85)
  })
  it('sem histórico: campo vazio com "comece leve"', () => {
    const exercicio = ex('supino-reto-halter')
    const s = sugestaoParaTreino(undefined, exercicio, configDoExercicio(exercicio, { limitacoes: [], nConfirmacoes: 2 }, undefined, 'normal'), 'normal')
    expect(s.carga).toBeNull()
    expect(s.comeceLeve).toBe(true)
    expect(s.alvo).toBe(8)
  })
  it('incremento padrão: 2 kg superiores / 4 kg inferiores (máquina), 2 kg por halter, 1/2 kg por lado (A9)', () => {
    expect(ex('supino-maquina').incrementoCarga).toBe(2)
    expect(ex('leg-press').incrementoCarga).toBe(4)
    expect(ex('supino-reto-halter').incrementoCarga).toBe(2)
    expect(ex('supino-reto-barra').incrementoCarga).toBe(1)
    expect(ex('agachamento-livre').incrementoCarga).toBe(2)
  })
  it('ombro + empurrar: incremento menor (metade) e N+1 (§6.7); o ajuste do usuário sempre vale', () => {
    const supino = ex('supino-reto-halter')
    expect(modoConservador(supino, ['ombro'])).toBe(true)
    expect(modoConservador(supino, [])).toBe(false)
    expect(modoConservador(ex('puxada-frontal'), ['ombro'])).toBe(false)
    const cfg = configDoExercicio(supino, { limitacoes: ['ombro'], nConfirmacoes: 2 }, undefined, 'normal')
    expect(cfg.incremento).toBe(1)
    expect(cfg.n).toBe(3)
    expect(incrementoEfetivo(supino, { exercicioId: supino.id, incrementoCarga: 2 }, true)).toBe(2)
    // desativar a limitação volta ao incremento e N padrão
    const normal = configDoExercicio(supino, { limitacoes: [], nConfirmacoes: 2 }, undefined, 'normal')
    expect([normal.incremento, normal.n]).toEqual([2, 2])
  })
  it('modo conservador: depois de regredir segura N+2 (A6)', () => {
    const cfg: ConfigProgressao = { ...CFG, n: 3 }
    let e = treinar(estado(20, 10), series(20, 10, 7, 7), 1, cfg)
    e = treinar(e, series(20, 9, 9, 9), 3, cfg)
    expect(e.alvo).toBe(9)
    e = treinar(e, series(20, 9, 9, 9), 1, cfg)
    expect(e.alvo).toBe(10)
  })
  it('contraindicação leve também é modo conservador', () => {
    expect(modoConservador(ex('agachamento-livre'), ['joelho'])).toBe(true)
  })
  it('descrição da carga por tipo', () => {
    expect(descreverCarga(ex('supino-reto-barra'), 15)).toBe('15 kg por lado (total 50 kg)')
    expect(descreverCarga(ex('supino-reto-halter'), 12)).toBe('12 kg por halter')
    expect(descreverCarga(ex('barra-fixa'), 0)).toBe('peso do corpo')
  })
})

describe('retorno após pausa (§6.12)', () => {
  it('menos de 10 dias: nada muda', () => {
    expect(regraDePausa(9)).toBeNull()
  })
  it('10 a 20 dias: cargas −10%, alvo mantido', () => {
    const r = regraDePausa(10)!
    expect([r.fator, r.alvoOito]).toEqual([0.9, false])
    expect(regraDePausa(20)!.fator).toBe(0.9)
    const e = aplicarPausa(estado(50, 11, { confirmacoes: 1, cargaAnterior: 48 }), r, 2, 8)
    expect([e.carga, e.alvo, e.confirmacoes, e.cargaAnterior]).toEqual([44, 11, 0, null])
  })
  it('mais de 20 dias: cargas −20% e alvo 8', () => {
    const r = regraDePausa(21)!
    expect([r.fator, r.alvoOito, r.perguntarReadaptacao]).toEqual([0.8, true, false])
    const e = aplicarPausa(estado(50, 11), r, 2, 8)
    expect([e.carga, e.alvo]).toEqual([40, 8])
  })
  it('mais de 60 dias: pergunta se quer refazer a readaptação', () => {
    expect(regraDePausa(60)!.perguntarReadaptacao).toBe(false)
    expect(regraDePausa(61)!.perguntarReadaptacao).toBe(true)
  })
  it('carga reduzida sempre no incremento (arredonda para baixo)', () => {
    const e = aplicarPausa(estado(43, 10), regraDePausa(12)!, 5, 8)
    expect(e.carga).toBe(35) // 38,7 → 35
  })
  it('depois da pausa o ciclo segue normal a partir da carga reduzida', () => {
    let e = aplicarPausa(estado(50, 12), regraDePausa(25)!, 2, 8)
    expect([e.carga, e.alvo]).toEqual([40, 8])
    e = treinar(e, series(40, 8, 8, 8), 2)
    expect([e.carga, e.alvo]).toEqual([40, 9])
  })
})
