import { describe, expect, it } from 'vitest'
import { dataLocal, diasEntre, formatarDuracao, idadeEm, somarDias, mascaraData, dataDigitadaParaIso, isoParaDataDigitada, formatarData, formatarHora, formatarDuracaoTreino } from './datas'

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

describe('data digitada DD/MM/AAAA', () => {
  it('máscara coloca as barras sozinha e ignora letras', () => {
    expect(mascaraData('0807')).toBe('08/07')
    expect(mascaraData('08071987')).toBe('08/07/1987')
    expect(mascaraData('08/07/19870')).toBe('08/07/1987')
    expect(mascaraData('a1b')).toBe('1')
  })
  it('converte só datas completas e que existem', () => {
    expect(dataDigitadaParaIso('08/07/1987')).toBe('1987-07-08')
    expect(dataDigitadaParaIso('31/02/2000')).toBeNull()
    expect(dataDigitadaParaIso('08/07/19')).toBeNull()
    expect(isoParaDataDigitada('1987-07-08')).toBe('08/07/1987')
  })
})

describe('C16: horário de Brasília (GMT-3), qualquer que seja o fuso do aparelho', () => {
  it('treino às 21:30 em Brasília (00:30 UTC do dia seguinte) é do mesmo dia', () => {
    const instante = '2026-10-14T00:30:00.000Z'
    expect(dataLocal(instante)).toBe('2026-10-13')
    expect(formatarData(instante)).toBe('13 out 2026')
    expect(formatarHora(instante)).toBe('21:30')
  })
  it('dias de calendário e duração por extenso', () => {
    expect(somarDias('2026-10-13', 1)).toBe('2026-10-14')
    expect(diasEntre('2026-10-13', '2026-10-20')).toBe(7)
    expect(formatarDuracaoTreino(125)).toBe('2 min')
    expect(formatarDuracaoTreino(3900)).toBe('1 h 05 min')
  })
})
