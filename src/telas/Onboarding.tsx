import { useState } from 'react'
import { AVISO_SAUDE } from '../app/textos'
import { navegar } from '../app/rotas'
import { dataLocal } from '../domain/datas'
import { salvarPerfilInicial } from '../db/perfil'
import { DURACAO, lerNumero, validarDadosPessoais, validarTreino, type ErrosPerfil, type RascunhoPerfil } from '../domain/perfil'
import { Botao, Cartao, Texto } from '../components/ui'
import { CamposPessoais, CamposTreino, CamposLimitacoes } from '../components/FormPerfil'

// Onboarding (§3 tela 1, §4): aviso de saúde com aceite obrigatório,
// dados pessoais, preferências de treino e limitações.

const PASSOS = ['Boas-vindas', 'Sobre você', 'Seu treino', 'Limitações'] as const

export function Onboarding() {
  const [passo, setPasso] = useState(0)
  const [aceite, setAceite] = useState(false)
  const [r, setR] = useState<RascunhoPerfil>({ limitacoes: [], nConfirmacoes: 2, objetivos: [], enfases: [], duracaoMin: DURACAO.padrao })
  const [textos, setTextos] = useState({ altura: '', peso: '' })
  const [erros, setErros] = useState<ErrosPerfil>({})
  const [salvando, setSalvando] = useState(false)
  const hoje = dataLocal()

  const mudar = (m: RascunhoPerfil) => setR((x) => ({ ...x, ...m }))

  function avancar() {
    if (passo === 1) {
      const comNumeros = { ...r, alturaCm: lerNumero(textos.altura), pesoInicialKg: lerNumero(textos.peso) }
      const e = validarDadosPessoais(comNumeros, hoje)
      setErros(e)
      if (Object.keys(e).length) return
      setR(comNumeros)
    }
    if (passo === 2) {
      const e = validarTreino(r)
      setErros(e)
      if (Object.keys(e).length) return
    }
    setErros({})
    setPasso((p) => p + 1)
    window.scrollTo(0, 0)
  }

  async function concluir() {
    setSalvando(true)
    // vai para a proposta do plano antes de salvar: assim que o perfil existe ela aparece (C5)
    navegar('/plano/proposta', { substituir: true })
    await salvarPerfilInicial({
      nome: r.nome!.trim(),
      sexo: r.sexo!,
      nascimento: r.nascimento!,
      alturaCm: r.alturaCm!,
      pesoInicialKg: r.pesoInicialKg!,
      nivel: r.nivel!,
      objetivos: r.objetivos!,
      enfases: r.enfases ?? [],
      diasSemana: r.diasSemana!,
      treinos: r.treinos!,
      duracaoMin: r.duracaoMin!,
      limitacoes: r.limitacoes ?? [],
      nConfirmacoes: r.nConfirmacoes ?? 2,
      avisoSaudeAceitoEm: new Date().toISOString(),
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header className="pt-seguro px-4 pb-2">
        <div className="flex gap-1" aria-hidden="true">
          {PASSOS.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Passo {passo + 1} de {PASSOS.length}: {PASSOS[passo]}
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-4 py-4">
        {passo === 0 && (
          <>
            <h1 className="text-3xl font-bold">Bem-vindo ao App Treino</h1>
            <Texto>
              O app monta seu treino automaticamente, registra cargas e repetições e sugere quando progredir. Tudo fica só no
              seu celular: sem cadastro, sem login, sem internet.
            </Texto>
            <Cartao titulo="Aviso de saúde" destaque="aviso">
              <Texto>{AVISO_SAUDE}</Texto>
              <label className="mt-3 flex min-h-12 items-center gap-3 font-medium">
                <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="h-6 w-6 accent-emerald-600" />
                Li e entendi o aviso
              </label>
            </Cartao>
            <Botao grande disabled={!aceite} onClick={avancar}>
              Começar
            </Botao>
            <Botao variante="fantasma" onClick={() => navegar('/backup')}>
              Já tenho um backup
            </Botao>
          </>
        )}

        {passo === 1 && (
          <>
            <h1 className="text-2xl font-bold">Sobre você</h1>
            <CamposPessoais r={r} mudar={mudar} textos={textos} setTextos={setTextos} erros={erros} />
          </>
        )}

        {passo === 2 && (
          <>
            <h1 className="text-2xl font-bold">Seu treino</h1>
            <CamposTreino r={r} mudar={mudar} erros={erros} hoje={hoje} />
          </>
        )}

        {passo === 3 && (
          <>
            <h1 className="text-2xl font-bold">Alguma limitação?</h1>
            <CamposLimitacoes r={r} mudar={mudar} />
          </>
        )}

        {passo > 0 && (
          <div className="mt-auto flex gap-2 pb-seguro">
            <Botao variante="secundario" className="flex-1" onClick={() => setPasso((p) => p - 1)}>
              Voltar
            </Botao>
            {passo < PASSOS.length - 1 ? (
              <Botao className="flex-[2]" onClick={avancar}>
                Continuar
              </Botao>
            ) : (
              <Botao className="flex-[2]" onClick={concluir} disabled={salvando}>
                Criar meu plano
              </Botao>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
