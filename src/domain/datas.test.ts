import { describe, expect, it } from 'vitest'
import { dataLocal, diasEntre, formatarDuracao, idadeEm, somarDias } from './datas'

describe('datas', () => {
  it('diasEntre conta dias de calendário', () => {
    expect(diasEntre('2026-01-01', '2026-01-11')).toBe(10)
    expect(diasEntre('2026-03-01', '2026-02-27')).toBe(-2)
    expect(diasEntre('2026-02-28', '2026-03-01')).toBe(1)
  })
  it('somarDias atravessa meses', () => {
    expect(somarDias('2026-01-30', 3)).toBe('2026-02-02')
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('idade em anos completos', () => {
    expect(idadeEm('1990-05-20', '2026-05-19')).toBe(35)
    expect(idadeEm('1990-05-20', '2026-05-20')).toBe(36)
  })
  it('dataLocal formata AAAA-MM-DD', () => {
    expect(dataLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('formata duração', () => {
    expect(formatarDuracao(75)).toBe('1:15')
    expect(formatarDuracao(3725)).toBe('1:02:05')
  })
})
