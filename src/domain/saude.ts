// Registro de saúde (§10): IMC, cintura, média móvel de 7 dias, faixa de peso
// adequado e coerência com o objetivo. Lógica pura, sem tela.

import { diasEntre, idadeEm, somarDias } from './datas'
import type { Objetivo, RegistroCorpo, Sexo } from './tipos'

// ─────────────────────────── IMC ───────────────────────────

export type ClasseIMC =
  | 'abaixo'
  | 'adequado'
  | 'sobrepeso'
  | 'obesidade1'
  | 'obesidade2'
  | 'obesidade3'
  | 'baixo_peso_idoso'
  | 'adequado_idoso'
  | 'sobrepeso_idoso'
  | 'nao_classificado'

export const NOME_CLASSE: Record<ClasseIMC, string> = {
  abaixo: 'Abaixo do peso',
  adequado: 'Peso adequado',
  sobrepeso: 'Sobrepeso',
  obesidade1: 'Obesidade grau I',
  obesidade2: 'Obesidade grau II',
  obesidade3: 'Obesidade grau III',
  baixo_peso_idoso: 'Baixo peso',
  adequado_idoso: 'Adequado',
  sobrepeso_idoso: 'Sobrepeso',
  nao_classificado: 'Sem classificação',
}

export type FaixaEtaria = 'menor' | 'adulto' | 'idoso'

export function faixaEtaria(idade: number): FaixaEtaria {
  if (idade < 18) return 'menor'
  if (idade >= 60) return 'idoso'
  return 'adulto'
}

/** IMC = peso / altura² (altura em metros), arredondado a 1 casa (o mesmo número que aparece na tela). */
export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100
  return Math.round((pesoKg / (m * m)) * 10) / 10
}

/** Classificação conforme a idade (§10: OMS para 18-59; Ministério da Saúde para 60+; menores não classifica). */
export function classificarIMC(imc: number, idade: number): ClasseIMC {
  const faixa = faixaEtaria(idade)
  if (faixa === 'menor') return 'nao_classificado'
  if (faixa === 'idoso') {
    if (imc < 22) return 'baixo_peso_idoso'
    if (imc <= 27) return 'adequado_idoso'
    return 'sobrepeso_idoso'
  }
  if (imc < 18.5) return 'abaixo'
  if (imc < 25) return 'adequado'
  if (imc < 30) return 'sobrepeso'
  if (imc < 35) return 'obesidade1'
  if (imc < 40) return 'obesidade2'
  return 'obesidade3'
}

/** Limites de IMC da faixa adequada para a idade. */
export function limitesAdequados(idade: number): { min: number; max: number } | null {
  const faixa = faixaEtaria(idade)
  if (faixa === 'menor') return null
  return faixa === 'idoso' ? { min: 22, max: 27 } : { min: 18.5, max: 24.9 }
}

/** Faixa de peso adequado para a altura, ex: 1,78 m → 58,6 a 78,9 kg (B9). */
export function faixaPesoAdequado(alturaCm: number, idade: number): { min: number; max: number } | null {
  const lim = limitesAdequados(idade)
  if (!lim) return null
  const m2 = (alturaCm / 100) ** 2
  return { min: Math.round(lim.min * m2 * 10) / 10, max: Math.round(lim.max * m2 * 10) / 10 }
}

/** Quanto falta para entrar na faixa adequada (negativo = perder; positivo = ganhar; 0 = dentro). */
export function distanciaFaixa(pesoKg: number, faixa: { min: number; max: number }): number {
  if (pesoKg < faixa.min) return Math.round((faixa.min - pesoKg) * 10) / 10
  if (pesoKg > faixa.max) return -Math.round((pesoKg - faixa.max) * 10) / 10
  return 0
}

// ─────────────────────────── Cintura ───────────────────────────

export type RiscoCintura = 'normal' | 'aumentado' | 'muito_aumentado'

export const NOME_RISCO: Record<RiscoCintura, string> = {
  normal: 'Sem risco aumentado',
  aumentado: 'Risco aumentado',
  muito_aumentado: 'Risco muito aumentado',
}

