import { db, obterConfiguracoes } from './banco'
import { dataLocal } from '../domain/datas'
import type { Perfil } from '../domain/tipos'

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
}

export async function atualizarPerfil(mudancas: Partial<DadosPerfil>) {
  const atual = await db.perfil.get('perfil')
  if (!atual) return
  await db.perfil.put({ ...atual, ...mudancas, atualizadoEm: new Date().toISOString() })
}
