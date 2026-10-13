// Substituir exercício durante o treino (§6.10).
// Regras para gerar candidatos:
// 1. Mesmo músculo primário do original
// 2. Excluir o original e todos os exercícios do treino do dia (feitos e pendentes)
// 3. Respeitar limitações (§6.7) e exercícios indisponíveis/evitar
// 4. Ordenar: mesmo padrão > mesmo tipo > nível compatível
// 5. Motivo "aparelho ocupado" ou "não tem o equipamento": equipamento
//    diferente do original vem primeiro
// 6. Sem candidato com o mesmo músculo primário: usa exercícios em que ele é
//    secundário; se ainda assim não houver, oferecer "Pular exercício"

import type { AjusteExercicio, Exercicio, Limitacao, MotivoTroca, Nivel } from '../tipos'
import { BIBLIOTECA, comMaquina, exercicioPermitido } from '../biblioteca'
import { niveisCompativeis } from '../motor/regras'

export type FiltroEquipamento = 'todos' | 'com_maquina' | 'sem_maquina'

export interface ResultadoCandidatos {
  /** até 3 sugestões */
  sugestoes: Exercicio[]
  /** lista completa ("ver todos"), já filtrada pelas mesmas regras */
  todos: Exercicio[]
  /** não havia com o mesmo músculo primário; vieram de músculo secundário */
  porSecundario: boolean
}

export function candidatosSubstituicao(params: {
  original: Exercicio
  motivo: MotivoTroca
  /** ids de todos os exercícios do treino do dia (inclui originais já trocados) */
  idsDoDia: string[]
  limitacoes: Limitacao[]
  ajustes: Map<string, AjusteExercicio>
  nivel: Nivel
  filtro?: FiltroEquipamento
  biblioteca?: Exercicio[]
}): ResultadoCandidatos {
  const { original, motivo, limitacoes, ajustes, nivel, filtro = 'todos' } = params
  const lista = params.biblioteca ?? BIBLIOTECA
  const excluir = new Set([original.id, ...params.idsDoDia])
  const compativeis = niveisCompativeis(nivel)

  const base = (e: Exercicio) =>
    !excluir.has(e.id) &&
    !e.soAquecimento &&
    exercicioPermitido(e, limitacoes, ajustes) &&
    (filtro === 'todos' || (filtro === 'com_maquina' ? comMaquina(e.equipamento) : !comMaquina(e.equipamento)))

  const ordenar = (arr: Exercicio[]) => {
    const equipamentoPrimeiro = motivo === 'ocupado' || motivo === 'sem_equipamento'
    const chave = (e: Exercicio) => [
      equipamentoPrimeiro && e.equipamento === original.equipamento ? 1 : 0,
      e.padrao === original.padrao ? 0 : 1,
      e.tipo === original.tipo ? 0 : 1,
      compativeis.includes(e.nivel) ? 0 : 1,
      e.prioridade,
    ]
    return [...arr].sort((a, b) => {
      const ka = chave(a)
      const kb = chave(b)
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]
      return a.id.localeCompare(b.id)
    })
  }

  let todos = ordenar(lista.filter((e) => base(e) && e.grupo === original.grupo))
  let porSecundario = false
  if (!todos.length) {
    todos = ordenar(lista.filter((e) => base(e) && e.gruposSecundarios.includes(original.grupo)))
    porSecundario = todos.length > 0
  }
  return { sugestoes: todos.slice(0, 3), todos, porSecundario }
}
