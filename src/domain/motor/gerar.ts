// Motor de sugestão de treino (§6.1 a §6.7). Função pura: mesmas entradas →
// mesmo plano. Não acessa banco nem tela.
//
// Resumo do que acontece:
//  1. Define a fase e a divisão (§6.1, §6.2).
//  2. Fase normal: calcula o volume semanal alvo por grupo (§6.3, §6.6) e
//     distribui as séries pelos dias que treinam aquele grupo, escolhendo
//     exercícios permitidos (§6.7) e variando entre dias parecidos.
//     Readaptação: full body com 1 exercício por grupo, 2-3 séries, até
//     preencher o tempo (§6.1, §6.4).
//  3. Insere o aquecimento específico de ombro quando precisa (§6.11).
//  4. Se o dia passa da duração, corta séries na ordem de menor importância
//     respeitando os pisos de volume (A2, §6.3).
//  5. Ordena agrupando por músculo (C4): músculos grandes antes dos pequenos,
//     composto antes de isolado dentro do músculo, core no fim.

import { BIBLIOTECA, contraindicacaoPara, exercicioPermitido, exercicioPorId, textoAlerta, NOME_GRUPO } from '../biblioteca'
import type { AjusteExercicio, Exercicio, Fase, Grupo, Perfil, TipoDia } from '../tipos'
import { definirDivisao, diaTemCore, musculosValidos, type ModeloDia } from './divisao'
import {
  AQUECIMENTO_OMBRO,
  CATEGORIA_OMBRO_DO_DIA,
  FAIXA_NORMAL,
  FAIXA_READAPTACAO,
  GRANDES,
  MIN_AQUECIMENTO,
  MIN_AQUECIMENTO_OMBRO,
  MIN_POR_SERIE,
  MINIMO_PESO_CORPO,
  MULT_ENFASE,
  MULT_VOLUME_FEMININO,
  ORDEM_PREENCHIMENTO,
  PESO_SECUNDARIO,
  VOLUME_INICIAL_GRANDE,
  VOLUME_MAXIMO_GRANDE,
  VOLUME_MINIMO,
  descansoSegundos,
  focoSuperior,
  gruposDaEnfase,
  PERNAS_FOCO_SUPERIOR,
  FOCO_SUPERIOR_BASE,
  niveisCompativeis,
  seriesReadaptacao,
} from './regras'

export interface ContextoMotor {
  perfil: Pick<Perfil, 'sexo' | 'nivel' | 'objetivos' | 'enfases' | 'diasSemana' | 'treinos' | 'musculosPorTreino' | 'duracaoMin' | 'limitacoes'>
  fase: Fase
  /** 0, 1 ou 2 (semana atual da readaptação) */
  semanaReadaptacao: number
  /** séries semanais base dos grupos grandes (A3); ausente = 8 */
  nivelVolume: Partial<Record<Grupo, number>>
  ajustes: Map<string, AjusteExercicio>
  /** "Trocar no plano" (§6.10): original → substituto */
  trocasNoPlano: Record<string, string>
  /** C14: exercícios incluídos pela pessoa em cada treino */
  incluidos?: { variante: string; exercicioId: string }[]
  /** C15: exercícios excluídos pela pessoa de cada treino */
  excluidos?: { variante: string; exercicioId: string }[]
  biblioteca?: Exercicio[]
}

export interface ExercicioGerado {
  exercicioId: string
  papel: 'trabalho' | 'aquecimento_ombro'
  series: number
  repsMin: number
  repsMax: number
  descansoSeg: number
  alerta?: string
  incluido?: boolean
}

export interface DiaGerado {
  variante: string
  grupos: Grupo[]
  nome: string
  tipo: TipoDia
  exercicios: ExercicioGerado[]
  minutosEstimados: number
}

export interface PlanoGerado {
  fase: Fase
  divisao: string
  dias: DiaGerado[]
  /** séries semanais por grupo (principal 1, secundário 0,5) */
  volume: Record<Grupo, number>
  /** alvo semanal por grupo (fase normal) */
  alvos: Record<Grupo, number>
  avisos: string[]
}

interface Item {
  ex: Exercicio
  series: number
  papel: 'trabalho' | 'aquecimento_ombro'
  /** C14: incluído pela pessoa; o motor não corta */
  fixo?: boolean
}

interface DiaTrabalho extends ModeloDia {
  /** quantas vezes este modelo aparece na semana */
  ocorrencias: number
  temCore: boolean
  itens: Item[]
}

