// Gera a biblioteca de exercícios do app a partir do Free Exercise DB.
//
//   node scripts/curadoria/gerar.ts
//
// - baixa o dataset (fixado num commit, para o resultado ser reproduzível)
// - baixa as imagens dos exercícios escolhidos, reduz para 480 px e converte
//   para WebP em public/exercises/<id>/
// - completa os campos (incremento de carga, substitutos) e valida tudo
// - grava src/data/exercises.ptbr.json, docs/biblioteca.md e
//   docs/contraindicacoes.md
//
// Roda só na hora de montar a biblioteca. O app nunca acessa a internet.

import { mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'
import { ENTRADAS, type Entrada } from './dados.ts'
import type { Exercicio, Grupo, Limitacao } from '../../src/domain/tipos.ts'

const COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
const BASE = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}`
const CACHE = 'scripts/curadoria/.cache'
const PASTA_IMAGENS = 'public/exercises'
const SAIDA_JSON = 'src/data/exercises.ptbr.json'

const ORDEM_GRUPOS: Grupo[] = ['peito', 'costas', 'ombros', 'quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'biceps', 'triceps', 'core']
const NOME_GRUPO: Record<Grupo, string> = {
  peito: 'Peito', costas: 'Costas', ombros: 'Ombros', quadriceps: 'Quadríceps', posteriores: 'Posteriores de coxa',
  gluteos: 'Glúteos', panturrilha: 'Panturrilha', biceps: 'Bíceps', triceps: 'Tríceps', core: 'Core / abdômen',
}
const NIVEL: Record<string, Exercicio['nivel']> = { beginner: 'iniciante', intermediate: 'intermediario', expert: 'avancado' }

interface ItemDataset {
  id: string
  name: string
  level: string
  images: string[]
}

async function existe(caminho: string) {
  try {
    await access(caminho)
    return true
  } catch {
    return false
  }
}

async function baixar(url: string, destino: string): Promise<Buffer> {
  if (await existe(destino)) return readFile(destino)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Falha ao baixar ${url}: ${resp.status}`)
  const buf = Buffer.from(await resp.arrayBuffer())
  await mkdir(dirname(destino), { recursive: true })
  await writeFile(destino, buf)
  return buf
}

/** §5 / A9: incremento padrão na unidade do campo de carga. */
function incrementoPadrao(e: Entrada): number {
  const inferior = e.cat === 'legs'
  switch (e.carga) {
    case 'total':
      return inferior ? 4 : 2
    case 'porHalter':
      return 2
    case 'porLado':
      return inferior ? 2 : 1
    case 'pesoCorpo':
      return 2
  }
}

function erro(msg: string): never {
  throw new Error(msg)
}

