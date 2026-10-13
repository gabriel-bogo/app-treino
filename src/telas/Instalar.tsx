import { Cartao, Tela, Texto } from '../components/ui'
import { ehIOS, estaInstalado } from '../app/plataforma'

// Tela de ajuda de instalação (seção 2: "Criar uma tela de ajuda explicando isso").
export function Instalar() {
  const instalado = estaInstalado()
  const ios = ehIOS()
  return (
    <Tela titulo="Como instalar" voltarPara="/mais">
      {instalado && (
        <Cartao destaque="sucesso">
          <Texto>Você já está usando o app instalado. Ele funciona sem internet.</Texto>
        </Cartao>
      )}
      <Cartao titulo="iPhone (Safari)" className={ios ? 'ring-2 ring-emerald-500' : ''}>
        <ol className="list-decimal space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>Abra o link do app no <strong>Safari</strong> (não funciona pelo Chrome no iPhone).</li>
          <li>
            Toque no botão <strong>Compartilhar</strong> (o quadrado com a seta para cima, na barra de baixo).
          </li>
          <li>
            Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.
          </li>
          <li>Toque em <strong>Adicionar</strong>. O ícone aparece junto com seus outros apps.</li>
          <li>Abra sempre pelo ícone. Depois da primeira abertura, funciona sem internet.</li>
        </ol>
      </Cartao>
      <Cartao titulo="Android (Chrome)" className={!ios ? 'ring-2 ring-emerald-500' : ''}>
        <ol className="list-decimal space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>Abra o link do app no <strong>Chrome</strong>.</li>
          <li>
            Toque no menu <strong>⋮</strong> (canto superior direito).
          </li>
          <li>
            Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
          </li>
          <li>Confirme. Abra sempre pelo ícone.</li>
        </ol>
      </Cartao>
      <Cartao titulo="Importante">
        <Texto>
          Os dados ficam só neste aparelho. Se você apagar o app da tela de início ou limpar os dados do navegador,
          eles somem. Faça backup regularmente em Mais › Backup.
        </Texto>
      </Cartao>
    </Tela>
  )
}