const TODOS_GRUPOS: Grupo[] = ['peito', 'costas', 'ombros', 'quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'biceps', 'triceps', 'core']

function zeros(): Record<Grupo, number> {
  return Object.fromEntries(TODOS_GRUPOS.map((g) => [g, 0])) as Record<Grupo, number>
}

const ehEmpurrar = (e: Exercicio) => e.padrao === 'empurrar_horizontal' || e.padrao === 'empurrar_vertical'

// ───────────────────────── Volume alvo (§6.3) ─────────────────────────

export function calcularAlvos(ctx: ContextoMotor): { alvos: Record<Grupo, number>; semEnfase: Record<Grupo, number> } {
  const alvos = zeros()
  const semEnfase = zeros()
  const enfase = gruposDaEnfase(ctx.perfil.enfases)
  const sexo = ctx.perfil.sexo === 'feminino' ? MULT_VOLUME_FEMININO : 1
  for (const g of TODOS_GRUPOS) {
    const base = GRANDES.includes(g) ? (ctx.nivelVolume[g] ?? VOLUME_INICIAL_GRANDE) : VOLUME_MINIMO
    semEnfase[g] = Math.round(base * sexo)
    alvos[g] = Math.round(base * sexo * (enfase.includes(g) ? MULT_ENFASE : 1))
  }
  return { alvos, semEnfase }
}

/**
 * C8: no foco em superiores as pernas têm volume fixo por dia de pernas
 * (uns 3 exercícios) e glúteo isolado, panturrilha e core ficam de fora.
 */
function alvosDosDias(ctx: ContextoMotor, dias: DiaTrabalho[], alvos: Record<Grupo, number>): Record<Grupo, number> {
  if (!focoSuperior(ctx.perfil.enfases)) return alvos
  const ajustados = { ...alvos, gluteos: 0, panturrilha: 0, core: 0 }
  // superiores começam no topo da faixa inicial (§6.3: 8 a 10; pequenos 8) com a ênfase,
  // para usar o tempo que sobra sem perna, glúteo e abdômen
  const sexo = ctx.perfil.sexo === 'feminino' ? MULT_VOLUME_FEMININO : 1
  for (const g of ['peito', 'costas', 'ombros', 'biceps', 'triceps'] as const) {
    const base = GRANDES.includes(g) ? FOCO_SUPERIOR_BASE.grande : FOCO_SUPERIOR_BASE.pequeno
    ajustados[g] = Math.max(alvos[g], Math.round(base * sexo * MULT_ENFASE))
  }
  for (const g of ['quadriceps', 'posteriores'] as const) {
    const diasComG = dias.filter((d) => d.grupos.includes(g)).reduce((n, d) => n + d.ocorrencias, 0)
    ajustados[g] = (PERNAS_FOCO_SUPERIOR[g] ?? 0) * diasComG
  }
  return ajustados
}

/**
 * C8: na ficha de foco em superiores, todo músculo do nome do dia tem pelo
 * menos um exercício (ex: o dia "Ombros e tríceps" sempre tem tríceps, mesmo
 * que o volume já viesse dos supinos como músculo secundário).
 */
function garantirTodosOsGrupos(dias: DiaTrabalho[], sel: Seletor) {
  for (const dia of dias) {
    for (const g of dia.grupos) {
      if (dia.itens.some((i) => i.ex.grupo === g)) continue
      if (g === 'core' && !dia.temCore) continue
      const ex = sel.escolher(g, dia)
      if (ex) dia.itens.push({ ex, series: 3, papel: 'trabalho' })
    }
  }
}

/**
 * C13: se o corte por tempo tirou o único exercício de um músculo do treino,
 * tira um exercício do músculo que tem mais (isolado primeiro) e devolve o
 * lugar para o músculo que ficou sem nada.
 */
function reequilibrarGrupos(ctx: ContextoMotor, dias: DiaTrabalho[], sel: Seletor) {
  for (const dia of dias) {
    for (const g of dia.grupos) {
      if (g === 'core' && !dia.temCore) continue
      const doGrupo = (x: Grupo) => dia.itens.filter((i) => i.papel === 'trabalho' && i.ex.grupo === x)
      if (doGrupo(g).length) continue
      const doador = [...dia.grupos].filter((x) => x !== g).sort((a, b) => doGrupo(b).length - doGrupo(a).length)[0]
      const itensDoador = doador ? doGrupo(doador).filter((i) => !i.fixo) : []
      if (itensDoador.length < 2) continue
      const sai = itensDoador.find((i) => i.ex.tipo === 'isolado') ?? itensDoador[itensDoador.length - 1]
      const pos = dia.itens.indexOf(sai)
      dia.itens.splice(pos, 1)
      sel.devolver(sai.ex)
      const ex = sel.escolher(g, dia)
      const novo = ex ? { ex, series: Math.min(3, sai.series), papel: 'trabalho' as const } : null
      if (novo) dia.itens.push(novo)
      if (!novo || minutos(ctx, dia) > ctx.perfil.duracaoMin) {
        if (novo) {
          dia.itens.pop()
          sel.devolver(novo.ex)
        }
        dia.itens.splice(pos, 0, sai)
      }
    }
  }
}

// ─────────────────────── Escolha de exercícios ───────────────────────

const composto = (e: Exercicio) => e.tipo === 'composto'
const isolado = (e: Exercicio) => e.tipo === 'isolado'
const padrao = (p: Exercicio['padrao']) => (e: Exercicio) => e.padrao === p
const qualquer = () => true

/** Preferência de cada "vaga" de exercício dentro do grupo no mesmo dia. */
const VAGAS: Record<Grupo, ((e: Exercicio) => boolean)[]> = {
  // 2º composto de peito: de preferência um inclinado (evita dois supinos retos no mesmo dia)
  peito: [composto, isolado, (e) => composto(e) && e.id.includes('inclinado'), isolado],
  costas: [padrao('puxar_vertical'), padrao('puxar_horizontal'), padrao('puxar_horizontal'), padrao('puxar_vertical')],
  ombros: [padrao('empurrar_vertical'), isolado, isolado, composto],
  quadriceps: [padrao('agachar'), isolado, padrao('agachar'), isolado],
  posteriores: [padrao('dobrar_quadril'), isolado, isolado, padrao('dobrar_quadril')],
  gluteos: [padrao('dobrar_quadril'), isolado, padrao('dobrar_quadril'), isolado],
  triceps: [qualquer],
  biceps: [qualquer],
  panturrilha: [qualquer],
  core: [qualquer],
}

class Seletor {
  private uso = new Map<string, number>()
  private biblioteca: Exercicio[]
  constructor(private ctx: ContextoMotor) {
    this.biblioteca = ctx.biblioteca ?? BIBLIOTECA
  }

  private candidatos(g: Grupo, dia: DiaTrabalho): Exercicio[] {
    const niveis = niveisCompativeis(this.ctx.perfil.nivel)
    const categoriaOmbro = g === 'ombros' ? CATEGORIA_OMBRO_DO_DIA[dia.tipo] : undefined
    const noDia = new Set(dia.itens.map((i) => i.ex.id))
    return this.biblioteca.filter(
      (e) =>
        e.grupo === g &&
        !e.soAquecimento &&
        niveis.includes(e.nivel) &&
        (!categoriaOmbro || e.categoria === categoriaOmbro) &&
        !noDia.has(e.id) &&
        // trocado pela pessoa e o substituto já está no treino: não volta como exercício extra
        !(this.ctx.trocasNoPlano[e.id] && noDia.has(this.ctx.trocasNoPlano[e.id])) &&
        exercicioPermitido(e, this.ctx.perfil.limitacoes, this.ctx.ajustes),
    )
  }

  escolher(g: Grupo, dia: DiaTrabalho): Exercicio | undefined {
    const vagaIdx = dia.itens.filter((i) => i.ex.grupo === g).length
    const vaga = VAGAS[g][vagaIdx % VAGAS[g].length]
    const ombro = this.ctx.perfil.limitacoes.includes('ombro')
    const lista = this.candidatos(g, dia)
    if (!lista.length) return undefined
    const pontos = (e: Exercicio) => [
      vaga(e) ? 0 : 1,
      this.uso.get(e.id) ?? 0,
      // §6.7 ombro: preferir halteres e pegada neutra nos empurrar
      ombro && ehEmpurrar(e) && !e.amigavelOmbro ? 1 : 0,
      contraindicacaoPara(e, this.ctx.perfil.limitacoes) === 'leve' ? 1 : 0,
      e.prioridade,
    ]
    const ordenados = [...lista].sort((a, b) => {
      const pa = pontos(a)
      const pb = pontos(b)
      for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
      return a.id.localeCompare(b.id)
    })
    let escolhido = ordenados[0]
    // §6.10 "Trocar no plano": aplica a troca escolhida pelo usuário, se ainda for válida
    const troca = this.ctx.trocasNoPlano[escolhido.id]
    if (troca) {
      const sub = exercicioPorId(troca)
      if (sub && !dia.itens.some((i) => i.ex.id === sub.id) && exercicioPermitido(sub, this.ctx.perfil.limitacoes, this.ctx.ajustes)) escolhido = sub
    }
    this.uso.set(escolhido.id, (this.uso.get(escolhido.id) ?? 0) + 1)
    return escolhido
  }

  /** O exercício escolhido acabou não entrando no dia (não cabia no tempo). */
  devolver(ex: Exercicio) {
    this.uso.set(ex.id, Math.max(0, (this.uso.get(ex.id) ?? 1) - 1))
  }
}

// ───────────────────────── Utilitários ─────────────────────────

/** Divide `total` em `n` partes o mais iguais possível (as maiores primeiro). */
export function dividir(total: number, n: number): number[] {
  const base = Math.floor(total / n)
  const resto = total % n
  return Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0))
}

