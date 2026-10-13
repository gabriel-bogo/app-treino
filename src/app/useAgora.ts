import { useEffect, useState } from 'react'

/** Horário atual, atualizado a cada `intervaloMs` (para cronômetro e timer). */
export function useAgora(intervaloMs = 1000): Date {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), intervaloMs)
    const aoVoltar = () => setAgora(new Date())
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [intervaloMs])
  return agora
}
