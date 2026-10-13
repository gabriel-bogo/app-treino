import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { BIBLIOTECA, GRUPOS, GRUPOS_GRANDES, contraindicacaoPara, exercicioPermitido, exercicioPorId } from './biblioteca'

describe('biblioteca curada (§5)', () => {
  it('tem entre 80 e 120 exercícios', () => {
    expect(BIBLIOTECA.length).toBeGreaterThanOrEqual(80)
    expect(BIBLIOTECA.length).toBeLessThanOrEqual(120)
  })

  it('ids únicos', () => {
    expect(new Set(BIBLIOTECA.map((e) => e.id)).size).toBe(BIBLIOTECA.length)
  })

  it('todas as imagens existem dentro do projeto (nada vem da internet)', () => {
    for (const e of BIBLIOTECA) {
      for (const img of e.imagens) {
        expect(img.startsWith('http')).toBe(false)
        expect(existsSync(`public/exercises/${img}`), img).toBe(true)
      }
    }
  })

  it('instruções curtas em PT-BR: 3 a 5 passos e 1 ou 2 erros comuns', () => {
    for (const e of BIBLIOTECA) {
      expect(e.passos.length, e.id).toBeGreaterThanOrEqual(3)
      expect(e.passos.length, e.id).toBeLessThanOrEqual(5)
      expect(e.errosComuns.length, e.id).toBeGreaterThanOrEqual(1)
      expect(e.errosComuns.length, e.id).toBeLessThanOrEqual(2)
    }
  })

  it('substitutos, variações e versões assistidas apontam para exercícios existentes', () => {
    for (const e of BIBLIOTECA) {
      for (const id of [...e.substitutos, ...(e.versaoAssistida ?? []), ...(e.variacaoMaisDificil ? [e.variacaoMaisDificil] : [])]) {
        expect(exercicioPorId(id), `${e.id} → ${id}`).toBeDefined()
      }
    }
  })

  it('substitutos são do mesmo grupo muscular', () => {
    for (const e of BIBLIOTECA) for (const s of e.substitutos) expect(exercicioPorId(s)!.grupo).toBe(e.grupo)
  })

  it('incremento de carga positivo', () => {
    for (const e of BIBLIOTECA) expect(e.incrementoCarga).toBeGreaterThan(0)
  })

  it('cada grupo tem opções para iniciante; grupos grandes têm composto para iniciante', () => {
    for (const g of GRUPOS) {
      const doGrupo = BIBLIOTECA.filter((e) => e.grupo === g && !e.soAquecimento && e.nivel === 'iniciante')
      expect(doGrupo.length, g).toBeGreaterThanOrEqual(2)
    }
    for (const g of GRUPOS_GRANDES) {
      expect(BIBLIOTECA.some((e) => e.grupo === g && e.tipo === 'composto' && e.nivel === 'iniciante'), g).toBe(true)
    }
  })

  it('lista proibida do ombro (§6.7) está marcada como contraindicação forte', () => {
    const proibidos = ['desenvolvimento-nuca', 'puxada-nuca', 'remada-alta', 'mergulho-paralela', 'mergulho-banco', 'mergulho-maquina']
    for (const id of proibidos) {
      expect(contraindicacaoPara(exercicioPorId(id)!, ['ombro']), id).toBe('forte')
      expect(exercicioPermitido(exercicioPorId(id)!, ['ombro'], new Map())).toBe(false)
    }
    expect(contraindicacaoPara(exercicioPorId('supino-reto-barra')!, ['ombro'])).toBe('leve')
    expect(contraindicacaoPara(exercicioPorId('desenvolvimento-barra')!, ['ombro'])).toBe('leve')
  })

  it('exercícios do aquecimento de ombro existem (§6.11)', () => {
    expect(exercicioPorId('rotacao-externa-elastico')?.soAquecimento).toBe(true)
    expect(exercicioPorId('rotacao-externa-cabo')?.soAquecimento).toBe(true)
    expect(exercicioPorId('face-pull')).toBeDefined()
  })

  it('marcação de indisponível ou evitar tira o exercício das sugestões', () => {
    const ex = exercicioPorId('leg-press')!
    expect(exercicioPermitido(ex, [], new Map())).toBe(true)
    expect(exercicioPermitido(ex, [], new Map([['leg-press', { exercicioId: 'leg-press', indisponivel: true }]]))).toBe(false)
    expect(exercicioPermitido(ex, [], new Map([['leg-press', { exercicioId: 'leg-press', evitar: true }]]))).toBe(false)
  })
})