/** Escolhe k dias espalhados na sequência (ex: 2 de 3 → 1º e 3º). */
function espalhar<T>(lista: T[], k: number): T[] {
  if (k >= lista.length) return lista
  return Array.from({ length: k }, (_, i) => lista[Math.floor((i * lista.length) / k)])
}

/** Séries de um grupo num dia → partes por exercício (2 a 4 cada; ~3 por exercício, A3). */
function partesPorExercicio(series: number): number[] {
  let n = Math.max(1, Math.round(series / 3))
  while (series > 4 * n) n++
  while (n > 1 && series < 2 * n) n--
  return dividir(series, n)
}

export function minutosDoDia(itens: { ex: Exercicio; series: number; papel: string }[], comAquecimentoOmbro: boolean): number {
  let m = MIN_AQUECIMENTO + (comAquecimentoOmbro ? MIN_AQUECIMENTO_OMBRO : 0)
  for (const i of itens) if (i.papel === 'trabalho') m += i.series * MIN_POR_SERIE[i.ex.tipo]
  return m
}

function precisaAquecimentoOmbro(ctx: ContextoMotor, dia: DiaTrabalho) {
  return ctx.perfil.limitacoes.includes('ombro') && dia.itens.some((i) => i.papel === 'trabalho' && ehEmpurrar(i.ex))
}

