import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { apagarTudo, db } from './banco'
import { garantirPlano, precisaReadaptacao, pularTreino, semanaDaReadaptacao } from './plano'
import type { Perfil, Sessao } from '../domain/tipos'

// Dados fictícios.
const perfil: Perfil = {
  id: 'perfil',
  nome: 'Pessoa Teste',
  sexo: 'masculino',
  nascimento: '1990-01-01',
  alturaCm: 175,
  pesoInicialKg: 75,
  nivel: 'intermediario',
  objetivos: ['hipertrofia'],
  enfases: [],
  diasSemana: 4,
  treinos: 4,
  duracaoMin: 60,
  limitacoes: [],
  nConfirmacoes: 2,
  avisoSaudeAceitoEm: '2026-01-01T00:00:00.000Z',
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
}

beforeEach(async () => {
  await apagarTudo()
})

describe('plano ativo', () => {
  it('cria o plano a partir do perfil', async () => {
    await db.perfil.put(perfil)
    await garantirPlano()
    const plano = await db.plano.get('atual')
    expect(plano?.fase).toBe('normal')
    expect(plano?.divisao).toBe('Superior / Inferior / Superior / Inferior')
    expect(await db.diasPlano.count()).toBe(4)
    expect(await db.exerciciosPlano.count()).toBeGreaterThan(8)
  })

  it('iniciante, retornando e obesidade II/III começam na readaptação (§6.1, §10)', () => {
    const hoje = '2026-06-01'
    expect(precisaReadaptacao({ ...perfil, nivel: 'iniciante' }, 75, hoje)).toBe(true)
    expect(precisaReadaptacao({ ...perfil, nivel: 'retornando' }, 75, hoje)).toBe(true)
    expect(precisaReadaptacao(perfil, 75, hoje)).toBe(false)
    expect(precisaReadaptacao(perfil, 110, hoje)).toBe(true) // IMC 35,9
  })

  it('só refaz o plano quando muda algo que o afeta e mantém a posição na sequência', async () => {
    await db.perfil.put(perfil)
    await garantirPlano()
    const antes = await db.plano.get('atual')
    await db.plano.put({ ...antes!, proximoIndice: 2 })
    await garantirPlano()
    expect((await db.plano.get('atual'))!.geradoEm).toBe(antes!.geradoEm)

    await db.perfil.put({ ...perfil, duracaoMin: 45, nome: 'Outro nome' })
    await garantirPlano(new Date(Date.now() + 1000))
    const depois = await db.plano.get('atual')
    expect(depois!.geradoEm).not.toBe(antes!.geradoEm)
    expect(depois!.proximoIndice).toBe(2)
  })

  it('desativar uma limitação volta ao plano normal no próximo treino (§6.7)', async () => {
    await db.perfil.put({ ...perfil, limitacoes: ['ombro'] })
    await garantirPlano()
    const comOmbro = await db.exerciciosPlano.toArray()
    expect(comOmbro.some((e) => e.papel === 'aquecimento_ombro')).toBe(true)
    await db.perfil.put(perfil)
    await garantirPlano()
    expect((await db.exerciciosPlano.toArray()).some((e) => e.papel === 'aquecimento_ombro')).toBe(false)
  })

  it('marcar exercício como indisponível refaz o plano sem ele', async () => {
    await db.perfil.put(perfil)
    await garantirPlano()
    expect((await db.exerciciosPlano.toArray()).some((e) => e.exercicioId === 'supino-reto-barra')).toBe(true)
    await db.ajustesExercicio.put({ exercicioId: 'supino-reto-barra', indisponivel: true })
    await garantirPlano()
    expect((await db.exerciciosPlano.toArray()).some((e) => e.exercicioId === 'supino-reto-barra')).toBe(false)
  })

  it('não mexe no plano com treino em andamento', async () => {
    await db.perfil.put(perfil)
    await garantirPlano()
    const antes = await db.plano.get('atual')
    const sessao: Sessao = {
      id: 's1',
      diaId: '0',
      nomeDia: 'Superior A',
      fase: 'normal',
      inicio: new Date().toISOString(),
      status: 'andamento',
      estado: { itens: [], atualUid: null, aquecimentoGeral: 'pendente', timer: null },
      substituicoes: [],
    }
    await db.sessoes.put(sessao)
    await db.perfil.put({ ...perfil, diasSemana: 2, treinos: 2 })
    await garantirPlano(new Date(Date.now() + 1000))
    expect((await db.plano.get('atual'))!.geradoEm).toBe(antes!.geradoEm)
    expect(await db.diasPlano.count()).toBe(4)
  })

  it('readaptação: semanas por treinos feitos e fim após 3 semanas de treino (A4)', async () => {
    expect(semanaDaReadaptacao(0, 3)).toBe(0)
    expect(semanaDaReadaptacao(3, 3)).toBe(1)
    expect(semanaDaReadaptacao(12, 6)).toBe(2) // C9: readaptação na divisão escolhida (6 dias)
    await db.perfil.put({ ...perfil, nivel: 'iniciante', diasSemana: 3, treinos: 3 })
    await garantirPlano()
    let plano = (await db.plano.get('atual'))!
    expect(plano.fase).toBe('readaptacao')
    await db.plano.put({ ...plano, treinosNaFase: 9 })
    await garantirPlano()
    plano = (await db.plano.get('atual'))!
    expect(plano.fase).toBe('normal')
    expect(plano.mensagemFase).toMatch(/Readaptação concluída/)
    expect(plano.divisao).toBe('Push / Pull / Legs')
  })

  it('C6: antes do primeiro treino, a fase acompanha o nível do perfil', async () => {
    await db.perfil.put({ ...perfil, nivel: 'iniciante', diasSemana: 5, treinos: 5 })
    await garantirPlano()
    expect((await db.plano.get('atual'))!.fase).toBe('readaptacao')
    expect(await db.diasPlano.count()).toBe(5)
    // na revisão do plano, a pessoa muda para intermediário
    await db.perfil.put({ ...perfil, nivel: 'intermediario', diasSemana: 5, treinos: 5 })
    await garantirPlano()
    const plano = (await db.plano.get('atual'))!
    expect(plano.fase).toBe('normal')
    expect(plano.divisao).toBe('Superior / Inferior / Push / Pull / Legs')
    expect(await db.diasPlano.count()).toBe(5)
    // depois do primeiro treino, mudar o nível não volta para a readaptação
    await db.sessoes.put({
      id: 's1',
      diaId: '0',
      nomeDia: 'Treino A · Superior',
      fase: 'normal',
      inicio: new Date().toISOString(),
      status: 'concluida',
      estado: { itens: [], atualUid: null, aquecimentoGeral: 'feito', timer: null },
      substituicoes: [],
    })
    await db.perfil.put({ ...perfil, nivel: 'iniciante', diasSemana: 5, treinos: 5 })
    await garantirPlano()
    expect((await db.plano.get('atual'))!.fase).toBe('normal')
  })

  it('C25: pular treino passa para o seguinte e volta ao A depois do último, sem contar como feito', async () => {
    await db.perfil.put(perfil) // 4 treinos
    await garantirPlano()
    const antes = (await db.plano.get('atual'))!
    expect(antes.proximoIndice).toBe(0)
    await pularTreino()
    expect((await db.plano.get('atual'))!.proximoIndice).toBe(1)
    await pularTreino()
    await pularTreino()
    await pularTreino()
    const depois = (await db.plano.get('atual'))!
    expect(depois.proximoIndice).toBe(0)
    expect(depois.treinosNaFase).toBe(antes.treinosNaFase)
  })

  it('revisa o volume a cada 3 semanas conforme a progressão (A3)', async () => {
    await db.perfil.put(perfil)
    const t0 = new Date('2026-03-01T12:00:00')
    await garantirPlano(t0)
    const peito = (await db.exerciciosPlano.toArray()).filter((e) => ['supino-reto-barra', 'supino-reto-halter'].includes(e.exercicioId))
    expect(peito.length).toBeGreaterThan(0)
    for (const e of peito) {
      await db.eventosProgressao.put({ id: e.id, exercicioId: e.exercicioId, data: '2026-03-10T12:00:00.000Z', tipo: 'aumento_reps', de: { carga: 40, alvo: 8 }, para: { carga: 40, alvo: 9 } })
    }
    await garantirPlano(new Date('2026-03-15T12:00:00'))
    expect((await db.plano.get('atual'))!.nivelVolume.peito).toBeUndefined()
    await garantirPlano(new Date('2026-03-23T12:00:00'))
    expect((await db.plano.get('atual'))!.nivelVolume.peito).toBe(10)
  })
})
