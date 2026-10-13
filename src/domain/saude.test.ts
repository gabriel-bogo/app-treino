import { describe, expect, it } from 'vitest'
import {
  avaliarPeso,
  calcularIMC,
  classificarCintura,
  classificarIMC,
  distanciaFaixa,
  emagrecimentoDesaconselhado,
  exigeLiberacaoMedica,
  faixaPesoAdequado,
  mediaMovel7,
  mensagensClassificacao,
  alertasObjetivo,
  objetivosRecomendados,
  pesoTendencia,
  registrosDePeso,
  resumoVariacao,
  sugerirCintura,
} from './saude'

// Todos os dados abaixo são fictícios.

describe('IMC (§10)', () => {
  it('calcula peso / altura²', () => {
    expect(calcularIMC(70, 175)).toBe(22.9)
    expect(calcularIMC(100, 170)).toBe(34.6)
  })

  it('faixas da OMS para adultos de 18 a 59 anos', () => {
    expect(classificarIMC(18.4, 30)).toBe('abaixo')
    expect(classificarIMC(18.5, 30)).toBe('adequado')
    expect(classificarIMC(24.9, 30)).toBe('adequado')
    expect(classificarIMC(25, 30)).toBe('sobrepeso')
    expect(classificarIMC(29.9, 30)).toBe('sobrepeso')
    expect(classificarIMC(30, 30)).toBe('obesidade1')
    expect(classificarIMC(34.9, 30)).toBe('obesidade1')
    expect(classificarIMC(35, 30)).toBe('obesidade2')
    expect(classificarIMC(39.9, 30)).toBe('obesidade2')
    expect(classificarIMC(40, 30)).toBe('obesidade3')
    expect(classificarIMC(24, 18)).toBe('adequado')
    expect(classificarIMC(24, 59)).toBe('adequado')
  })

  it('60 anos ou mais: baixo peso < 22, adequado 22 a 27, sobrepeso > 27', () => {
    expect(classificarIMC(21.9, 60)).toBe('baixo_peso_idoso')
    expect(classificarIMC(22, 60)).toBe('adequado_idoso')
    expect(classificarIMC(27, 70)).toBe('adequado_idoso')
    expect(classificarIMC(27.1, 70)).toBe('sobrepeso_idoso')
  })

  it('menores de 18 anos não são classificados', () => {
    expect(classificarIMC(30, 17)).toBe('nao_classificado')
    expect(faixaPesoAdequado(170, 17)).toBeNull()
  })

  it('faixa de peso adequado para 1,78 m: 58,6 a 78,9 kg', () => {
    expect(faixaPesoAdequado(178, 30)).toEqual({ min: 58.6, max: 78.9 })
  })

  it('faixa de peso adequado para idosos usa 22 a 27', () => {
    expect(faixaPesoAdequado(170, 65)).toEqual({ min: 63.6, max: 78 })
  })

  it('quanto falta para entrar na faixa', () => {
    const f = { min: 58.6, max: 78.9 }
    expect(distanciaFaixa(85, f)).toBe(-6.1)
    expect(distanciaFaixa(55, f)).toBe(3.6)
    expect(distanciaFaixa(70, f)).toBe(0)
  })
})

describe('cintura (OMS)', () => {
  it('homem: 94 aumentado, 102 muito aumentado', () => {
    expect(classificarCintura(93.9, 'masculino')).toBe('normal')
    expect(classificarCintura(94, 'masculino')).toBe('aumentado')
    expect(classificarCintura(102, 'masculino')).toBe('muito_aumentado')
  })
  it('mulher: 80 aumentado, 88 muito aumentado', () => {
    expect(classificarCintura(79.9, 'feminino')).toBe('normal')
    expect(classificarCintura(80, 'feminino')).toBe('aumentado')
    expect(classificarCintura(88, 'feminino')).toBe('muito_aumentado')
  })
  it('sobrepeso no IMC com cintura sem risco: provável massa muscular', () => {
    const av = avaliarPeso({ pesoKg: 85, alturaCm: 178, nascimento: '1990-01-01', sexo: 'masculino', hoje: '2026-06-01', cinturaCm: 84 })
    expect(av.classe).toBe('sobrepeso')
    expect(av.provavelMassaMuscular).toBe(true)
    const av2 = avaliarPeso({ pesoKg: 85, alturaCm: 178, nascimento: '1990-01-01', sexo: 'masculino', hoje: '2026-06-01', cinturaCm: 96 })
    expect(av2.provavelMassaMuscular).toBe(false)
  })
})