function minutos(ctx: ContextoMotor, dia: DiaTrabalho) {
  return minutosDoDia(dia.itens, precisaAquecimentoOmbro(ctx, dia))
}

function contarVolume(dias: DiaTrabalho[]): Record<Grupo, number> {
  const vol = zeros()
  for (const d of dias) {
    for (const i of d.itens) {
      if (i.papel !== 'trabalho') continue
      vol[i.ex.grupo] += i.series * d.ocorrencias
      for (const s of i.ex.gruposSecundarios) vol[s] += i.series * d.ocorrencias * PESO_SECUNDARIO
    }
  }
  return vol
}

// ───────────────────────── Fase normal ─────────────────────────

function preencherVolume(dias: DiaTrabalho[], alvos: Record<Grupo, number>, sel: Seletor, avisos: string[]) {
  for (const g of ORDEM_PREENCHIMENTO) {
    const diasG = dias.filter((d) => (g === 'core' ? d.temCore : d.grupos.includes(g)))
    if (!diasG.length) continue
    const vol = contarVolume(dias)
    const ocorrencias = diasG.reduce((s, d) => s + d.ocorrencias, 0) / diasG.length
    const deficit = (alvos[g] - vol[g]) / ocorrencias
    if (deficit < 2) continue
    const total = Math.round(deficit)
    const k = Math.max(1, Math.min(diasG.length, Math.floor(total / 2)))
    // com menos dias do que treinos possíveis, o grupo vai para os treinos mais vazios
    // (C10: com treinos revezando, um treino não pode ficar sem nada)
    const carga = (d: DiaTrabalho) => d.itens.reduce((n, i) => n + i.series, 0)
    const menosCheios = k < diasG.length && diasG.some((d) => carga(d) !== carga(diasG[0]))
    const escolhidos = menosCheios
      ? [...diasG].sort((a, b) => carga(a) - carga(b) || diasG.indexOf(a) - diasG.indexOf(b)).slice(0, k).sort((a, b) => diasG.indexOf(a) - diasG.indexOf(b))
      : espalhar(diasG, k)
    const porDia = dividir(total, k)
    let faltou = false
    escolhidos.forEach((dia, i) => {
      for (const series of partesPorExercicio(porDia[i])) {
        const ex = sel.escolher(g, dia)
        if (!ex) {
          faltou = true
          break
        }
        dia.itens.push({ ex, series, papel: 'trabalho' })
      }
    })
    if (faltou) avisos.push(`Poucos exercícios disponíveis para ${NOME_GRUPO[g].toLowerCase()} (veja limitações e indisponíveis).`)
  }
}

