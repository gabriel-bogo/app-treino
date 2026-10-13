import { navegar } from '../app/rotas'
import { ItemLista, Lista, Tela } from '../components/ui'

export function Mais() {
  return (
    <Tela titulo="Mais">
      <Lista>
        <ItemLista titulo="Biblioteca de exercícios" subtitulo="Como fazer, indisponíveis, incrementos" onClick={() => navegar('/biblioteca')} />
        <ItemLista titulo="Perfil" subtitulo="Seus dados e preferências de treino" onClick={() => navegar('/perfil')} />
        <ItemLista titulo="Backup" subtitulo="Exportar e importar seus dados" onClick={() => navegar('/backup')} />
        <ItemLista titulo="Aparência e som" subtitulo="Modo claro, escuro ou automático" onClick={() => navegar('/configuracoes')} />
      </Lista>
      <Lista>
        <ItemLista titulo="Como instalar" subtitulo="iPhone e Android" onClick={() => navegar('/instalar')} />
        <ItemLista titulo="Sobre" subtitulo="Aviso de saúde, privacidade e créditos" onClick={() => navegar('/sobre')} />
      </Lista>
    </Tela>
  )
}