async function main() {
  const dataset: ItemDataset[] = JSON.parse((await baixar(`${BASE}/dist/exercises.json`, join(CACHE, 'exercises.json'))).toString())
  const porId = new Map(dataset.map((d) => [d.id, d]))

  // ── validações das entradas ──
  const ids = new Set<string>()
  for (const e of ENTRADAS) {
    if (ids.has(e.id)) erro(`id repetido: ${e.id}`)
    ids.add(e.id)
    if (e.origem && !porId.has(e.origem)) erro(`${e.id}: origem "${e.origem}" não existe no dataset`)
    if (e.passos.length < 3 || e.passos.length > 5) erro(`${e.id}: precisa de 3 a 5 passos`)
    if (e.erros.length < 1 || e.erros.length > 2) erro(`${e.id}: precisa de 1 ou 2 erros comuns`)
  }
  for (const e of ENTRADAS) {
    for (const ref of [e.maisDificil, ...(e.assistida ?? [])]) {
      if (ref && !ids.has(ref)) erro(`${e.id}: referência a "${ref}" que não existe`)
    }
  }

  // ── imagens ──
  await rm(PASTA_IMAGENS, { recursive: true, force: true })
  const imagensPorId = new Map<string, string[]>()
  for (const e of ENTRADAS) {
    if (!e.origem) {
      imagensPorId.set(e.id, [])
      continue
    }
    const origem = porId.get(e.origem)!
    const saidas: string[] = []
    for (let i = 0; i < origem.images.length; i++) {
      const bruto = await baixar(`${BASE}/exercises/${origem.images[i]}`, join(CACHE, 'img', origem.images[i]))
      const nome = `${e.id}/${i}.webp`
      await mkdir(join(PASTA_IMAGENS, e.id), { recursive: true })
      await sharp(bruto).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 70 }).toFile(join(PASTA_IMAGENS, nome))
      saidas.push(nome)
    }
    imagensPorId.set(e.id, saidas)
  }

  // ── monta os exercícios ──
  const exercicios: Exercicio[] = ENTRADAS.map((e) => {
    const origem = e.origem ? porId.get(e.origem) : undefined
    const ex: Exercicio = {
      id: e.id,
      nome: e.nome,
      nomeOriginal: origem?.name ?? e.nome,
      grupo: e.grupo,
      gruposSecundarios: e.sec ?? [],
      categoria: e.cat,
      equipamento: e.eq,
      tipo: e.tipo,
      padrao: e.padrao,
      nivel: e.nivel ?? (origem ? NIVEL[origem.level] : 'iniciante'),
      tipoCarga: e.carga,
      unilateral: e.uni ?? false,
      incrementoCarga: incrementoPadrao(e),
      contraindicacoes: (e.contra ?? []).map(([limitacao, nivel]) => ({ limitacao, nivel })),
      substitutos: [],
      imagens: imagensPorId.get(e.id) ?? [],
      passos: e.passos,
      errosComuns: e.erros,
      prioridade: e.prio,
    }
    if (e.ombroOk) ex.amigavelOmbro = true
    if (e.teto) ex.tetoReps = e.teto
    if (e.maisDificil) ex.variacaoMaisDificil = e.maisDificil
    if (e.assistida) ex.versaoAssistida = e.assistida
    if (e.assistido) ex.assistido = true
    if (e.soAquecimento) ex.soAquecimento = true
    return ex
  })

  // substitutos (§5): mesmo grupo; mesmo padrão primeiro, depois mesmo tipo, depois prioridade
  for (const ex of exercicios) {
    if (ex.soAquecimento) continue
    ex.substitutos = exercicios
      .filter((o) => o.id !== ex.id && o.grupo === ex.grupo && !o.soAquecimento)
      .sort(
        (a, b) =>
          Number(b.padrao === ex.padrao) - Number(a.padrao === ex.padrao) ||
          Number(b.tipo === ex.tipo) - Number(a.tipo === ex.tipo) ||
          a.prioridade - b.prioridade,
      )
      .slice(0, 4)
      .map((o) => o.id)
  }

  exercicios.sort((a, b) => ORDEM_GRUPOS.indexOf(a.grupo) - ORDEM_GRUPOS.indexOf(b.grupo) || a.prioridade - b.prioridade)

  await mkdir(dirname(SAIDA_JSON), { recursive: true })
  await writeFile(SAIDA_JSON, JSON.stringify(exercicios, null, 1) + '\n')

  // ── documentos para revisão ──
  const linhas = ['# Biblioteca de exercícios', '', `Gerado por \`scripts/curadoria/gerar.ts\` a partir do Free Exercise DB (commit \`${COMMIT.slice(0, 7)}\`, licença Unlicense). ${exercicios.length} exercícios.`, '']
  for (const g of ORDEM_GRUPOS) {
    linhas.push(`## ${NOME_GRUPO[g]}`, '', '| Exercício | Equipamento | Tipo | Nível | Carga |', '|---|---|---|---|---|')
    for (const ex of exercicios.filter((x) => x.grupo === g)) {
      linhas.push(`| ${ex.nome}${ex.soAquecimento ? ' (só aquecimento)' : ''} | ${ex.equipamento} | ${ex.tipo} | ${ex.nivel} | ${ex.tipoCarga} |`)
    }
    linhas.push('')
  }
  await writeFile('docs/biblioteca.md', linhas.join('\n'))

  const lims: Limitacao[] = ['ombro', 'joelho', 'lombar', 'punho']
  const doc = [
    '# Contraindicações por limitação (§6.7)',
    '',
    '> **Forte**: o app não sugere o exercício (nem no plano, nem na troca). **Leve**: sugere com alerta visual e carga conservadora (menor incremento e N+1 treinos para confirmar cada degrau).',
    '>',
    '> A lista de **ombro** segue a especificação. As de **joelho, lombar e punho** são uma **proposta para revisão**, baseada em prática geral de treino. Não é prescrição: confirme com seu fisioterapeuta. Para mudar, edite `scripts/curadoria/dados.ts` e rode `node scripts/curadoria/gerar.ts`.',
    '',
  ]
  for (const l of lims) {
    const fortes = exercicios.filter((x) => x.contraindicacoes.some((c) => c.limitacao === l && c.nivel === 'forte'))
    const leves = exercicios.filter((x) => x.contraindicacoes.some((c) => c.limitacao === l && c.nivel === 'leve'))
    doc.push(`## ${l[0].toUpperCase() + l.slice(1)}`, '')
    doc.push(`**Forte (não sugerir):** ${fortes.map((x) => x.nome).join(', ') || 'nenhum'}`, '')
    doc.push(`**Leve (alerta + carga conservadora):** ${leves.map((x) => x.nome).join(', ') || 'nenhum'}`, '')
  }
  doc.push(
    '## Regras extras do ombro (§6.7)',
    '',
    '- Preferência por halteres e pegada neutra nos exercícios de empurrar: ' +
      exercicios.filter((x) => x.amigavelOmbro).map((x) => x.nome).join(', ') + '.',
    '- Em todos os exercícios de empurrar (horizontal e vertical): incremento de carga menor e N+1 treinos para confirmar cada degrau.',
    '- Aquecimento específico obrigatório nos dias com empurrar: rotação externa com elástico ou polia (2×15) e face pull leve (2×15).',
    '',
  )
  await writeFile('docs/contraindicacoes.md', doc.join('\n'))

  const total = exercicios.reduce((s, x) => s + x.imagens.length, 0)
  console.log(`OK: ${exercicios.length} exercícios, ${total} imagens em ${PASTA_IMAGENS}/`)
}

await main()
