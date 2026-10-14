import { db, obterConfiguracoes } from './banco'
import { dataLocal } from '../domain/datas'
import type { Grupo, Perfil } from '../domain/tipos'
import { garantirPlano } from './plano'

export type DadosPerfil = Omit<Perfil, 'id' | 'criadoEm' | 'atualizadoEm'>

/** Fim do onboarding: grava o perfil e o peso inicial como primeiro registro de peso (§4, §10). */
export async function salvarPerfilInicial(dados: DadosPerfil, agora: Date = new Date()) {
  const iso = agora.toISOString()
  await db.transaction('rw', db.perfil, db.registrosCorpo, db.configuracoes, async () => {
    await obterConfiguracoes()
    await db.perfil.put({ ...dados, id: 'perfil', criadoEm: iso, atualizadoEm: iso })
    const hoje = dataLocal(agora)
    const existente = await db.registrosCorpo.get(hoje)
    await db.registrosCorpo.put({ ...existente, data: hoje, pesoKg: dados.pesoInicialKg })
  })
  await garantirPlano(agora)
}

export async function atualizarPerfil(mudancas: Partial<DadosPerfil>) {
  const atual = await db.perfil.get('perfil')
  if (!atual) return
  const novo = { ...atual, ...mudancas, atualizadoEm: new Date().toISOString() }
  // C11: mudou o que define a divisão → os músculos escolhidos por treino deixam de valer
  const mudouDivisao = (['nivel', 'diasSemana', 'treinos'] as const).some((k) => novo[k] !== atual[k]) || [...novo.enfases].sort().join() !== [...atual.enfases].sort().join()
  if (mudouDivisao && !('musculosPorTreino' in mudancas)) delete novo.musculosPorTreino
  await db.perfil.put(novo)
  await garantirPlano()
}

/**
 * C11: define os músculos de um treino (índice 0 = A). Os outros treinos
 * ficam como estão no plano atual. `null` volta tudo ao que o app sugere.
 */
export async function definirMusculosDoTreino(indice: number, grupos: Grupo[] | null, atuaisPorTreino: Grupo[][]) {
  const perfil = await db.perfil.get('perfil')
  if (!perfil) return
  const musculosPorTreino = grupos ? atuaisPorTreino.map((g, i) => (i === indice ? grupos : g)) : undefined
  await db.perfil.put({ ...perfil, musculosPorTreino, atualizadoEm: new Date().toISOString() })
  await garantirPlano()
}