/** Corta séries até cada dia caber na duração (A2: duração é teto). */
function cortarAteCaber(ctx: ContextoMotor, dias: DiaTrabalho[], alvos: Record<Grupo, number>, semEnfase: Record<Grupo, number>) {
  const enfase = gruposDaEnfase(ctx.perfil.enfases)
  const piso = (etapa: number, g: Grupo) => {
    if (etapa === 3) return 0
    if (enfase.includes(g)) return etapa === 1 ? alvos[g] : semEnfase[g]
    return Math.min(alvos[g], VOLUME_MINIMO)
  }
  const importancia = (i: Item) => {
    const base = i.ex.grupo === 'core' ? 0 : i.ex.tipo === 'isolado' ? 1 : GRANDES.includes(i.ex.grupo) ? 3 : 2
    return base + (enfase.includes(i.ex.grupo) ? 10 : 0)
  }
  for (const etapa of [1, 2, 3]) {
    for (const dia of dias) {
      while (minutos(ctx, dia) > ctx.perfil.duracaoMin) {
        const vol = contarVolume(dias)
        const trabalho = dia.itens.filter((i) => i.papel === 'trabalho')
        const cortaveis = trabalho.filter((i) => {
          if (i.fixo) return false
          const perde = i.series > 2 ? dia.ocorrencias : i.series * dia.ocorrencias
          if (i.series <= 2 && trabalho.length <= 1) return false
          return vol[i.ex.grupo] - perde >= piso(etapa, i.ex.grupo) - 1e-9 // frequência fracionada (C10)
        })
        if (!cortaveis.length) break
        // Ordem de corte: menos importante primeiro (core < isolado < composto; sem ênfase antes);
        // reduzir séries antes de tirar exercício; tirar de onde o dia está mais "repetido"
        // (ex: dois exercícios de perna num full body curto) e do grupo mais perto do alvo.
        const redundancia = (i: Item) => trabalho.filter((o) => o.ex.categoria === i.ex.categoria).length
        const proporcao = (i: Item) => vol[i.ex.grupo] / Math.max(1, alvos[i.ex.grupo])
        const chave = (i: Item) => [importancia(i), i.series > 2 ? 0 : 1, -redundancia(i), -proporcao(i), -i.series, -dia.itens.indexOf(i)]
        cortaveis.sort((a, b) => {
          const ka = chave(a)
          const kb = chave(b)
          for (let n = 0; n < ka.length; n++) if (ka[n] !== kb[n]) return ka[n] - kb[n]
          return 0
        })
        const alvo = cortaveis[0]
        if (alvo.series > 2) alvo.series--
        else dia.itens.splice(dia.itens.indexOf(alvo), 1)
      }
    }
  }
}

/**
 * Depois dos cortes, usa o tempo que sobrou em outros dias para chegar mais
 * perto do alvo de cada grupo (sem passar da duração de nenhum dia).
 */
function completarComSobra(ctx: ContextoMotor, dias: DiaTrabalho[], alvos: Record<Grupo, number>, sel: Seletor) {
  const cabe = (dia: DiaTrabalho, minutosExtras: number) => minutos(ctx, dia) + minutosExtras <= ctx.perfil.duracaoMin
  // dia em que um grupo mais importante ficou sem espaço: os menos importantes não usam a sobra dele
  const fechados = new Set<DiaTrabalho>()
  for (const g of ORDEM_PREENCHIMENTO) {
    let seguranca = 40
    const diasG = dias.filter((d) => !fechados.has(d) && (g === 'core' ? d.temCore : d.grupos.includes(g)))
    while (contarVolume(dias)[g] < alvos[g] && seguranca-- > 0) {
      // 1º: mais uma série num exercício do grupo que tenha menos de 4
      const comItem = diasG
        .flatMap((d) => d.itens.filter((i) => i.papel === 'trabalho' && i.ex.grupo === g && i.series < 4).map((i) => ({ d, i })))
        .find(({ d, i }) => cabe(d, MIN_POR_SERIE[i.ex.tipo]))
      if (comItem) {
        comItem.i.series++
        continue
      }
      // 2º: um exercício novo de 2 séries num dia com tempo livre
      const diaLivre = diasG.find((d) => cabe(d, 2 * MIN_POR_SERIE.composto))
      if (!diaLivre) {
        diasG.forEach((d) => fechados.add(d))
        break
      }
      const ex = sel.escolher(g, diaLivre)
      if (!ex) break
      if (!cabe(diaLivre, 2 * MIN_POR_SERIE[ex.tipo])) {
        sel.devolver(ex)
        break
      }
      diaLivre.itens.push({ ex, series: 2, papel: 'trabalho' })
      // o 1º exercício de empurrar com limitação de ombro traz o aquecimento específico junto
      if (minutos(ctx, diaLivre) > ctx.perfil.duracaoMin) {
        diaLivre.itens.pop()
        sel.devolver(ex)
        fechados.add(diaLivre)
        break
      }
    }
  }
}

