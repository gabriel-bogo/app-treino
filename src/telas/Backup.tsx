import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { apagarTudo, atualizarConfiguracoes, db } from '../db/banco'
import { gerarBackup, nomeArquivoBackup, restaurarBackup, validarBackup, type ArquivoBackup, type ResumoBackup } from '../db/backup'
import { compartilharOuBaixar } from '../app/arquivos'
import { formatarData } from '../domain/datas'
import { navegar } from '../app/rotas'
import { Botao, Cartao, Tela, Texto } from '../components/ui'
import { Dialogo } from '../components/Dialogo'

export function Backup() {
  const config = useLiveQuery(() => db.configuracoes.get('app'))
  const entrada = useRef<HTMLInputElement>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [importacao, setImportacao] = useState<{ backup: ArquivoBackup; resumo: ResumoBackup } | null>(null)
  const [confirmarApagar, setConfirmarApagar] = useState(false)

  async function exportar() {
    setOcupado(true)
    setMensagem(null)
    try {
      const backup = await gerarBackup(db, __VERSAO_APP__)
      const resultado = await compartilharOuBaixar(JSON.stringify(backup), nomeArquivoBackup())
      if (resultado !== 'cancelado') {
        await atualizarConfiguracoes({ ultimoBackupEm: new Date().toISOString() })
        setMensagem({ tipo: 'ok', texto: 'Backup gerado. Guarde o arquivo num lugar seguro (Arquivos, iCloud, Drive, e-mail).' })
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível gerar o backup. Tente de novo.' })
    } finally {
      setOcupado(false)
    }
  }

  async function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    setMensagem(null)
    const resultado = validarBackup(await arquivo.text())
    if (entrada.current) entrada.current.value = ''
    if (!resultado.ok) {
      setMensagem({ tipo: 'erro', texto: resultado.erro })
      return
    }
    setImportacao({ backup: resultado.backup, resumo: resultado.resumo })
  }

  async function confirmarImportacao() {
    if (!importacao) return
    setOcupado(true)
    try {
      await restaurarBackup(db, importacao.backup)
      setImportacao(null)
      setMensagem({ tipo: 'ok', texto: 'Backup importado com sucesso.' })
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha ao importar. Seus dados anteriores não foram alterados.' })
    } finally {
      setOcupado(false)
    }
  }

  async function apagar() {
    await apagarTudo(db)
    setConfirmarApagar(false)
    navegar('/', { substituir: true })
  }

  const r = importacao?.resumo
  return (
    <Tela titulo="Backup" voltarPara="/mais">
      <Cartao titulo="Seus dados ficam só neste aparelho">
        <Texto>
          Se você trocar de celular, apagar o app ou limpar os dados do navegador, tudo some. O backup é um arquivo
          com todos os seus dados, que você guarda onde quiser.
        </Texto>
      </Cartao>

      {mensagem && (
        <Cartao destaque={mensagem.tipo === 'ok' ? 'sucesso' : 'perigo'}>
          <Texto>{mensagem.texto}</Texto>
        </Cartao>
      )}

      <Cartao titulo="Exportar">
        <Texto fraco>
          {config?.ultimoBackupEm ? `Último backup: ${formatarData(config.ultimoBackupEm)}` : 'Você ainda não fez nenhum backup.'}
        </Texto>
        <Botao className="mt-3 w-full" onClick={exportar} disabled={ocupado}>
          Exportar backup
        </Botao>
      </Cartao>

      <Cartao titulo="Importar">
        <Texto fraco>Escolha um arquivo app-treino-backup-…json. Antes de importar, o app mostra um resumo.</Texto>
        <input
          ref={entrada}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => aoEscolherArquivo(e.target.files?.[0])}
          data-testid="arquivo-backup"
        />
        <Botao variante="secundario" className="mt-3 w-full" onClick={() => entrada.current?.click()} disabled={ocupado}>
          Escolher arquivo de backup
        </Botao>
      </Cartao>

      <Cartao titulo="Apagar todos os dados" destaque="perigo">
        <Texto fraco>Remove perfil, treinos, histórico e registros deste aparelho. Faça um backup antes.</Texto>
        <Botao variante="perigo" className="mt-3 w-full" onClick={() => setConfirmarApagar(true)}>
          Apagar todos os dados
        </Botao>
      </Cartao>

      <Dialogo
        aberto={!!importacao}
        titulo="Importar este backup?"
        aoFechar={() => setImportacao(null)}
        acoes={
          <>
            <Botao variante="perigo" onClick={confirmarImportacao} disabled={ocupado}>
              Substituir tudo
            </Botao>
            <Botao variante="secundario" onClick={() => setImportacao(null)}>
              Cancelar
            </Botao>
          </>
        }
      >
        {r && (
          <>
            <p>Backup de {formatarData(r.exportadoEm)}.</p>
            <ul className="list-disc pl-5">
              <li>{r.temPerfil ? `Perfil: ${r.nomePerfil || 'sem nome'}` : 'Sem perfil'}</li>
              <li>
                {r.sessoes} {r.sessoes === 1 ? 'treino' : 'treinos'}
                {r.primeiraSessao && r.ultimaSessao && ` (${formatarData(r.primeiraSessao)} a ${formatarData(r.ultimaSessao)})`}
              </li>
              <li>{r.registrosCorpo} registros de peso/cintura</li>
            </ul>
            <p className="font-medium">Todos os dados atuais deste aparelho serão substituídos.</p>
          </>
        )}
      </Dialogo>

      <Dialogo
        aberto={confirmarApagar}
        titulo="Apagar todos os dados?"
        aoFechar={() => setConfirmarApagar(false)}
        acoes={
          <>
            <Botao variante="perigo" onClick={apagar}>
              Sim, apagar tudo
            </Botao>
            <Botao variante="secundario" onClick={() => setConfirmarApagar(false)}>
              Cancelar
            </Botao>
          </>
        }
      >
        <p>Isso não pode ser desfeito. Só continue se tiver um backup ou não precisar mais dos dados.</p>
      </Dialogo>
    </Tela>
  )
}
