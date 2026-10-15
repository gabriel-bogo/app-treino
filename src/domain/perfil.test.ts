import { describe, expect, it } from 'vitest'
import { ajustarDuracao, ajustarTreinos, avisoEnfases, normalizarPerfil, opcoesTreinos, textoDuracao, treinosRecomendados, validarTreino } from './perfil'

describe('perfil (§4, C1 a C3)', () => {
  it('duração: barra de 30 a 120 min, de 5 em 5', () => {
    expect(ajustarDuracao(45)).toBe(45)
    expect(ajustarDuracao(47)).toBe(45)
    expect(ajustarDuracao(10)).toBe(30)
    expect(ajustarDuracao(180)).toBe(120)
    expect(ajustarDuracao(undefined)).toBe(60)
    expect(textoDuracao(45)).toBe('45 min')
    expect(textoDuracao(60)).toBe('1 h')
    expect(textoDuracao(95)).toBe('1 h 35 min')
  })

  it('C10: número de treinos de 2 até os dias, com sugestão', () => {
    expect(treinosRecomendados(5)).toBe(5)
    expect(treinosRecomendados(6)).toBe(6)
    expect(treinosRecomendados(3)).toBe(2)
    expect(opcoesTreinos(3).map((o) => o.valor)).toEqual([2, 3])
    expect(ajustarTreinos(6, 4)).toBe(4)
    expect(validarTreino({ nivel: 'iniciante', diasSemana: 3, treinos: 4, duracaoMin: 60, objetivos: ['saude'], enfases: [] }).treinos).toBeDefined()
  })

  it('objetivo: pelo menos um; ênfase pode ficar vazia (equilibrado)', () => {
    const base = { nivel: 'iniciante', diasSemana: 3, treinos: 3, duracaoMin: 60 } as const
    expect(validarTreino({ ...base, enfases: [], objetivos: [] }).objetivos).toBeDefined()
    expect(validarTreino({ ...base, enfases: [], objetivos: ['saude', 'hipertrofia'] })).toEqual({})
  })

  it('explica combinações de ênfase que se anulam ou se repetem', () => {
    expect(avisoEnfases([])).toBeNull()
    expect(avisoEnfases(['superior', 'gluteos'])).toBeNull()
    expect(avisoEnfases(['superior', 'inferior'])).toMatch(/equilibrado/)
    expect(avisoEnfases(['superior', 'inferior', 'gluteos'])).toMatch(/só para glúteos/)
    expect(avisoEnfases(['inferior', 'gluteos'])).toMatch(/já incluem glúteos/)
  })

  it('converte perfil da versão anterior e deixa o atual igual', () => {
    const antigo = { id: 'perfil', nome: 'Teste', objetivo: 'saude', enfase: 'equilibrado', duracaoMin: 75, diasSemana: 5 }
    const novo = normalizarPerfil(antigo)
    // C10: sem número de treinos salvo, usa a sugestão para os dias (5 dias → 5 treinos)
    expect(novo).toEqual({ id: 'perfil', nome: 'Teste', objetivos: ['saude'], enfases: [], duracaoMin: 75, diasSemana: 5, treinos: 5 })
    expect(normalizarPerfil(novo)).toEqual(novo)
    expect(normalizarPerfil({ objetivo: 'hipertrofia', enfase: 'superior' })).toMatchObject({ objetivos: ['hipertrofia'], enfases: ['superior'] })
    // valor inválido não quebra: objetivo cai para saúde geral
    expect(normalizarPerfil({ objetivo: 'xyz' }).objetivos).toEqual(['saude'])
  })
})