/**
 * C13: usa o tempo escolhido. Depois de bater a meta semanal, se ainda sobra
 * tempo no treino, coloca mais exercícios nos músculos daquele treino (o que
 * tem menos exercícios primeiro; até 4 nos grandes e 3 nos pequenos) e depois
 * mais séries (até 4), sem passar da duração nem do teto semanal do músculo.
 * O dia de pernas do foco em superiores fica como está (uns 3 exercícios, C8).
 */
function encherTempo(ctx: ContextoMotor, dias: DiaTrabalho[], alvos: Record<Grupo, number>, sel: Seletor) {
  const enfase = gruposDaEnfase(ctx.perfil.enfases)
  const teto = (g: Grupo) => Math.max(alvos[g], Math.round(VOLUME_MAXIMO_GRANDE * (enfase.includes(g) ? MULT_ENFASE : 1)))
  const maxExercicios = (g: Grupo) => (GRANDES.includes(g) ? 4 : 3)
  const cabe = (dia: DiaTrabalho, extra: number) => minutos(ctx, dia) + extra <= ctx.perfil.duracaoMin
  for (const dia of dias) {
    if (dia.tipo === 'pernas' || dia.tipo === 'costas_biceps_pernas') continue
    const grupos = dia.grupos.filter((g) => (g === 'core' ? dia.temCore : alvos[g] > 0))
    const qtd = (g: Grupo) => dia.itens.filter((i) => i.papel === 'trabalho' && i.ex.grupo === g).length
    const esgotados = new Set<Grupo>()
    for (let seguranca = 0; seguranca < 30; seguranca++) {
      const vol = contarVolume(dias)
      const candidatos = grupos
        .filter((g) => !esgotados.has(g) && qtd(g) < maxExercicios(g) && vol[g] + 3 * dia.ocorrencias <= teto(g))
        .sort((a, b) => qtd(a) - qtd(b) || Number(enfase.includes(b)) - Number(enfase.includes(a)) || ORDEM_PREENCHIMENTO.indexOf(a) - ORDEM_PREENCHIMENTO.indexOf(b))
      let mudou = false
      for (const g of candidatos) {
        const ex = sel.escolher(g, dia)
        if (!ex) {
          esgotados.add(g)
          continue
        }
        if (!cabe(dia, 3 * MIN_POR_SERIE[ex.tipo])) {
          sel.devolver(ex)
          continue
        }
        dia.itens.push({ ex, series: 3, papel: 'trabalho' })
        if (minutos(ctx, dia) > ctx.perfil.duracaoMin) {
          dia.itens.pop()
          sel.devolver(ex)
          continue
        }
        mudou = true
        break
      }
      if (mudou) continue
      // sem espaço para exercício novo: mais uma série nos que têm menos de 4
      const vol2 = contarVolume(dias)
      const item = dia.itens.find((i) => i.papel === 'trabalho' && i.series < 4 && grupos.includes(i.ex.grupo) && vol2[i.ex.grupo] + dia.ocorrencias <= teto(i.ex.grupo) && cabe(dia, MIN_POR_SERIE[i.ex.tipo]))
      if (!item) break
      item.series++
    }
  }
}

// ───────────────────────── Readaptação (§6.1) ─────────────────────────

/**
 * C9: a readaptação monta o mesmo treino da fase normal (mesma divisão e
 * exercícios) e só reduz para 2 séries na 1ª semana e 3 depois (§6.1, A4).
 */
function aplicarReadaptacao(ctx: ContextoMotor, dias: DiaTrabalho[]) {
  const series = seriesReadaptacao(ctx.semanaReadaptacao)
  for (const dia of dias) for (const i of dia.itens) if (i.papel === 'trabalho') i.series = Math.min(i.series, series)
}

// ───────────────────── Aquecimento de ombro (§6.11) ─────────────────────

function aquecimentoOmbro(ctx: ContextoMotor): Exercicio[] {
  const ok = (id: string) => {
    const e = exercicioPorId(id)
    const aj = ctx.ajustes.get(id)
    return e && !aj?.indisponivel && !aj?.evitar ? e : undefined
  }
  const rotacao = ok('rotacao-externa-elastico') ?? ok('rotacao-externa-cabo')
  const face = ok('face-pull')
  return [rotacao, face].filter((e): e is Exercicio => !!e)
}

// ───────────────────── Ordenação (§6.4 + C4) ─────────────────────

