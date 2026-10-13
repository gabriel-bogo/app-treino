import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { acompanharTemaDoSistema, aplicarTema } from './app/tema'
import { pedirArmazenamentoPersistente } from './app/plataforma'

aplicarTema()
acompanharTemaDoSistema()
// Seção 2 (iPhone): pedir armazenamento persistente para o navegador não apagar os dados.
void pedirArmazenamentoPersistente()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
