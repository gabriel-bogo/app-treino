import { describe, expect, it } from 'vitest'
import { revisarVolume } from './volume'

describe('aumento gradual de volume (§6.3, A3)', () => {
  const exerciciosPorGrupo = { peito: ['a', 'b'], costas: ['c', 'd', 'e'] }
  it('+2 séries quando pelo menos metade dos exercícios do grupo subiu um degrau', () => {
    const novo = revisarVolume({ nivelVolume: {}, exerciciosPorGrupo, eventos: [{ exercicioId: 'a', tipo: 'aumento_reps' }] })
    expect(novo.peito).toBe(10)
    expect(novo.costas).toBeUndefined()
  })
  it('regressões não contam como progresso', () => {
    const novo = revisarVolume({ nivelVolume: {}, exerciciosPorGrupo, eventos: [{ exercicioId: 'a', tipo: 'regressao' }] })
    expect(novo.peito).toBeUndefined()
  })
  it('não passa de 16', () => {
    const novo = revisarVolume({ nivelVolume: { peito: 16 }, exerciciosPorGrupo, eventos: [{ exercicioId: 'a', tipo: 'aumento_carga' }, { exercicioId: 'b', tipo: 'aumento_reps' }] })
    expect(novo.peito).toBe(16)
  })
})