/**
 * C4: o treino fica agrupado por músculo, como numa ficha de academia
 * (todo o peito, depois ombros, depois tríceps…):
 *  - aquecimento específico de ombro primeiro;
 *  - músculos grandes antes dos pequenos (bíceps, tríceps, panturrilha) e core no fim;
 *  - entre músculos do mesmo porte, os com ênfase primeiro e depois a ordem de ORDEM_PREENCHIMENTO;
 *  - dentro do músculo, composto antes de isolado (§6.4).
 */
function ordenar(enfases: Perfil['enfases'], itens: Item[]): Item[] {
  const enfase = gruposDaEnfase(enfases)
  const porte = (i: Item) => {
    if (i.papel === 'aquecimento_ombro') return -1
    if (i.ex.grupo === 'core') return 2
    return GRANDES.includes(i.ex.grupo) ? 0 : 1
  }
  return itens
    .map((i, pos) => ({ i, pos }))
    .sort(
      (a, b) =>
        porte(a.i) - porte(b.i) ||
        Number(enfase.includes(b.i.ex.grupo)) - Number(enfase.includes(a.i.ex.grupo)) ||
        ORDEM_PREENCHIMENTO.indexOf(a.i.ex.grupo) - ORDEM_PREENCHIMENTO.indexOf(b.i.ex.grupo) ||
        Number(isolado(a.i.ex)) - Number(isolado(b.i.ex)) ||
        a.pos - b.pos,
    )
    .map((x) => x.i)
}

// ───────────────────────── Gerar ─────────────────────────