describe('média móvel de 7 dias (§10)', () => {
  const pesos = registrosDePeso([
    { data: '2026-01-01', pesoKg: 80 },
    { data: '2026-01-02', pesoKg: 81 },
    { data: '2026-01-04', pesoKg: 79 },
    { data: '2026-01-08', pesoKg: 78 },
    { data: '2026-01-09', cinturaCm: 90 },
  ])

  it('média dos registros dos últimos 7 dias corridos', () => {
    expect(mediaMovel7(pesos, '2026-01-04')).toBe(80)
    // janela 02 a 08: 81, 79, 78
    expect(mediaMovel7(pesos, '2026-01-08')).toBe(79.3)
    expect(mediaMovel7(pesos, '2025-12-31')).toBeNull()
  })

  it('ignora registros só de cintura', () => {
    expect(pesos).toHaveLength(4)
  })

  it('peso de tendência usa a média; sem registro na semana usa o último', () => {
    expect(pesoTendencia(pesos, '2026-01-08')).toEqual({ valor: 79.3, fonte: 'media7' })
    expect(pesoTendencia(pesos, '2026-02-01')).toEqual({ valor: 78, fonte: 'ultimo' })
    expect(pesoTendencia([], '2026-02-01')).toBeNull()
  })

  it('resumo compara médias, nunca um dia com o outro', () => {
    const r = resumoVariacao(pesos, '2026-01-08')
    // média hoje 79,3; média em 01/01 = 80
    expect(r.semana).toBe(-0.7)
    expect(r.quatroSemanas).toBeNull()
    expect(r.desdeInicio).toBe(-0.7)
  })

  it('sugere medir a cintura 1x por semana', () => {
    expect(sugerirCintura([{ data: '2026-01-01', cinturaCm: 80 }], '2026-01-07')).toBe(false)
    expect(sugerirCintura([{ data: '2026-01-01', cinturaCm: 80 }], '2026-01-08')).toBe(true)
    expect(sugerirCintura([{ data: '2026-01-01', pesoKg: 70 }], '2026-01-02')).toBe(true)
  })
})

describe('coerência com o objetivo (§10)', () => {
  const base = { alturaCm: 170, nascimento: '1990-01-01', sexo: 'feminino' as const, hoje: '2026-06-01' }

  it('abaixo do peso + emagrecimento: alerta e sugestão de outro objetivo', () => {
    const av = avaliarPeso({ ...base, pesoKg: 52 })
    expect(av.classe).toBe('abaixo')
    expect(emagrecimentoDesaconselhado(av)).toBe(true)
    const msgs = alertasObjetivo(av, ['emagrecimento', 'hipertrofia'])
    expect(msgs.some((m) => m.tipo === 'perigo' && /médico ou nutricionista/.test(m.texto))).toBe(true)
    expect(alertasObjetivo(av, ['hipertrofia'])).toEqual([])
    expect(objetivosRecomendados(av)).toEqual(['hipertrofia', 'saude'])
  })

  it('IMC até 19,9 também desaconselha emagrecimento', () => {
    const av = avaliarPeso({ ...base, pesoKg: 57.5 }) // IMC 19,9
    expect(av.imc).toBe(19.9)
    expect(av.classe).toBe('adequado')
    expect(emagrecimentoDesaconselhado(av)).toBe(true)
  })

  it('sobrepeso: emagrecimento como sugestão', () => {
    const av = avaliarPeso({ ...base, pesoKg: 78 })
    expect(av.classe).toBe('sobrepeso')
    const [m] = mensagensClassificacao(av)
    expect(m.texto).toMatch(/Emagrecimento pode ser um bom objetivo/)
    expect(objetivosRecomendados(av)).toEqual(['emagrecimento'])
  })

  it('C7: fora da faixa adequada, mensagem em vermelho com a classificação em maiúsculas', () => {
    const av = avaliarPeso({ ...base, pesoKg: 94 }) // IMC 32,5
    expect(av.classe).toBe('obesidade1')
    const [m] = mensagensClassificacao(av)
    expect(m.tipo).toBe('perigo')
    expect(m.texto).toBe('Pelo IMC (32,5), sua classificação é OBESIDADE GRAU I. Emagrecimento pode ser um bom objetivo para você.')
    expect(m.destaque).toBe('OBESIDADE GRAU I')
    // peso adequado: só informativo, sem recomendação
    const ok = avaliarPeso({ ...base, pesoKg: 65 })
    expect(mensagensClassificacao(ok)[0].tipo).toBe('info')
    expect(objetivosRecomendados(ok)).toEqual([])
  })

  it('obesidade II ou III: liberação médica e readaptação', () => {
    const av = avaliarPeso({ ...base, pesoKg: 105 })
    expect(av.classe).toBe('obesidade2')
    expect(exigeLiberacaoMedica(av.classe)).toBe(true)
    expect(mensagensClassificacao(av).some((m) => /liberação médica/.test(m.texto))).toBe(true)
    expect(exigeLiberacaoMedica('obesidade1')).toBe(false)
  })

  it('menor de 18: só mostra o valor e recomenda avaliação', () => {
    const av = avaliarPeso({ ...base, nascimento: '2010-01-01', pesoKg: 60 })
    expect(av.classe).toBe('nao_classificado')
    const msgs = [...mensagensClassificacao(av), ...alertasObjetivo(av, ['emagrecimento'])]
    expect(msgs).toHaveLength(1)
    expect(msgs[0].texto).toMatch(/avaliação/)
    expect(objetivosRecomendados(av)).toEqual([])
  })
})