/** Referência OMS de risco cardiometabólico pela cintura (§10). */
export function classificarCintura(cinturaCm: number, sexo: Sexo): RiscoCintura {
  const [aumentado, muito] = sexo === 'masculino' ? [94, 102] : [80, 88]
  if (cinturaCm >= muito) return 'muito_aumentado'
  if (cinturaCm >= aumentado) return 'aumentado'
  return 'normal'
}

// ─────────────────────── Média móvel (§10) ───────────────────────

export function registrosDePeso(registros: RegistroCorpo[]): { data: string; pesoKg: number }[] {
  return registros
    .filter((r): r is RegistroCorpo & { pesoKg: number } => typeof r.pesoKg === 'number')
    .map((r) => ({ data: r.data, pesoKg: r.pesoKg }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

/** Média dos pesos registrados nos 7 dias corridos que terminam em `data` (inclusive). */
export function mediaMovel7(pesos: { data: string; pesoKg: number }[], data: string): number | null {
  const inicio = somarDias(data, -6)
  const janela = pesos.filter((p) => p.data >= inicio && p.data <= data)
  if (!janela.length) return null
  return Math.round((janela.reduce((s, p) => s + p.pesoKg, 0) / janela.length) * 10) / 10
}

/** Peso de tendência atual: média móvel de hoje; sem registros na semana, o último registro. */
export function pesoTendencia(pesos: { data: string; pesoKg: number }[], hoje: string): { valor: number; fonte: 'media7' | 'ultimo' } | null {
  const mm = mediaMovel7(pesos, hoje)
  if (mm !== null) return { valor: mm, fonte: 'media7' }
  const anteriores = pesos.filter((p) => p.data <= hoje)
  const ultimo = anteriores[anteriores.length - 1]
  return ultimo ? { valor: ultimo.pesoKg, fonte: 'ultimo' } : null
}

export interface ResumoVariacao {
  semana: number | null
  quatroSemanas: number | null
  desdeInicio: number | null
}

/** Variação da média móvel na última semana, nas últimas 4 semanas e desde o início (§10). Nunca compara dia com dia. */
export function resumoVariacao(pesos: { data: string; pesoKg: number }[], hoje: string): ResumoVariacao {
  const atual = mediaMovel7(pesos, hoje)
  const dif = (antes: number | null) => (atual === null || antes === null ? null : Math.round((atual - antes) * 10) / 10)
  const primeiro = pesos[0]
  return {
    semana: dif(mediaMovel7(pesos, somarDias(hoje, -7))),
    quatroSemanas: dif(mediaMovel7(pesos, somarDias(hoje, -28))),
    desdeInicio: primeiro && primeiro.data < hoje ? dif(primeiro.pesoKg) : null,
  }
}

/** Pontos do gráfico: peso do dia + média móvel na mesma data. */
export function serieGrafico(pesos: { data: string; pesoKg: number }[]): { data: string; peso: number; media: number }[] {
  return pesos.map((p) => ({ data: p.data, peso: p.pesoKg, media: mediaMovel7(pesos, p.data)! }))
}

/** Cintura registrada há mais de 7 dias (ou nunca): sugerir medir de novo (§10: 1x por semana). */
export function sugerirCintura(registros: RegistroCorpo[], hoje: string): boolean {
  const comCintura = registros.filter((r) => typeof r.cinturaCm === 'number').map((r) => r.data).sort()
  const ultima = comCintura[comCintura.length - 1]
  return !ultima || diasEntre(ultima, hoje) >= 7
}

// ─────────────────── Avaliação completa e coerência ───────────────────

export interface AvaliacaoPeso {
  idade: number
  faixa: FaixaEtaria
  imc: number
  classe: ClasseIMC
  faixaPeso: { min: number; max: number } | null
  /** kg para entrar na faixa (positivo ganhar, negativo perder, 0 dentro) */
  distancia: number | null
  cintura?: { cm: number; risco: RiscoCintura }
  /** IMC indica sobrepeso mas a cintura está abaixo do risco */
  provavelMassaMuscular: boolean
}

export function avaliarPeso(params: {
  pesoKg: number
  alturaCm: number
  nascimento: string
  sexo: Sexo
  hoje: string
  cinturaCm?: number
}): AvaliacaoPeso {
  const idade = idadeEm(params.nascimento, params.hoje)
  const imc = calcularIMC(params.pesoKg, params.alturaCm)
  const classe = classificarIMC(imc, idade)
  const faixaPeso = faixaPesoAdequado(params.alturaCm, idade)
  const cintura =
    params.cinturaCm !== undefined ? { cm: params.cinturaCm, risco: classificarCintura(params.cinturaCm, params.sexo) } : undefined
  return {
    idade,
    faixa: faixaEtaria(idade),
    imc,
    classe,
    faixaPeso,
    distancia: faixaPeso ? distanciaFaixa(params.pesoKg, faixaPeso) : null,
    cintura,
    provavelMassaMuscular: (classe === 'sobrepeso' || classe === 'sobrepeso_idoso') && cintura?.risco === 'normal',
  }
}

/** Abaixo do peso (ou IMC até 19,9): emagrecimento não é recomendado (§10). */
export function emagrecimentoDesaconselhado(av: Pick<AvaliacaoPeso, 'imc' | 'classe' | 'faixa'>): boolean {
  if (av.faixa === 'menor') return false
  return av.classe === 'abaixo' || av.classe === 'baixo_peso_idoso' || av.imc <= 19.9
}

/** Obesidade grau II ou III: recomendar liberação médica e manter readaptação (§10). */
export function exigeLiberacaoMedica(classe: ClasseIMC): boolean {
  return classe === 'obesidade2' || classe === 'obesidade3'
}

export interface MensagemObjetivo {
  tipo: 'info' | 'aviso' | 'perigo'
  texto: string
}

/** Contexto mostrado ao escolher o objetivo no onboarding (§10, "Coerência com o objetivo"). */
export function mensagensObjetivo(av: AvaliacaoPeso, objetivo: Objetivo | undefined): MensagemObjetivo[] {
  const msgs: MensagemObjetivo[] = []
  if (av.faixa === 'menor') {
    msgs.push({
      tipo: 'info',
      texto: `Seu IMC é ${av.imc.toFixed(1).replace('.', ',')}. Para menores de 18 anos o IMC depende de curvas por idade; recomendamos avaliação com um profissional.`,
    })
    return msgs
  }
  const nome = NOME_CLASSE[av.classe].toLowerCase()
  const imcTxt = av.imc.toFixed(1).replace('.', ',')
  switch (av.classe) {
    case 'abaixo':
    case 'baixo_peso_idoso':
      msgs.push({ tipo: 'info', texto: `Pelo IMC (${imcTxt}), sua classificação é ${nome}. Hipertrofia ou saúde geral costumam combinar melhor.` })
      break
    case 'adequado':
    case 'adequado_idoso':
      msgs.push({ tipo: 'info', texto: `Pelo IMC (${imcTxt}), seu peso está na faixa adequada. Escolha o objetivo que mais combina com você.` })
      break
    case 'sobrepeso':
    case 'sobrepeso_idoso':
    case 'obesidade1':
      msgs.push({ tipo: 'info', texto: `Pelo IMC (${imcTxt}), sua classificação é ${nome}. Emagrecimento pode ser um bom objetivo para você.` })
      break
    case 'obesidade2':
    case 'obesidade3':
      msgs.push({ tipo: 'info', texto: `Pelo IMC (${imcTxt}), sua classificação é ${nome}. Emagrecimento pode ser um bom objetivo para você.` })
      msgs.push({
        tipo: 'aviso',
        texto: 'Recomendamos liberação médica antes de começar. O app vai iniciar com a fase de readaptação (3 semanas de treinos mais leves), mesmo se você já treina.',
      })
      break
    case 'nao_classificado':
      break
  }
  if (objetivo === 'emagrecimento' && emagrecimentoDesaconselhado(av)) {
    msgs.push({
      tipo: 'perigo',
      texto: 'Com o seu peso atual, emagrecer não é recomendado sem acompanhamento. Converse com um médico ou nutricionista. Sugestão: escolha "saúde geral" ou "hipertrofia".',
    })
  }
  return msgs
}
