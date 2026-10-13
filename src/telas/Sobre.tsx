import { Cartao, Tela, Texto } from '../components/ui'
import { AVISO_SAUDE, CREDITOS_DATASET } from '../app/textos'

export function Sobre() {
  return (
    <Tela titulo="Sobre" voltarPara="/mais">
      <Cartao titulo="Aviso de saúde" destaque="aviso">
        <Texto>{AVISO_SAUDE}</Texto>
      </Cartao>
      <Cartao titulo="Privacidade">
        <Texto>
          Sem cadastro, sem login, sem propaganda e sem servidor. Todos os seus dados ficam só neste aparelho.
          Faça backup de vez em quando em Mais › Backup.
        </Texto>
      </Cartao>
      <Cartao titulo="Créditos">
        <Texto>{CREDITOS_DATASET}</Texto>
      </Cartao>
      <Cartao titulo="Código aberto">
        <Texto>
          Licença MIT. Qualquer pessoa pode copiar, publicar a própria versão e usar. Código em
          github.com/gabriel-bogo/app-treino.
        </Texto>
        <Texto fraco>Versão {__VERSAO_APP__}</Texto>
      </Cartao>
    </Tela>
  )
}