export function gerarPlano(ctx: ContextoMotor): PlanoGerado {
  const { perfil, fase } = ctx
  // C10: a divisão tem `treinos` treinos diferentes, que se revezam nos dias da semana
  const divisao = definirDivisao({ diasSemana: perfil.treinos, nivel: perfil.nivel, enfases: perfil.enfases, fase, musculosPorTreino: perfil.musculosPorTreino })
  const personalizada = !!musculosValidos(perfil.musculosPorTreino, perfil.treinos)
  const vezesPorSemana = perfil.diasSemana / divisao.sequencia.length
  const avisos: string[] = []

  // um "dia de trabalho" por variante; variantes repetidas (A/B/A/B) são o mesmo treino
  const porVariante = new Map<string, DiaTrabalho>()
  divisao.sequencia.forEach((m, idx) => {
    const existente = porVariante.get(m.variante)
    if (existente) existente.ocorrencias++
    else porVariante.set(m.variante, { ...m, ocorrencias: 1, temCore: personalizada ? m.grupos.includes('core') : diaTemCore(idx, perfil.enfases, divisao.sequencia.length), itens: [] })
  })
  for (const d of porVariante.values()) d.ocorrencias *= vezesPorSemana
  const dias = [...porVariante.values()]
  const sel = new Seletor(ctx)
  // C14: exercícios incluídos pela pessoa entram primeiro e não são cortados
  for (const inc of ctx.incluidos ?? []) {
    const dia = porVariante.get(inc.variante)
    const ex = exercicioPorId(inc.exercicioId)
    if (!dia || !ex || dia.itens.some((i) => i.ex.id === ex.id) || !exercicioPermitido(ex, perfil.limitacoes, ctx.ajustes)) continue
    dia.itens.push({ ex, series: 3, papel: 'trabalho', fixo: true })
  }
  const { alvos, semEnfase } = calcularAlvos(ctx)

  // C8/C9: mesmo preenchimento nas duas fases; a readaptação só tem menos séries
  const alvosDoPlano = alvosDosDias(ctx, dias, alvos)
  if (personalizada) for (const g of TODOS_GRUPOS) if (!dias.some((d) => d.grupos.includes(g))) alvosDoPlano[g] = 0
  preencherVolume(dias, alvosDoPlano, sel, avisos)
  if (focoSuperior(perfil.enfases) || personalizada) garantirTodosOsGrupos(dias, sel)
  cortarAteCaber(ctx, dias, alvosDoPlano, semEnfase)
  if (focoSuperior(perfil.enfases) || personalizada) reequilibrarGrupos(ctx, dias, sel)
  completarComSobra(ctx, dias, alvosDoPlano, sel)
  encherTempo(ctx, dias, alvosDoPlano, sel)
  if (fase === 'readaptacao') aplicarReadaptacao(ctx, dias)

  // C15: excluídos pela pessoa saem do treino montado, sem nada no lugar
  for (const exc of ctx.excluidos ?? []) {
    const dia = porVariante.get(exc.variante)
    if (dia) dia.itens = dia.itens.filter((i) => i.ex.id !== exc.exercicioId)
  }
  for (const d of dias) {
    if (!(ctx.excluidos ?? []).some((e) => e.variante === d.variante)) continue
    const vazios = d.grupos.filter((g) => g !== 'core' && !d.itens.some((i) => i.ex.grupo === g))
    if (vazios.length) avisos.push(`${d.nome.split(' · ')[0]} ficou sem exercício de ${vazios.map((g) => NOME_GRUPO[g].toLowerCase()).join(', ')}.`)
  }

  // aquecimento específico de ombro nos dias com empurrar (§6.7, §6.11)
  const aquecOmbro = aquecimentoOmbro(ctx)
  for (const dia of dias) {
    if (precisaAquecimentoOmbro(ctx, dia)) {
      dia.itens.unshift(...aquecOmbro.map((ex) => ({ ex, series: AQUECIMENTO_OMBRO.series, papel: 'aquecimento_ombro' as const })))
    }
  }

  const volume = contarVolume(dias)
  if (fase === 'normal') {
    const abaixo = TODOS_GRUPOS.filter((g) => volume[g] + 1e-9 < Math.min(alvosDoPlano[g], VOLUME_MINIMO))
    if (abaixo.length) {
      avisos.push(
        `Com ${perfil.duracaoMin} min por treino, o volume semanal fica abaixo do recomendado para: ${abaixo.map((g) => NOME_GRUPO[g].toLowerCase()).join(', ')}.`,
      )
    }
  }

  // C11: treinos seguidos com o mesmo músculo: só avisa (a pessoa escolheu assim)
  if (personalizada) {
    divisao.sequencia.forEach((m, i) => {
      const prox = divisao.sequencia[(i + 1) % divisao.sequencia.length]
      if (prox === m) return
      const repetidos = m.grupos.filter((g) => g !== 'core' && prox.grupos.includes(g))
      if (repetidos.length && i + 1 < divisao.sequencia.length) {
        avisos.push(`${m.nome.split(' · ')[0]} e ${prox.nome.split(' · ')[0]} trabalham ${repetidos.map((g) => NOME_GRUPO[g].toLowerCase()).join(', ')}. Se forem em dias seguidos, esse músculo descansa menos de 48 h.`)
      }
    })
  }

  for (const d of dias) {
    const m = minutos(ctx, d)
    if (m > perfil.duracaoMin && d.itens.some((i) => i.fixo)) {
      avisos.push(`${d.nome.split(' · ')[0]} fica com ~${m} min por causa dos exercícios incluídos (seu tempo é de ${perfil.duracaoMin} min).`)
    }
  }

  const gerarDia = (d: DiaTrabalho): DiaGerado => ({
    variante: d.variante,
    grupos: d.grupos,
    nome: d.nome,
    tipo: d.tipo,
    minutosEstimados: minutos(ctx, d),
    exercicios: ordenar(perfil.enfases, d.itens).map((i) => {
      if (i.papel === 'aquecimento_ombro') {
        return { exercicioId: i.ex.id, papel: i.papel, series: i.series, repsMin: AQUECIMENTO_OMBRO.reps, repsMax: AQUECIMENTO_OMBRO.reps, descansoSeg: 0 }
      }
      const faixa = fase === 'readaptacao' ? FAIXA_READAPTACAO : FAIXA_NORMAL
      const pesoCorpo = i.ex.tipoCarga === 'pesoCorpo'
      return {
        exercicioId: i.ex.id,
        papel: i.papel,
        series: i.series,
        repsMin: pesoCorpo ? MINIMO_PESO_CORPO : faixa.min,
        repsMax: pesoCorpo ? (i.ex.tetoReps ?? FAIXA_NORMAL.max) : faixa.max,
        descansoSeg: descansoSegundos(perfil.objetivos, i.ex.tipo, perfil.sexo, fase),
        ...(textoAlerta(i.ex, perfil.limitacoes) ? { alerta: textoAlerta(i.ex, perfil.limitacoes) } : {}),
        ...(i.fixo ? { incluido: true } : {}),
      }
    }),
  })

  return {
    fase,
    divisao: divisao.nome,
    dias: divisao.sequencia.map((m) => gerarDia(porVariante.get(m.variante)!)),
    volume,
    alvos: alvosDoPlano,
    avisos,
  }
}

/** Séries semanais por grupo de um plano salvo (para mostrar na tela). */
export function volumeDoPlano(exercicios: { exercicioId: string; series: number; papel: string }[]): Record<Grupo, number> {
  const vol = zeros()
  for (const e of exercicios) {
    if (e.papel !== 'trabalho') continue
    const x = exercicioPorId(e.exercicioId)
    if (!x) continue
    vol[x.grupo] += e.series
    for (const s of x.gruposSecundarios) vol[s] += e.series * PESO_SECUNDARIO
  }
  return vol
}
