import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { precisaLembrarBackup } from '../db/backup'
import { navegar } from '../app/rotas'
import { Botao, Cartao, Texto } from './ui'

/** Card na tela inicial quando o último backup tem mais de 14 dias (§8). */
export function LembreteBackup() {
  const config = useLiveQuery(() => db.configuracoes.get('app'))
  if (!config || !precisaLembrarBackup(config)) return null
  return (
    <Cartao destaque="aviso" titulo="Hora de fazer backup">
      <Texto>
        {config.ultimoBackupEm ? 'Seu último backup tem mais de 14 dias.' : 'Você ainda não fez nenhum backup.'} Seus dados
        ficam só neste aparelho.
      </Texto>
      <Botao variante="secundario" className="mt-3 w-full" onClick={() => navegar('/backup')}>
        Fazer backup agora
      </Botao>
    </Cartao>
  )
}
