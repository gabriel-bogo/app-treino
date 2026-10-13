import { describe, expect, it } from 'vitest'
import { ajustarDuracao, avisoEnfases, normalizarPerfil, textoDuracao, validarTreino } from './perfil'

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

  it('objetivo: pelo menos um; ênfase pode ficar vazia (equilibrado)', () => {
    const base = { nivel: 'iniciante', diasSemana: 3, duracaoMin: 60 } as const
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
    const antigo = { id: 'perfil', nome: 'Teste', objetivo: 'saude', enfase: 'equilibrado', duracaoMin: 75 }
    const novo = normalizarPerfil(antigo)
    expect(novo).toEqual({ id: 'perfil', nome: 'Teste', objetivos: ['saude'], enfases: [], duracaoMin: 75 })
    expect(normalizarPerfil(novo)).toEqual(novo)
    expect(normalizarPerfil({ objetivo: 'hipertrofia', enfase: 'superior' })).toMatchObject({ objetivos: ['hipertrofia'], enfases: ['superior'] })
    // valor inválido não quebra: objetivo cai para saúde geral
    expect(normalizarPerfil({ objetivo: 'xyz' }).objetivos).toEqual(['saude'])
  })
})
