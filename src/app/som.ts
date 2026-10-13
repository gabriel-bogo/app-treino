// Som do fim do descanso (§2: timer visual + som, com o app aberto).
// Usa Web Audio (gerado na hora, sem arquivo). No iPhone o áudio só é
// liberado depois de um toque do usuário, por isso "desbloquear" é chamado
// ao marcar a série. Com o iPhone no modo silencioso o som pode não tocar;
// o aviso visual continua.

let contexto: AudioContext | null = null

function obterContexto(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    contexto ??= new Ctor()
    return contexto
  } catch {
    return null
  }
}

/** Chamar dentro de um toque (gesto do usuário). */
export function desbloquearAudio() {
  const ctx = obterContexto()
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {})
}

/** Três bipes curtos. */
export function tocarFimDescanso() {
  const ctx = obterContexto()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  const inicio = ctx.currentTime + 0.05
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator()
    const ganho = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = i === 2 ? 1175 : 880
    const t = inicio + i * 0.3
    ganho.gain.setValueAtTime(0.0001, t)
    ganho.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    osc.connect(ganho).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.25)
  }
  // Android vibra; iPhone ignora (sem suporte na web)
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    // sem vibração
  }
}
