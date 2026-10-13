import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { atualizarPerfil } from '../db/perfil'
import { navegar } from '../app/rotas'
import { dataLocal, formatarData, idadeEm } from '../domain/datas'
import { lerNumero, validarDadosPessoais, validarTreino, type ErrosPerfil, type RascunhoPerfil } from '../domain/perfil'
import { Botao, Cartao, ItemLista, Lista, Tela, Texto } from '../components/ui'
import { CampoN, CamposLimitacoes, CamposPessoais, CamposTreino } from '../components/FormPerfil'

// Tela de perfil (§3 tela 7): tudo editável depois do onboarding.
export function Perfil() {
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const marcados = useLiveQuery(() => db.ajustesExercicio.filter((a) => !!a.indisponivel || !!a.evitar).count()) ?? 0
  const [r, setR] = useState<RascunhoPerfil | null>(null)
  const [textos, setTextos] = useState({ altura: '', peso: '' })
  const [erros, setErros] = useState<ErrosPerfil>({})
  const [salvo, setSalvo] = useState(false)
  const hoje = dataLocal()

  useEffect(() => {
    if (perfil && !r) {
      const { id: _id, criadoEm: _c, atualizadoEm: _a, avisoSaudeAceitoEm: _v, ...resto } = perfil
      setR(resto)
      setTextos({ altura: String(perfil.alturaCm), peso: String(perfil.pesoInicialKg).replace('.', ',') })
    }
  }, [perfil, r])

  if (!perfil || !r) return <Tela titulo="Perfil" voltarPara="/mais">{null}</Tela>

  const mudar = (m: RascunhoPerfil) => {
    setSalvo(false)
    setR((x) => ({ ...x!, ...m }))
  }

  async function salvar() {
    const comNumeros = { ...r!, alturaCm: lerNumero(textos.altura), pesoInicialKg: lerNumero(textos.peso) }
    const e = { ...validarDadosPessoais(comNumeros, hoje), ...validarTreino(comNumeros) }
    setErros(e)
    if (Object.keys(e).length) {
      window.scrollTo(0, 0)
      return
    }
    await atualizarPerfil({ ...comNumeros, nome: comNumeros.nome!.trim() } as Parameters<typeof atualizarPerfil>[0])
    setSalvo(true)
  }

  return (
    <Tela titulo="Perfil" voltarPara="/mais">
      <Texto fraco>
        {idadeEm(perfil.nascimento, hoje)} anos · aviso de saúde aceito em {formatarData(perfil.avisoSaudeAceitoEm)}
      </Texto>
      <Cartao titulo="Dados pessoais">
        <div className="flex flex-col gap-5">
          <CamposPessoais r={r} mudar={mudar} textos={textos} setTextos={(t) => (setSalvo(false), setTextos(t))} erros={erros} hoje={hoje} />
          <Texto fraco>O peso aqui é o peso inicial. Para registrar o peso de hoje, use a aba Saúde.</Texto>
        </div>
      </Cartao>
      <Cartao titulo="Treino">
        <div className="flex flex-col gap-5">
          <CamposTreino r={r} mudar={mudar} erros={erros} hoje={hoje} />
          <CampoN r={r} mudar={mudar} />
        </div>
      </Cartao>
      <Cartao titulo="Limitações">
        <div className="flex flex-col gap-4">
          <CamposLimitacoes r={r} mudar={mudar} />
        </div>
      </Cartao>
      <Lista>
        <ItemLista
          titulo="Equipamentos indisponíveis e exercícios a evitar"
          subtitulo={marcados ? `${marcados} exercício(s) marcado(s)` : 'Nenhum marcado'}
          onClick={() => navegar('/biblioteca')}
        />
      </Lista>
      {salvo && (
        <Cartao destaque="sucesso">
          <Texto>Perfil salvo. O plano é atualizado a partir do próximo treino.</Texto>
        </Cartao>
      )}
      <Botao grande onClick={salvar}>
        Salvar alterações
      </Botao>
    </Tela>
  )
}
