import { navegar } from '../app/rotas'
import { Botao, Cartao, Tela, Texto } from '../components/ui'

export function NaoEncontrada() {
  return (
    <Tela titulo="Página não encontrada">
      <Cartao>
        <Texto>Esse endereço não existe no app.</Texto>
        <Botao className="mt-3 w-full" onClick={() => navegar('/', { substituir: true })}>
          Ir para o início
        </Botao>
      </Cartao>
    </Tela>
  )
}
