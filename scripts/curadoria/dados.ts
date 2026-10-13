// Curadoria da biblioteca de exercícios (§5 da especificação).
//
// Cada entrada aponta para um exercício do Free Exercise DB (campo `origem`,
// licença Unlicense) e acrescenta: nome popular no Brasil, passos e erros
// comuns em PT-BR, grupo muscular, padrão de movimento, tipo de carga etc.
//
// Para regerar src/data/exercises.ptbr.json e as imagens:
//   node scripts/curadoria/gerar.ts
//
// Contraindicações (§6.7): a lista de ombro segue a especificação. As de
// joelho, lombar e punho são uma PROPOSTA baseada em prática geral, para
// revisão (ver docs/contraindicacoes.md). Não é prescrição.

import type {
  Categoria,
  Equipamento,
  Grupo,
  Limitacao,
  NivelExercicio,
  Padrao,
  TipoCarga,
  TipoExercicio,
} from '../../src/domain/tipos.ts'

export interface Entrada {
  id: string
  /** id no Free Exercise DB; null = não existe no dataset (sem imagem) */
  origem: string | null
  nome: string
  grupo: Grupo
  sec?: Grupo[]
  cat: Categoria
  eq: Equipamento
  tipo: TipoExercicio
  padrao: Padrao
  carga: TipoCarga
  uni?: boolean
  prio: number
  /** sobrescreve o nível do dataset */
  nivel?: NivelExercicio
  contra?: [Limitacao, 'forte' | 'leve'][]
  ombroOk?: boolean
  teto?: number
  maisDificil?: string
  assistida?: string[]
  assistido?: boolean
  soAquecimento?: boolean
  passos: string[]
  erros: string[]
}

export const ENTRADAS: Entrada[] = [
  // ───────────────────────────── PEITO ─────────────────────────────
  {
    id: 'supino-reto-barra', origem: 'Barbell_Bench_Press_-_Medium_Grip', nome: 'Supino reto com barra',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'barra', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'porLado', prio: 1,
    contra: [['ombro', 'leve'], ['punho', 'leve']],
    passos: [
      'Deite no banco reto com os olhos abaixo da barra e os pés firmes no chão.',
      'Segure a barra com as mãos um pouco mais abertas que os ombros e tire-a do suporte com os braços estendidos.',
      'Desça a barra com controle até encostar de leve no meio do peito, cotovelos a uns 45° do tronco.',
      'Empurre a barra de volta até estender os braços.',
    ],
    erros: ['Quicar a barra no peito ou tirar o quadril do banco.', 'Abrir os cotovelos a 90° do tronco, o que sobrecarrega o ombro.'],
  },
  {
    id: 'supino-reto-halter', origem: 'Dumbbell_Bench_Press', nome: 'Supino reto com halteres',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'halter', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'porHalter', prio: 2, ombroOk: true,
    passos: [
      'Sente na ponta do banco com os halteres apoiados nas coxas e deite levando-os junto ao peito.',
      'Comece com os halteres na linha do peito, palmas voltadas para os pés.',
      'Empurre os halteres para cima até quase se encostarem, estendendo os braços.',
      'Desça devagar até sentir o peito alongar.',
    ],
    erros: ['Descer rápido demais e perder o controle no fundo.', 'Bater um halter no outro em cima.'],
  },
  {
    id: 'supino-inclinado-barra', origem: 'Barbell_Incline_Bench_Press_-_Medium_Grip', nome: 'Supino inclinado com barra',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'barra', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'porLado', prio: 3,
    passos: [
      'Ajuste o banco entre 30° e 45° e deite com os pés firmes no chão.',
      'Segure a barra um pouco mais aberta que os ombros e tire-a do suporte.',
      'Desça até a parte de cima do peito, logo abaixo da clavícula.',
      'Empurre de volta até estender os braços.',
    ],
    erros: ['Inclinar demais o banco e transformar o exercício em desenvolvimento.', 'Tirar o quadril do banco.'],
  },
  {
    id: 'supino-inclinado-halter', origem: 'Incline_Dumbbell_Press', nome: 'Supino inclinado com halteres',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'halter', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'porHalter', prio: 4, ombroOk: true,
    passos: [
      'Ajuste o banco entre 30° e 45°, sente e leve os halteres até a altura do peito.',
      'Deite com os halteres ao lado da parte de cima do peito.',
      'Empurre para cima até estender os braços, aproximando os halteres.',
      'Desça devagar até sentir o peito alongar.',
    ],
    erros: ['Descer os halteres muito para fora, forçando o ombro.', 'Encurtar o movimento com carga alta.'],
  },
  {
    id: 'supino-maquina', origem: 'Leverage_Chest_Press', nome: 'Supino na máquina (chest press)',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'maquina', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'total', prio: 5,
    passos: [
      'Ajuste o banco para que as pegadas fiquem na altura do meio do peito.',
      'Sente com as costas apoiadas e as escápulas encaixadas para trás.',
      'Empurre as pegadas para frente até estender os braços.',
      'Volte devagar sem deixar o peso encostar no apoio.',
    ],
    erros: ['Banco alto ou baixo demais, com a pegada fora da linha do peito.', 'Tirar as costas do encosto para empurrar.'],
  },
  {
    id: 'supino-halter-neutro', origem: 'Dumbbell_Bench_Press_with_Neutral_Grip', nome: 'Supino com halteres pegada neutra',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'halter', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'porHalter', prio: 6, ombroOk: true,
    passos: [
      'Deite no banco reto com um halter em cada mão, palmas viradas uma para a outra.',
      'Comece com os halteres ao lado do peito, cotovelos próximos ao tronco.',
      'Empurre para cima até estender os braços, mantendo as palmas viradas uma para a outra.',
      'Desça devagar até a linha do peito.',
    ],
    erros: ['Deixar os cotovelos abrirem para os lados.', 'Arquear demais a lombar.'],
  },
  {
    id: 'supino-inclinado-maquina', origem: 'Leverage_Incline_Chest_Press', nome: 'Supino inclinado na máquina',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'maquina', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'total', prio: 7,
    passos: [
      'Ajuste o banco para que as pegadas fiquem na altura da parte de cima do peito.',
      'Sente com as costas apoiadas e os pés firmes.',
      'Empurre as pegadas para cima e para frente até estender os braços.',
      'Volte devagar mantendo tensão no peito.',
    ],
    erros: ['Encolher os ombros perto das orelhas.', 'Soltar o peso de uma vez na volta.'],
  },
  {
    id: 'flexao', origem: 'Pushups', nome: 'Flexão de braço',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'peso_corporal', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'pesoCorpo', prio: 8,
    teto: 20, maisDificil: 'flexao-pes-elevados', assistida: ['flexao-inclinada'], contra: [['punho', 'leve']],
    passos: [
      'Apoie as mãos no chão um pouco mais abertas que os ombros e estenda as pernas, na ponta dos pés.',
      'Mantenha o corpo em linha reta da cabeça aos calcanhares, abdômen firme.',
      'Dobre os cotovelos e desça o peito até perto do chão.',
      'Empurre o chão e volte estendendo os braços.',
    ],
    erros: ['Deixar o quadril cair ou empinar.', 'Fazer meia repetição, sem descer o peito.'],
  },
  {
    id: 'flexao-inclinada', origem: 'Incline_Push-Up', nome: 'Flexão inclinada (mãos no banco)',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'peso_corporal', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'pesoCorpo', prio: 12,
    teto: 20, maisDificil: 'flexao',
    passos: [
      'Apoie as mãos na borda de um banco firme, um pouco mais abertas que os ombros.',
      'Estenda as pernas para trás e mantenha o corpo reto.',
      'Dobre os cotovelos e leve o peito até a borda do banco.',
      'Empurre de volta até estender os braços.',
    ],
    erros: ['Usar um apoio que escorrega.', 'Deixar o quadril cair.'],
  },
  {
    id: 'flexao-pes-elevados', origem: 'Push-Ups_With_Feet_Elevated', nome: 'Flexão com pés elevados',
    grupo: 'peito', sec: ['triceps'], cat: 'push', eq: 'peso_corporal', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'pesoCorpo', prio: 13,
    teto: 20, nivel: 'intermediario', contra: [['punho', 'leve']],
    passos: [
      'Apoie os pés num banco e as mãos no chão, um pouco mais abertas que os ombros.',
      'Mantenha o corpo reto e o abdômen firme.',
      'Desça o peito até perto do chão dobrando os cotovelos.',
      'Empurre de volta até estender os braços.',
    ],
    erros: ['Deixar o quadril cair.', 'Abrir demais os cotovelos.'],
  },
  {
    id: 'crucifixo-halter', origem: 'Dumbbell_Flyes', nome: 'Crucifixo com halteres',
    grupo: 'peito', cat: 'push', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 9,
    passos: [
      'Deite no banco reto com os halteres acima do peito, palmas viradas uma para a outra.',
      'Mantenha os cotovelos levemente dobrados durante todo o movimento.',
      'Abra os braços em arco, descendo os halteres até a linha do peito.',
      'Feche os braços pelo mesmo arco, contraindo o peito.',
    ],
    erros: ['Esticar totalmente os cotovelos, sobrecarregando a articulação.', 'Descer além da linha do ombro.'],
  },
  {
    id: 'voador', origem: 'Butterfly', nome: 'Voador (peck deck)',
    grupo: 'peito', cat: 'push', eq: 'maquina', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 10,
    passos: [
      'Ajuste o banco para que as pegadas fiquem na altura do peito.',
      'Sente com as costas apoiadas e segure as pegadas com os cotovelos levemente dobrados.',
      'Feche os braços à frente do peito, contraindo o peitoral.',
      'Abra devagar até sentir o peito alongar, sem passar da linha do ombro.',
    ],
    erros: ['Deixar o peso puxar os braços para trás demais.', 'Usar o impulso do tronco.'],
  },
  {
    id: 'crossover', origem: 'Cable_Crossover', nome: 'Crossover (polia alta)',
    grupo: 'peito', cat: 'push', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 11,
    passos: [
      'Ajuste as polias no alto e segure uma pegada em cada mão.',
      'Dê um passo à frente e incline levemente o tronco, cotovelos levemente dobrados.',
      'Traga as mãos em arco até se encontrarem à frente do corpo.',
      'Volte devagar até sentir o peito alongar.',
    ],
    erros: ['Dobrar e esticar os cotovelos, virando um exercício de tríceps.', 'Puxar com o corpo em vez de usar o peito.'],
  },
  {
    id: 'crucifixo-inclinado', origem: 'Incline_Dumbbell_Flyes', nome: 'Crucifixo inclinado com halteres',
    grupo: 'peito', cat: 'push', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 14,
    passos: [
      'Ajuste o banco a uns 30° e deite com os halteres acima do peito.',
      'Mantenha os cotovelos levemente dobrados.',
      'Abra os braços em arco até a linha do peito.',
      'Volte pelo mesmo arco contraindo a parte de cima do peito.',
    ],
    erros: ['Usar carga alta e transformar o movimento em supino.', 'Descer além da linha do ombro.'],
  },

  // ───────────────────────────── COSTAS ─────────────────────────────
  {
    id: 'puxada-frontal', origem: 'Wide-Grip_Lat_Pulldown', nome: 'Puxada frontal',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'cabo', tipo: 'composto', padrao: 'puxar_vertical', carga: 'total', prio: 1,
    passos: [
      'Ajuste o apoio das coxas e segure a barra com as mãos bem mais abertas que os ombros.',
      'Sente, incline levemente o tronco para trás e estufe o peito.',
      'Puxe a barra até a parte de cima do peito, levando os cotovelos para baixo e para trás.',
      'Volte devagar até estender os braços.',
    ],
    erros: ['Jogar o tronco para trás para puxar.', 'Puxar a barra atrás da nuca.'],
  },
  {
    id: 'remada-baixa', origem: 'Seated_Cable_Rows', nome: 'Remada baixa (polia)',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'cabo', tipo: 'composto', padrao: 'puxar_horizontal', carga: 'total', prio: 2,
    passos: [
      'Sente com os pés apoiados e os joelhos levemente dobrados, segurando o triângulo.',
      'Mantenha o tronco reto, quase vertical.',
      'Puxe a pegada até a barriga, levando os cotovelos para trás e juntando as escápulas.',
      'Volte devagar estendendo os braços, sem curvar as costas.',
    ],
    erros: ['Balançar o tronco para frente e para trás.', 'Curvar a lombar na volta.'],
  },
  {
    id: 'serrote', origem: 'One-Arm_Dumbbell_Row', nome: 'Remada unilateral com halter (serrote)',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'halter', tipo: 'composto', padrao: 'puxar_horizontal', carga: 'porHalter', uni: true, prio: 3,
    passos: [
      'Apoie um joelho e a mão do mesmo lado no banco, costas retas.',
      'Segure o halter com a outra mão, braço estendido.',
      'Puxe o halter até a lateral da cintura, cotovelo junto ao corpo.',
      'Desça devagar até estender o braço. Faça as repetições e troque de lado.',
    ],
    erros: ['Girar o tronco para levantar o peso.', 'Puxar com o bíceps em vez das costas.'],
  },
  {
    id: 'remada-curvada-barra', origem: 'Bent_Over_Barbell_Row', nome: 'Remada curvada com barra',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'barra', tipo: 'composto', padrao: 'puxar_horizontal', carga: 'porLado', prio: 4,
    contra: [['lombar', 'leve']],
    passos: [
      'Em pé, segure a barra com as mãos na largura dos ombros, palmas para baixo.',
      'Dobre levemente os joelhos e incline o tronco para frente com as costas retas.',
      'Puxe a barra até a altura do umbigo, cotovelos junto ao corpo.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Arredondar as costas.', 'Levantar o tronco a cada repetição para ajudar.'],
  },
  {
    id: 'puxada-supinada', origem: 'Underhand_Cable_Pulldowns', nome: 'Puxada supinada',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'cabo', tipo: 'composto', padrao: 'puxar_vertical', carga: 'total', prio: 5,
    passos: [
      'Segure a barra com as palmas viradas para você, mãos na largura dos ombros.',
      'Sente com as coxas presas no apoio e o peito estufado.',
      'Puxe a barra até a parte de cima do peito, cotovelos junto ao corpo.',
      'Volte devagar até estender os braços.',
    ],
    erros: ['Balançar o tronco.', 'Não estender os braços na volta.'],
  },
  {
    id: 'remada-maquina', origem: 'Leverage_Iso_Row', nome: 'Remada na máquina',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'maquina', tipo: 'composto', padrao: 'puxar_horizontal', carga: 'total', prio: 6,
    passos: [
      'Ajuste o banco para que as pegadas fiquem na altura do peito e apoie o peito no encosto.',
      'Segure as pegadas com os braços estendidos.',
      'Puxe as pegadas em direção ao corpo, levando os cotovelos para trás.',
      'Volte devagar sem deixar o peso encostar.',
    ],
    erros: ['Tirar o peito do apoio.', 'Encolher os ombros.'],
  },
  {
    id: 'remada-cavalinho', origem: 'T-Bar_Row_with_Handle', nome: 'Remada cavalinho',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'barra', tipo: 'composto', padrao: 'puxar_horizontal', carga: 'total', prio: 7,
    contra: [['lombar', 'leve']],
    passos: [
      'Fique com uma perna de cada lado da barra, joelhos levemente dobrados.',
      'Incline o tronco para frente com as costas retas e segure a pegada.',
      'Puxe a pegada em direção ao abdômen juntando as escápulas.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Arredondar a lombar.', 'Dar trancos para subir o peso.'],
  },
  {
    id: 'puxada-fechada', origem: 'Close-Grip_Front_Lat_Pulldown', nome: 'Puxada frontal pegada fechada',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'cabo', tipo: 'composto', padrao: 'puxar_vertical', carga: 'total', prio: 8,
    passos: [
      'Segure a barra com as mãos na largura dos ombros, palmas para frente.',
      'Sente, incline levemente o tronco para trás e estufe o peito.',
      'Puxe a barra até o peito levando os cotovelos para baixo.',
      'Volte devagar até estender os braços.',
    ],
    erros: ['Puxar com os braços e esquecer as costas.', 'Jogar o corpo para trás.'],
  },
  {
    id: 'remada-apoiada', origem: 'Dumbbell_Incline_Row', nome: 'Remada com halteres no banco inclinado',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'halter', tipo: 'composto', padrao: 'puxar_horizontal', carga: 'porHalter', prio: 9,
    passos: [
      'Ajuste o banco a uns 30° e deite de bruços, com o peito apoiado.',
      'Segure um halter em cada mão, braços estendidos para baixo.',
      'Puxe os halteres levando os cotovelos para trás e juntando as escápulas.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Tirar o peito do banco.', 'Encolher os ombros em direção às orelhas.'],
  },
  {
    id: 'remada-curvada-halter', origem: 'Bent_Over_Two-Dumbbell_Row', nome: 'Remada curvada com halteres',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'halter', tipo: 'composto', padrao: 'puxar_horizontal', carga: 'porHalter', prio: 10,
    contra: [['lombar', 'leve']],
    passos: [
      'Segure um halter em cada mão, dobre levemente os joelhos e incline o tronco com as costas retas.',
      'Deixe os braços estendidos abaixo dos ombros.',
      'Puxe os halteres até a lateral da cintura, juntando as escápulas.',
      'Desça devagar.',
    ],
    erros: ['Arredondar as costas.', 'Usar impulso do tronco.'],
  },
  {
    id: 'barra-fixa', origem: 'Pullups', nome: 'Barra fixa',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'peso_corporal', tipo: 'composto', padrao: 'puxar_vertical', carga: 'pesoCorpo', prio: 11,
    teto: 12, assistida: ['barra-graviton', 'barra-elastico'], nivel: 'intermediario',
    passos: [
      'Segure a barra com as palmas viradas para frente, mãos um pouco mais abertas que os ombros.',
      'Fique pendurado com os braços estendidos e o abdômen firme.',
      'Puxe o corpo até o queixo passar a barra, levando os cotovelos para baixo.',
      'Desça devagar até estender os braços de novo.',
    ],
    erros: ['Balançar as pernas para ganhar impulso.', 'Não descer até o fim.'],
  },
  {
    id: 'barra-fixa-supinada', origem: 'Chin-Up', nome: 'Barra fixa supinada',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'peso_corporal', tipo: 'composto', padrao: 'puxar_vertical', carga: 'pesoCorpo', prio: 12,
    teto: 12, assistida: ['barra-graviton', 'barra-elastico'], nivel: 'intermediario',
    passos: [
      'Segure a barra com as palmas viradas para você, mãos na largura dos ombros.',
      'Fique pendurado com os braços estendidos.',
      'Puxe o corpo até o queixo passar a barra.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Usar impulso.', 'Fazer só a parte de cima do movimento.'],
  },
  {
    id: 'barra-graviton', origem: null, nome: 'Barra fixa no graviton (assistida)',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'maquina', tipo: 'composto', padrao: 'puxar_vertical', carga: 'total', prio: 13,
    assistido: true, nivel: 'iniciante', maisDificil: 'barra-fixa',
    passos: [
      'Escolha o peso de ajuda: quanto mais peso, mais fácil.',
      'Ajoelhe (ou pise) na plataforma e segure as pegadas de cima.',
      'Puxe o corpo até o queixo passar das pegadas.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Descer rápido demais.', 'Ficar sempre com o mesmo peso de ajuda: o objetivo é ir diminuindo.'],
  },
  {
    id: 'barra-elastico', origem: 'Band_Assisted_Pull-Up', nome: 'Barra fixa com elástico',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'elastico', tipo: 'composto', padrao: 'puxar_vertical', carga: 'pesoCorpo', prio: 14,
    teto: 12, maisDificil: 'barra-fixa',
    passos: [
      'Prenda um elástico na barra e apoie um pé ou joelho nele.',
      'Segure a barra um pouco mais aberta que os ombros.',
      'Puxe o corpo até o queixo passar a barra.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Deixar o elástico jogar o corpo para cima no impulso.', 'Não descer até o fim.'],
  },
  {
    id: 'pulldown-braco-estendido', origem: 'Straight-Arm_Pulldown', nome: 'Pulldown com braços estendidos',
    grupo: 'costas', cat: 'pull', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 15,
    passos: [
      'Fique em pé de frente para a polia alta e segure a barra com os braços estendidos.',
      'Incline levemente o tronco à frente, cotovelos quase retos.',
      'Leve a barra em arco até as coxas usando as costas.',
      'Volte devagar até a altura dos olhos.',
    ],
    erros: ['Dobrar os cotovelos e virar um tríceps.', 'Balançar o tronco.'],
  },
  {
    id: 'puxada-nuca', origem: 'Wide-Grip_Pulldown_Behind_The_Neck', nome: 'Puxada por trás da nuca',
    grupo: 'costas', sec: ['biceps'], cat: 'pull', eq: 'cabo', tipo: 'composto', padrao: 'puxar_vertical', carga: 'total', prio: 30,
    contra: [['ombro', 'forte']],
    passos: [
      'Segure a barra bem aberta e sente com as coxas presas no apoio.',
      'Incline levemente a cabeça para frente.',
      'Puxe a barra até a altura da nuca, cotovelos para baixo.',
      'Volte devagar até estender os braços.',
    ],
    erros: ['Forçar a cabeça e o pescoço para frente.', 'Usar carga alta: o movimento coloca o ombro numa posição de risco.'],
  },

  // ───────────────────────────── OMBROS ─────────────────────────────
  {
    id: 'desenvolvimento-halter', origem: 'Seated_Dumbbell_Press', nome: 'Desenvolvimento com halteres',
    grupo: 'ombros', sec: ['triceps'], cat: 'push', eq: 'halter', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'porHalter', prio: 1, ombroOk: true,
    passos: [
      'Sente num banco com encosto vertical, um halter em cada mão na altura dos ombros.',
      'Palmas viradas para frente, cotovelos um pouco à frente do corpo.',
      'Empurre os halteres para cima até quase estender os braços.',
      'Desça devagar até a altura das orelhas.',
    ],
    erros: ['Arquear demais a lombar.', 'Descer pouco e fazer só meia repetição.'],
  },
  {
    id: 'desenvolvimento-maquina', origem: 'Machine_Shoulder_Military_Press', nome: 'Desenvolvimento na máquina',
    grupo: 'ombros', sec: ['triceps'], cat: 'push', eq: 'maquina', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'total', prio: 2,
    passos: [
      'Ajuste o banco para as pegadas ficarem na altura dos ombros.',
      'Sente com as costas apoiadas e segure as pegadas.',
      'Empurre para cima até quase estender os braços.',
      'Desça devagar até a altura dos ombros.',
    ],
    erros: ['Tirar as costas do encosto.', 'Travar os cotovelos com força em cima.'],
  },
  {
    id: 'desenvolvimento-barra', origem: 'Standing_Military_Press', nome: 'Desenvolvimento com barra (em pé)',
    grupo: 'ombros', sec: ['triceps'], cat: 'push', eq: 'barra', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'porLado', prio: 3,
    contra: [['ombro', 'leve'], ['lombar', 'leve']],
    passos: [
      'Segure a barra na altura dos ombros, mãos um pouco mais abertas que eles.',
      'Em pé, pés na largura do quadril, abdômen e glúteos firmes.',
      'Empurre a barra para cima, passando o rosto, até estender os braços.',
      'Desça devagar até a parte de cima do peito.',
    ],
    erros: ['Inclinar o tronco para trás e forçar a lombar.', 'Empurrar a barra muito à frente do corpo.'],
  },
  {
    id: 'desenvolvimento-neutro', origem: 'Standing_Palms-In_Dumbbell_Press', nome: 'Desenvolvimento com halteres pegada neutra',
    grupo: 'ombros', sec: ['triceps'], cat: 'push', eq: 'halter', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'porHalter', prio: 4, ombroOk: true,
    nivel: 'iniciante',
    passos: [
      'Segure os halteres na altura dos ombros com as palmas viradas uma para a outra.',
      'Mantenha os cotovelos à frente do corpo.',
      'Empurre para cima até quase estender os braços.',
      'Desça devagar até a altura dos ombros.',
    ],
    erros: ['Abrir os cotovelos para os lados.', 'Arquear a lombar.'],
  },
  {
    id: 'desenvolvimento-arnold', origem: 'Arnold_Dumbbell_Press', nome: 'Desenvolvimento Arnold',
    grupo: 'ombros', sec: ['triceps'], cat: 'push', eq: 'halter', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'porHalter', prio: 5,
    passos: [
      'Sente com os halteres à frente dos ombros, palmas viradas para você.',
      'Empurre para cima girando os punhos até as palmas ficarem viradas para frente.',
      'Estenda os braços em cima sem travar.',
      'Desça fazendo o giro ao contrário.',
    ],
    erros: ['Girar rápido demais, sem controle.', 'Arquear a lombar.'],
  },
  {
    id: 'elevacao-lateral', origem: 'Side_Lateral_Raise', nome: 'Elevação lateral com halteres',
    grupo: 'ombros', cat: 'push', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 6,
    passos: [
      'Em pé, segure um halter em cada mão ao lado do corpo.',
      'Dobre levemente os cotovelos e incline o tronco um pouco à frente.',
      'Eleve os braços pelas laterais até a altura dos ombros.',
      'Desça devagar.',
    ],
    erros: ['Subir acima da linha dos ombros encolhendo o trapézio.', 'Balançar o corpo para levantar o peso.'],
  },
  {
    id: 'voador-invertido', origem: 'Reverse_Machine_Flyes', nome: 'Voador invertido (máquina)',
    grupo: 'ombros', cat: 'pull', eq: 'maquina', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 7,
    passos: [
      'Sente de frente para o encosto, com o peito apoiado.',
      'Segure as pegadas com os braços estendidos à frente.',
      'Abra os braços para trás em arco, juntando as escápulas.',
      'Volte devagar.',
    ],
    erros: ['Usar carga alta e encolher os ombros.', 'Dobrar demais os cotovelos.'],
  },
  {
    id: 'elevacao-lateral-cabo', origem: 'Standing_Low-Pulley_Deltoid_Raise', nome: 'Elevação lateral na polia',
    grupo: 'ombros', cat: 'push', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', uni: true, prio: 8,
    passos: [
      'Fique de lado para a polia baixa e segure a pegada com a mão mais distante.',
      'Com o cotovelo levemente dobrado, eleve o braço pela lateral até a altura do ombro.',
      'Desça devagar até a frente do quadril.',
      'Faça todas as repetições e troque de lado.',
    ],
    erros: ['Inclinar o corpo para longe da polia para ajudar.', 'Subir acima do ombro.'],
  },
  {
    id: 'crucifixo-inverso', origem: 'Reverse_Flyes', nome: 'Crucifixo inverso com halteres',
    grupo: 'ombros', cat: 'pull', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 9,
    passos: [
      'Incline o tronco à frente com as costas retas (ou deite de bruços num banco inclinado).',
      'Deixe os halteres pendurados abaixo dos ombros, cotovelos levemente dobrados.',
      'Abra os braços para os lados até a linha dos ombros.',
      'Desça devagar.',
    ],
    erros: ['Levantar o tronco para ajudar.', 'Usar carga alta e perder a postura.'],
  },
  {
    id: 'face-pull', origem: 'Face_Pull', nome: 'Face pull',
    grupo: 'ombros', cat: 'pull', eq: 'cabo', tipo: 'isolado', padrao: 'puxar_horizontal', carga: 'total', prio: 10, ombroOk: true,
    nivel: 'iniciante',
    passos: [
      'Ajuste a polia na altura do rosto e use a corda.',
      'Segure a corda com as palmas viradas para baixo e dê um passo para trás.',
      'Puxe a corda em direção ao rosto, abrindo as mãos e levando os cotovelos para trás e para cima.',
      'Volte devagar até estender os braços.',
    ],
    erros: ['Usar carga alta e puxar com o corpo.', 'Deixar os cotovelos caírem abaixo dos ombros.'],
  },
  {
    id: 'elevacao-frontal', origem: 'Front_Dumbbell_Raise', nome: 'Elevação frontal com halteres',
    grupo: 'ombros', cat: 'push', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 11,
    passos: [
      'Em pé, segure os halteres à frente das coxas.',
      'Com os cotovelos levemente dobrados, eleve os braços à frente até a altura dos ombros.',
      'Desça devagar.',
      'Se preferir, alterne um braço de cada vez.',
    ],
    erros: ['Jogar o tronco para trás.', 'Subir acima da linha dos olhos.'],
  },
  {
    id: 'remada-alta', origem: 'Upright_Barbell_Row', nome: 'Remada alta',
    grupo: 'ombros', cat: 'push', eq: 'barra', tipo: 'composto', padrao: 'puxar_vertical', carga: 'total', prio: 30,
    contra: [['ombro', 'forte']],
    passos: [
      'Segure a barra à frente das coxas com as mãos na largura dos ombros.',
      'Puxe a barra para cima, rente ao corpo, levando os cotovelos para o alto.',
      'Suba até a altura do peito.',
      'Desça devagar.',
    ],
    erros: ['Subir a barra acima do peito, comprimindo o ombro.', 'Usar pegada muito fechada.'],
  },
  {
    id: 'desenvolvimento-nuca', origem: 'Standing_Barbell_Press_Behind_Neck', nome: 'Desenvolvimento por trás da nuca',
    grupo: 'ombros', sec: ['triceps'], cat: 'push', eq: 'barra', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'porLado', prio: 31,
    contra: [['ombro', 'forte']],
    passos: [
      'Apoie a barra atrás da nuca, mãos bem abertas.',
      'Mantenha o abdômen firme.',
      'Empurre a barra para cima até estender os braços.',
      'Desça devagar até a altura das orelhas.',
    ],
    erros: ['Descer a barra demais atrás da cabeça.', 'Usar carga alta: o movimento coloca o ombro numa posição de risco.'],
  },
  {
    id: 'rotacao-externa-elastico', origem: 'External_Rotation_with_Band', nome: 'Rotação externa com elástico',
    grupo: 'ombros', cat: 'pull', eq: 'elastico', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'pesoCorpo', uni: true, prio: 40,
    soAquecimento: true, teto: 15,
    passos: [
      'Prenda o elástico na altura da cintura e fique de lado para ele.',
      'Segure com a mão mais distante, cotovelo dobrado a 90° e colado ao corpo (uma toalha enrolada ajuda).',
      'Gire o antebraço para fora, mantendo o cotovelo no lugar.',
      'Volte devagar. Faça as repetições e troque de lado.',
    ],
    erros: ['Afastar o cotovelo do corpo.', 'Usar elástico forte demais: é um aquecimento leve.'],
  },
  {
    id: 'rotacao-externa-cabo', origem: 'External_Rotation_with_Cable', nome: 'Rotação externa na polia',
    grupo: 'ombros', cat: 'pull', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', uni: true, prio: 41,
    soAquecimento: true,
    passos: [
      'Ajuste a polia na altura da cintura e fique de lado para ela.',
      'Segure a pegada com a mão mais distante, cotovelo dobrado a 90° e colado ao corpo.',
      'Gire o antebraço para fora, sem mexer o cotovelo.',
      'Volte devagar. Faça as repetições e troque de lado.',
    ],
    erros: ['Afastar o cotovelo do corpo.', 'Usar carga alta: é um aquecimento leve.'],
  },

  // ─────────────────────────── QUADRÍCEPS ───────────────────────────
  {
    id: 'agachamento-livre', origem: 'Barbell_Squat', nome: 'Agachamento livre com barra',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'barra', tipo: 'composto', padrao: 'agachar', carga: 'porLado', prio: 1,
    contra: [['joelho', 'leve'], ['lombar', 'leve']],
    passos: [
      'Apoie a barra no alto das costas (não no pescoço) e tire-a do suporte.',
      'Pés na largura dos ombros, pontas levemente para fora.',
      'Desça empurrando o quadril para trás e dobrando os joelhos, peito aberto, até as coxas ficarem paralelas ao chão (ou até onde mantiver a postura).',
      'Suba empurrando o chão com o pé inteiro.',
    ],
    erros: ['Deixar os joelhos caírem para dentro.', 'Arredondar a lombar no fundo.'],
  },
  {
    id: 'leg-press', origem: 'Leg_Press', nome: 'Leg press 45°',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'maquina', tipo: 'composto', padrao: 'agachar', carga: 'total', prio: 2,
    passos: [
      'Sente com as costas e o quadril bem apoiados no encosto.',
      'Pés na plataforma na largura dos ombros.',
      'Destrave e desça dobrando os joelhos até uns 90°, sem tirar o quadril do banco.',
      'Empurre de volta sem travar os joelhos em cima.',
    ],
    erros: ['Descer tanto que o quadril sai do encosto.', 'Travar os joelhos esticados no final.'],
  },
  {
    id: 'hack', origem: 'Hack_Squat', nome: 'Agachamento no hack',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'maquina', tipo: 'composto', padrao: 'agachar', carga: 'total', prio: 3,
    contra: [['joelho', 'leve']],
    passos: [
      'Apoie as costas e os ombros nas almofadas, pés na plataforma na largura dos ombros.',
      'Destrave a máquina.',
      'Desça dobrando os joelhos até as coxas ficarem paralelas à plataforma.',
      'Empurre de volta sem travar os joelhos.',
    ],
    erros: ['Tirar os calcanhares da plataforma.', 'Deixar os joelhos caírem para dentro.'],
  },
  {
    id: 'agachamento-smith', origem: 'Smith_Machine_Squat', nome: 'Agachamento no Smith',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'maquina', tipo: 'composto', padrao: 'agachar', carga: 'porLado', prio: 4,
    contra: [['joelho', 'leve']],
    passos: [
      'Posicione a barra no alto das costas e os pés um pouco à frente da barra.',
      'Destrave a barra girando os punhos.',
      'Desça dobrando joelhos e quadril até as coxas ficarem paralelas ao chão.',
      'Suba empurrando o chão e trave a barra no final da série.',
    ],
    erros: ['Pés muito para trás, forçando os joelhos.', 'Arredondar a lombar.'],
  },
  {
    id: 'cadeira-extensora', origem: 'Leg_Extensions', nome: 'Cadeira extensora',
    grupo: 'quadriceps', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'isolado_pernas', carga: 'total', prio: 5,
    contra: [['joelho', 'leve']],
    passos: [
      'Ajuste o encosto para o joelho ficar alinhado com o eixo da máquina e o rolo sobre o peito do pé.',
      'Segure as alças laterais.',
      'Estenda os joelhos até as pernas ficarem retas.',
      'Desça devagar.',
    ],
    erros: ['Dar trancos para subir o peso.', 'Descer rápido demais.'],
  },
  {
    id: 'bulgaro', origem: 'Split_Squat_with_Dumbbells', nome: 'Agachamento búlgaro',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'halter', tipo: 'composto', padrao: 'agachar', carga: 'porHalter', uni: true, prio: 6,
    contra: [['joelho', 'leve']],
    passos: [
      'Apoie o peito do pé de trás num banco e dê um passo à frente com a outra perna.',
      'Segure um halter em cada mão ao lado do corpo.',
      'Desça dobrando o joelho da frente até a coxa ficar quase paralela ao chão.',
      'Suba empurrando com o calcanhar da frente. Faça as repetições e troque de perna.',
    ],
    erros: ['Pé da frente perto demais do banco.', 'Inclinar demais o tronco e perder o equilíbrio.'],
  },
  {
    id: 'avanco', origem: 'Dumbbell_Lunges', nome: 'Avanço com halteres',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'halter', tipo: 'composto', padrao: 'agachar', carga: 'porHalter', uni: true, prio: 7,
    contra: [['joelho', 'leve']],
    passos: [
      'Em pé, segure um halter em cada mão ao lado do corpo.',
      'Dê um passo largo à frente e desça até o joelho de trás quase encostar no chão.',
      'Empurre com o calcanhar da frente para voltar à posição inicial.',
      'Faça as repetições de um lado e depois do outro.',
    ],
    erros: ['Joelho da frente caindo para dentro.', 'Passo curto demais, jogando o joelho muito à frente.'],
  },
  {
    id: 'agachamento-halteres', origem: 'Dumbbell_Squat', nome: 'Agachamento com halteres',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'halter', tipo: 'composto', padrao: 'agachar', carga: 'porHalter', prio: 8,
    passos: [
      'Em pé, segure um halter em cada mão ao lado do corpo.',
      'Pés na largura dos ombros, pontas levemente para fora.',
      'Desça empurrando o quadril para trás até as coxas ficarem paralelas ao chão.',
      'Suba empurrando o chão.',
    ],
    erros: ['Curvar as costas para frente.', 'Tirar os calcanhares do chão.'],
  },
  {
    id: 'agachamento-sumo', origem: 'Plie_Dumbbell_Squat', nome: 'Agachamento sumô com halter',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'halter', tipo: 'composto', padrao: 'agachar', carga: 'porHalter', prio: 9,
    contra: [['joelho', 'leve']],
    passos: [
      'Afaste bem os pés, pontas viradas para fora, e segure um halter com as duas mãos à frente do corpo.',
      'Mantenha o tronco reto.',
      'Desça dobrando os joelhos na direção das pontas dos pés até as coxas ficarem paralelas ao chão.',
      'Suba empurrando com os calcanhares.',
    ],
    erros: ['Joelhos caindo para dentro.', 'Inclinar o tronco à frente.'],
  },
  {
    id: 'subida-banco', origem: 'Dumbbell_Step_Ups', nome: 'Subida no banco com halteres',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'halter', tipo: 'composto', padrao: 'agachar', carga: 'porHalter', uni: true, prio: 10,
    contra: [['joelho', 'leve']],
    passos: [
      'Segure um halter em cada mão, de frente para um banco firme.',
      'Apoie o pé inteiro em cima do banco.',
      'Suba empurrando com a perna de cima até ficar em pé no banco.',
      'Desça devagar com a mesma perna e repita. Depois troque de lado.',
    ],
    erros: ['Dar impulso com a perna de baixo.', 'Usar um banco alto demais.'],
  },
  {
    id: 'agachamento-corpo', origem: 'Bodyweight_Squat', nome: 'Agachamento livre (peso do corpo)',
    grupo: 'quadriceps', sec: ['gluteos'], cat: 'legs', eq: 'peso_corporal', tipo: 'composto', padrao: 'agachar', carga: 'pesoCorpo', prio: 11,
    teto: 12,
    passos: [
      'Em pé, pés na largura dos ombros, braços à frente para equilibrar.',
      'Desça empurrando o quadril para trás e dobrando os joelhos.',
      'Vá até as coxas ficarem paralelas ao chão, mantendo o peito aberto.',
      'Suba empurrando o chão.',
    ],
    erros: ['Tirar os calcanhares do chão.', 'Deixar os joelhos caírem para dentro.'],
  },

  // ─────────────────────── POSTERIORES DE COXA ───────────────────────
  {
    id: 'stiff-halteres', origem: 'Stiff-Legged_Dumbbell_Deadlift', nome: 'Stiff com halteres',
    grupo: 'posteriores', sec: ['gluteos'], cat: 'legs', eq: 'halter', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'porHalter', prio: 1,
    contra: [['lombar', 'leve']],
    passos: [
      'Em pé, segure um halter em cada mão à frente das coxas.',
      'Joelhos levemente dobrados e fixos durante todo o movimento.',
      'Desça os halteres rente às pernas empurrando o quadril para trás, costas retas.',
      'Suba contraindo glúteos e posteriores.',
    ],
    erros: ['Arredondar a lombar.', 'Afastar os halteres das pernas.'],
  },
  {
    id: 'stiff-barra', origem: 'Stiff-Legged_Barbell_Deadlift', nome: 'Stiff com barra',
    grupo: 'posteriores', sec: ['gluteos'], cat: 'legs', eq: 'barra', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'porLado', prio: 2,
    contra: [['lombar', 'leve']],
    passos: [
      'Em pé, segure a barra à frente das coxas, mãos na largura dos ombros.',
      'Joelhos levemente dobrados e fixos durante todo o movimento.',
      'Desça a barra rente às pernas empurrando o quadril para trás, com as costas retas, até sentir alongar atrás da coxa.',
      'Suba contraindo glúteos e posteriores.',
    ],
    erros: ['Arredondar as costas para descer mais.', 'Dobrar os joelhos como num agachamento.'],
  },
  {
    id: 'mesa-flexora', origem: 'Lying_Leg_Curls', nome: 'Mesa flexora',
    grupo: 'posteriores', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'isolado_pernas', carga: 'total', prio: 3,
    passos: [
      'Deite de bruços com os joelhos logo após a borda do banco e o rolo acima dos calcanhares.',
      'Segure as pegadas.',
      'Dobre os joelhos trazendo o rolo em direção aos glúteos.',
      'Desça devagar.',
    ],
    erros: ['Tirar o quadril do banco.', 'Descer o peso de uma vez.'],
  },
  {
    id: 'cadeira-flexora', origem: 'Seated_Leg_Curl', nome: 'Cadeira flexora',
    grupo: 'posteriores', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'isolado_pernas', carga: 'total', prio: 4,
    passos: [
      'Ajuste o encosto para o joelho ficar alinhado com o eixo da máquina, rolo atrás dos calcanhares.',
      'Prenda as coxas com o apoio de cima.',
      'Dobre os joelhos levando o rolo para baixo e para trás.',
      'Volte devagar.',
    ],
    erros: ['Coxas soltas, subindo do banco.', 'Movimento curto com carga alta.'],
  },
  {
    id: 'terra-romeno', origem: 'Romanian_Deadlift', nome: 'Levantamento terra romeno',
    grupo: 'posteriores', sec: ['gluteos'], cat: 'legs', eq: 'barra', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'porLado', prio: 5,
    contra: [['lombar', 'leve']],
    passos: [
      'Em pé, segure a barra à frente das coxas, pés na largura do quadril.',
      'Dobre levemente os joelhos.',
      'Empurre o quadril para trás descendo a barra rente às pernas até um pouco abaixo dos joelhos, costas retas.',
      'Volte estendendo o quadril e contraindo os glúteos.',
    ],
    erros: ['Arredondar as costas.', 'Deixar a barra se afastar do corpo.'],
  },
  {
    id: 'flexora-em-pe', origem: 'Standing_Leg_Curl', nome: 'Flexora em pé (unilateral)',
    grupo: 'posteriores', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'isolado_pernas', carga: 'total', uni: true, prio: 6,
    passos: [
      'Apoie o tronco na máquina e encaixe o rolo atrás do calcanhar.',
      'Dobre o joelho trazendo o calcanhar em direção ao glúteo.',
      'Desça devagar.',
      'Faça as repetições e troque de perna.',
    ],
    erros: ['Girar o quadril para ajudar.', 'Descer rápido.'],
  },
  {
    id: 'hiperextensao', origem: 'Hyperextensions_Back_Extensions', nome: 'Hiperextensão no banco romano',
    grupo: 'posteriores', sec: ['gluteos'], cat: 'legs', eq: 'peso_corporal', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'pesoCorpo', prio: 7,
    teto: 12, contra: [['lombar', 'leve']],
    passos: [
      'Apoie as coxas na almofada e prenda os tornozelos no apoio.',
      'Cruze os braços à frente do peito.',
      'Desça o tronco dobrando no quadril, costas retas.',
      'Suba até o corpo ficar alinhado, sem passar dessa linha.',
    ],
    erros: ['Subir além da linha do corpo, forçando a lombar.', 'Fazer o movimento rápido, com impulso.'],
  },
  {
    id: 'levantamento-terra', origem: 'Barbell_Deadlift', nome: 'Levantamento terra',
    grupo: 'posteriores', sec: ['gluteos'], cat: 'legs', eq: 'barra', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'porLado', prio: 8,
    contra: [['lombar', 'forte']],
    passos: [
      'Pés na largura do quadril com a barra sobre o meio dos pés.',
      'Agache e segure a barra logo fora das pernas, costas retas e peito aberto.',
      'Levante empurrando o chão com as pernas, com a barra rente ao corpo, até ficar em pé.',
      'Desça controlando pelo mesmo caminho.',
    ],
    erros: ['Arredondar a lombar ao puxar.', 'Subir o quadril antes do peito no começo do movimento.'],
  },
  {
    id: 'good-morning', origem: 'Good_Morning', nome: 'Good morning',
    grupo: 'posteriores', sec: ['gluteos'], cat: 'legs', eq: 'barra', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'porLado', prio: 20,
    contra: [['lombar', 'forte']],
    passos: [
      'Apoie a barra no alto das costas, pés na largura do quadril.',
      'Dobre levemente os joelhos.',
      'Incline o tronco à frente empurrando o quadril para trás, costas retas, até quase paralelo ao chão.',
      'Volte estendendo o quadril.',
    ],
    erros: ['Arredondar as costas.', 'Usar carga alta: o exercício exige muito da lombar.'],
  },

  // ───────────────────────────── GLÚTEOS ─────────────────────────────
  {
    id: 'elevacao-pelvica', origem: 'Barbell_Hip_Thrust', nome: 'Elevação pélvica com barra',
    grupo: 'gluteos', sec: ['posteriores'], cat: 'legs', eq: 'barra', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'porLado', prio: 1,
    nivel: 'iniciante',
    passos: [
      'Sente no chão com a parte de cima das costas apoiada num banco e a barra (com proteção) sobre o quadril.',
      'Pés firmes no chão na largura do quadril, joelhos dobrados.',
      'Empurre o quadril para cima até o tronco ficar alinhado com as coxas, contraindo os glúteos.',
      'Desça devagar.',
    ],
    erros: ['Arquear a lombar em vez de subir com o quadril.', 'Pés longe demais, puxando com os posteriores.'],
  },
  {
    id: 'abdutora', origem: 'Thigh_Abductor', nome: 'Cadeira abdutora',
    grupo: 'gluteos', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'isolado_pernas', carga: 'total', prio: 2,
    passos: [
      'Sente com as costas apoiadas e as almofadas por fora dos joelhos.',
      'Segure as pegadas laterais.',
      'Abra as pernas o máximo que conseguir com controle.',
      'Volte devagar sem deixar o peso encostar.',
    ],
    erros: ['Jogar o tronco para frente e para trás.', 'Voltar soltando o peso.'],
  },
  {
    id: 'ponte-barra', origem: 'Barbell_Glute_Bridge', nome: 'Ponte de glúteo com barra',
    grupo: 'gluteos', sec: ['posteriores'], cat: 'legs', eq: 'barra', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'porLado', prio: 3,
    nivel: 'iniciante',
    passos: [
      'Deite de costas no chão com os joelhos dobrados e a barra (com proteção) sobre o quadril.',
      'Pés firmes no chão na largura do quadril.',
      'Empurre o quadril para cima contraindo os glúteos.',
      'Desça devagar até quase encostar no chão.',
    ],
    erros: ['Empurrar com as pontas dos pés em vez dos calcanhares.', 'Arquear a lombar no alto.'],
  },
  {
    id: 'gluteo-polia', origem: 'One-Legged_Cable_Kickback', nome: 'Glúteo na polia (coice)',
    grupo: 'gluteos', cat: 'legs', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_pernas', carga: 'total', uni: true, prio: 4,
    nivel: 'iniciante',
    passos: [
      'Prenda a caneleira na polia baixa e no tornozelo.',
      'Fique de frente para a máquina segurando no apoio, tronco levemente inclinado.',
      'Leve a perna para trás e para cima contraindo o glúteo, sem arquear a lombar.',
      'Volte devagar. Faça as repetições e troque de perna.',
    ],
    erros: ['Arquear as costas para subir mais a perna.', 'Balançar a perna com impulso.'],
  },
  {
    id: 'pull-through', origem: 'Pull_Through', nome: 'Pull-through na polia',
    grupo: 'gluteos', sec: ['posteriores'], cat: 'legs', eq: 'cabo', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'total', prio: 5,
    passos: [
      'De costas para a polia baixa, segure a corda entre as pernas.',
      'Dê alguns passos à frente, pés um pouco mais abertos que o quadril.',
      'Empurre o quadril para trás deixando a corda passar entre as pernas, costas retas.',
      'Volte estendendo o quadril e contraindo os glúteos.',
    ],
    erros: ['Puxar com os braços.', 'Agachar em vez de dobrar no quadril.'],
  },
  {
    id: 'ponte', origem: 'Butt_Lift_Bridge', nome: 'Ponte de glúteo (peso do corpo)',
    grupo: 'gluteos', sec: ['posteriores'], cat: 'legs', eq: 'peso_corporal', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'pesoCorpo', prio: 6,
    teto: 12, maisDificil: 'ponte-unilateral',
    passos: [
      'Deite de costas, joelhos dobrados e pés no chão na largura dos ombros.',
      'Braços ao lado do corpo.',
      'Suba o quadril empurrando com os calcanhares, contraindo os glúteos.',
      'Desça devagar.',
    ],
    erros: ['Arquear a lombar.', 'Fazer rápido, sem contrair no alto.'],
  },
  {
    id: 'ponte-unilateral', origem: 'Single_Leg_Glute_Bridge', nome: 'Ponte de glúteo unilateral',
    grupo: 'gluteos', sec: ['posteriores'], cat: 'legs', eq: 'peso_corporal', tipo: 'composto', padrao: 'dobrar_quadril', carga: 'pesoCorpo', uni: true, prio: 7,
    teto: 12,
    passos: [
      'Deite de costas com um joelho dobrado e o pé no chão; estenda a outra perna.',
      'Suba o quadril empurrando com o calcanhar do pé apoiado.',
      'Mantenha o quadril nivelado, sem cair para um lado.',
      'Desça devagar. Faça as repetições e troque de perna.',
    ],
    erros: ['Deixar o quadril girar.', 'Empurrar com a ponta do pé.'],
  },
  {
    id: 'gluteo-quatro-apoios', origem: 'Glute_Kickback', nome: 'Glúteo quatro apoios',
    grupo: 'gluteos', cat: 'legs', eq: 'peso_corporal', tipo: 'isolado', padrao: 'isolado_pernas', carga: 'pesoCorpo', uni: true, prio: 8,
    teto: 12,
    passos: [
      'Fique de quatro apoios, mãos abaixo dos ombros e joelhos abaixo do quadril.',
      'Mantendo o joelho dobrado a 90°, eleve uma perna até a coxa ficar alinhada com as costas.',
      'Contraia o glúteo no alto e desça devagar.',
      'Faça as repetições e troque de perna.',
    ],
    erros: ['Arquear a lombar.', 'Girar o quadril para o lado.'],
  },

  // ─────────────────────────── PANTURRILHA ───────────────────────────
  {
    id: 'panturrilha-em-pe', origem: 'Standing_Calf_Raises', nome: 'Panturrilha em pé (máquina)',
    grupo: 'panturrilha', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'panturrilha', carga: 'total', prio: 1,
    passos: [
      'Encaixe os ombros nas almofadas e apoie a ponta dos pés na plataforma.',
      'Deixe os calcanhares descerem até sentir alongar.',
      'Suba na ponta dos pés o máximo que conseguir.',
      'Desça devagar.',
    ],
    erros: ['Dobrar os joelhos para ajudar.', 'Fazer o movimento curto e rápido.'],
  },
  {
    id: 'panturrilha-sentado', origem: 'Seated_Calf_Raise', nome: 'Panturrilha sentado',
    grupo: 'panturrilha', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'panturrilha', carga: 'total', prio: 2,
    passos: [
      'Sente e apoie a ponta dos pés na plataforma, com a almofada sobre as coxas.',
      'Destrave a máquina.',
      'Desça os calcanhares até alongar e suba na ponta dos pés.',
      'Desça devagar.',
    ],
    erros: ['Quicar no fundo.', 'Amplitude curta.'],
  },
  {
    id: 'panturrilha-leg-press', origem: 'Calf_Press_On_The_Leg_Press_Machine', nome: 'Panturrilha no leg press',
    grupo: 'panturrilha', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'panturrilha', carga: 'total', prio: 3,
    passos: [
      'Sente no leg press e apoie só a ponta dos pés na borda de baixo da plataforma.',
      'Estenda as pernas sem travar os joelhos.',
      'Empurre a plataforma com a ponta dos pés.',
      'Volte devagar até alongar a panturrilha.',
    ],
    erros: ['Deixar o pé escorregar da plataforma.', 'Dobrar os joelhos durante o movimento.'],
  },
  {
    id: 'panturrilha-halter', origem: 'Standing_Dumbbell_Calf_Raise', nome: 'Panturrilha em pé com halter',
    grupo: 'panturrilha', cat: 'legs', eq: 'halter', tipo: 'isolado', padrao: 'panturrilha', carga: 'porHalter', prio: 4,
    nivel: 'iniciante',
    passos: [
      'Segure um halter numa mão e apoie a ponta dos pés num step; segure em algo firme com a outra mão.',
      'Deixe os calcanhares descerem até alongar.',
      'Suba na ponta dos pés o máximo que conseguir.',
      'Desça devagar.',
    ],
    erros: ['Quicar no fundo.', 'Dobrar os joelhos.'],
  },
  {
    id: 'panturrilha-smith', origem: 'Smith_Machine_Calf_Raise', nome: 'Panturrilha no Smith',
    grupo: 'panturrilha', cat: 'legs', eq: 'maquina', tipo: 'isolado', padrao: 'panturrilha', carga: 'porLado', prio: 5,
    passos: [
      'Coloque um step sob a barra e apoie a ponta dos pés nele.',
      'Posicione a barra no alto das costas e destrave.',
      'Suba na ponta dos pés o máximo que conseguir.',
      'Desça devagar até alongar.',
    ],
    erros: ['Dobrar os joelhos.', 'Perder o equilíbrio no step.'],
  },

  // ───────────────────────────── BÍCEPS ─────────────────────────────
  {
    id: 'rosca-direta', origem: 'Barbell_Curl', nome: 'Rosca direta com barra',
    grupo: 'biceps', cat: 'pull', eq: 'barra', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 1,
    contra: [['punho', 'leve']],
    passos: [
      'Em pé, segure a barra com as palmas viradas para frente, mãos na largura dos ombros.',
      'Cotovelos colados ao corpo.',
      'Dobre os cotovelos levando a barra até a altura do peito.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Balançar o tronco para subir o peso.', 'Levar os cotovelos para frente.'],
  },
  {
    id: 'rosca-alternada', origem: 'Dumbbell_Alternate_Bicep_Curl', nome: 'Rosca alternada com halteres',
    grupo: 'biceps', cat: 'pull', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', uni: true, prio: 2,
    passos: [
      'Em pé, segure um halter em cada mão ao lado do corpo, palmas viradas para dentro.',
      'Suba um halter girando o punho até a palma ficar virada para você.',
      'Desça devagar e repita com o outro braço.',
      'Mantenha os cotovelos sempre colados ao corpo.',
    ],
    erros: ['Balançar o corpo.', 'Descer rápido.'],
  },
  {
    id: 'rosca-w', origem: 'EZ-Bar_Curl', nome: 'Rosca com barra W',
    grupo: 'biceps', cat: 'pull', eq: 'barra', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 3,
    passos: [
      'Segure a barra W nas partes inclinadas, palmas para frente.',
      'Cotovelos colados ao corpo.',
      'Suba a barra até a altura do peito.',
      'Desça devagar.',
    ],
    erros: ['Usar impulso.', 'Não estender os braços no fim.'],
  },
  {
    id: 'rosca-martelo', origem: 'Hammer_Curls', nome: 'Rosca martelo',
    grupo: 'biceps', cat: 'pull', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 4,
    passos: [
      'Em pé, segure os halteres ao lado do corpo com as palmas viradas uma para a outra.',
      'Cotovelos colados ao corpo.',
      'Suba os halteres mantendo as palmas viradas para dentro.',
      'Desça devagar.',
    ],
    erros: ['Usar impulso do tronco.', 'Afastar os cotovelos do corpo.'],
  },
  {
    id: 'rosca-polia', origem: 'Standing_Biceps_Cable_Curl', nome: 'Rosca na polia',
    grupo: 'biceps', cat: 'pull', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 5,
    passos: [
      'Fique de frente para a polia baixa e segure a barra com as palmas para cima.',
      'Cotovelos colados ao corpo.',
      'Suba a barra até a altura do peito.',
      'Desça devagar.',
    ],
    erros: ['Inclinar o corpo para trás.', 'Levar os cotovelos para frente.'],
  },
  {
    id: 'rosca-scott', origem: 'Preacher_Curl', nome: 'Rosca Scott',
    grupo: 'biceps', cat: 'pull', eq: 'barra', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 6,
    passos: [
      'Sente no banco Scott com a parte de trás dos braços apoiada na almofada.',
      'Segure a barra com as palmas para cima.',
      'Suba a barra dobrando os cotovelos.',
      'Desça devagar até quase estender os braços.',
    ],
    erros: ['Tirar os braços da almofada.', 'Esticar o cotovelo de uma vez no fundo.'],
  },
  {
    id: 'rosca-concentrada', origem: 'Concentration_Curls', nome: 'Rosca concentrada',
    grupo: 'biceps', cat: 'pull', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', uni: true, prio: 7,
    passos: [
      'Sente com as pernas afastadas e apoie o cotovelo na parte de dentro da coxa.',
      'Segure o halter com o braço estendido.',
      'Suba o halter em direção ao ombro.',
      'Desça devagar. Faça as repetições e troque de braço.',
    ],
    erros: ['Mover o ombro para ajudar.', 'Descer rápido.'],
  },
  {
    id: 'rosca-inclinada', origem: 'Incline_Dumbbell_Curl', nome: 'Rosca inclinada com halteres',
    grupo: 'biceps', cat: 'pull', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 8,
    passos: [
      'Sente num banco inclinado a uns 45°, braços pendurados com os halteres.',
      'Palmas viradas para frente.',
      'Suba os halteres sem mover os cotovelos.',
      'Desça devagar até estender os braços.',
    ],
    erros: ['Tirar as costas do banco.', 'Levar os cotovelos para frente.'],
  },

  // ───────────────────────────── TRÍCEPS ─────────────────────────────
  {
    id: 'triceps-pulley', origem: 'Triceps_Pushdown', nome: 'Tríceps na polia (barra)',
    grupo: 'triceps', cat: 'push', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 1,
    passos: [
      'De frente para a polia alta, segure a barra com as palmas para baixo.',
      'Cotovelos colados ao corpo, antebraços paralelos ao chão.',
      'Empurre a barra para baixo até estender os braços.',
      'Volte devagar até os antebraços ficarem paralelos ao chão.',
    ],
    erros: ['Afastar os cotovelos do corpo.', 'Inclinar o tronco sobre a barra.'],
  },
  {
    id: 'triceps-corda', origem: 'Triceps_Pushdown_-_Rope_Attachment', nome: 'Tríceps na polia com corda',
    grupo: 'triceps', cat: 'push', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 2,
    passos: [
      'Segure a corda na polia alta com as palmas viradas uma para a outra.',
      'Cotovelos colados ao corpo.',
      'Empurre a corda para baixo e abra as mãos no final.',
      'Volte devagar.',
    ],
    erros: ['Mexer os ombros para ajudar.', 'Levar os cotovelos para frente.'],
  },
  {
    id: 'supino-fechado', origem: 'Close-Grip_Barbell_Bench_Press', nome: 'Supino fechado',
    grupo: 'triceps', sec: ['peito'], cat: 'push', eq: 'barra', tipo: 'composto', padrao: 'empurrar_horizontal', carga: 'porLado', prio: 3,
    contra: [['punho', 'leve']],
    passos: [
      'Deite no banco reto e segure a barra com as mãos na largura dos ombros.',
      'Tire a barra do suporte com os braços estendidos.',
      'Desça até a parte de baixo do peito, cotovelos junto ao corpo.',
      'Empurre de volta estendendo os braços.',
    ],
    erros: ['Pegada fechada demais, forçando os punhos.', 'Abrir os cotovelos.'],
  },
  {
    id: 'triceps-testa', origem: 'EZ-Bar_Skullcrusher', nome: 'Tríceps testa',
    grupo: 'triceps', cat: 'push', eq: 'barra', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 4,
    contra: [['punho', 'leve']],
    passos: [
      'Deite no banco segurando a barra W acima do peito, braços estendidos.',
      'Mantenha os cotovelos apontados para o teto.',
      'Dobre os cotovelos descendo a barra em direção à testa.',
      'Estenda os braços de volta.',
    ],
    erros: ['Abrir os cotovelos para os lados.', 'Mover os ombros junto.'],
  },
  {
    id: 'triceps-frances', origem: 'Standing_Dumbbell_Triceps_Extension', nome: 'Tríceps francês com halter',
    grupo: 'triceps', cat: 'push', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', prio: 5,
    passos: [
      'Sente ou fique em pé segurando um halter com as duas mãos acima da cabeça.',
      'Mantenha os cotovelos apontados para cima e perto da cabeça.',
      'Desça o halter atrás da cabeça dobrando os cotovelos.',
      'Estenda os braços de volta.',
    ],
    erros: ['Abrir os cotovelos.', 'Arquear a lombar.'],
  },
  {
    id: 'triceps-corda-alto', origem: 'Cable_Rope_Overhead_Triceps_Extension', nome: 'Tríceps na polia acima da cabeça',
    grupo: 'triceps', cat: 'push', eq: 'cabo', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'total', prio: 6,
    passos: [
      'De costas para a polia, segure a corda atrás da cabeça.',
      'Dê um passo à frente, cotovelos apontados para frente perto da cabeça.',
      'Estenda os braços à frente e para cima.',
      'Volte devagar.',
    ],
    erros: ['Abrir os cotovelos.', 'Usar o tronco para empurrar.'],
  },
  {
    id: 'triceps-coice', origem: 'Tricep_Dumbbell_Kickback', nome: 'Tríceps coice com halter',
    grupo: 'triceps', cat: 'push', eq: 'halter', tipo: 'isolado', padrao: 'isolado_bracos', carga: 'porHalter', uni: true, prio: 7,
    passos: [
      'Apoie um joelho e uma mão no banco, tronco paralelo ao chão.',
      'Com o outro braço, segure o halter com o cotovelo dobrado e colado ao corpo.',
      'Estenda o cotovelo levando o halter para trás.',
      'Volte devagar. Faça as repetições e troque de braço.',
    ],
    erros: ['Deixar o cotovelo cair.', 'Balançar o braço.'],
  },
  {
    id: 'mergulho-maquina', origem: 'Dip_Machine', nome: 'Mergulho na máquina',
    grupo: 'triceps', sec: ['peito'], cat: 'push', eq: 'maquina', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'total', prio: 8,
    contra: [['ombro', 'forte']],
    passos: [
      'Sente e ajuste o banco para as pegadas ficarem ao lado do corpo.',
      'Segure as pegadas com os cotovelos dobrados.',
      'Empurre para baixo até estender os braços.',
      'Volte devagar até uns 90°.',
    ],
    erros: ['Encolher os ombros.', 'Voltar além de 90°.'],
  },
  {
    id: 'mergulho-banco', origem: 'Bench_Dips', nome: 'Mergulho no banco',
    grupo: 'triceps', sec: ['peito'], cat: 'push', eq: 'peso_corporal', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'pesoCorpo', prio: 9,
    teto: 12, maisDificil: 'mergulho-paralela', contra: [['ombro', 'forte'], ['punho', 'leve']],
    passos: [
      'Apoie as mãos na borda de um banco atrás de você, dedos para frente.',
      'Estenda as pernas à frente (ou dobre os joelhos para facilitar).',
      'Desça o corpo dobrando os cotovelos até uns 90°.',
      'Empurre de volta até estender os braços.',
    ],
    erros: ['Descer demais, forçando o ombro.', 'Afastar o corpo do banco.'],
  },
  {
    id: 'mergulho-paralela', origem: 'Dips_-_Triceps_Version', nome: 'Mergulho na paralela',
    grupo: 'triceps', sec: ['peito'], cat: 'push', eq: 'peso_corporal', tipo: 'composto', padrao: 'empurrar_vertical', carga: 'pesoCorpo', prio: 10,
    teto: 12, assistida: ['mergulho-banco'], nivel: 'intermediario', contra: [['ombro', 'forte']],
    passos: [
      'Segure as barras paralelas e suba com os braços estendidos.',
      'Mantenha o tronco o mais reto possível.',
      'Desça dobrando os cotovelos até uns 90°.',
      'Empurre de volta até estender os braços.',
    ],
    erros: ['Descer muito fundo, forçando o ombro.', 'Balançar as pernas.'],
  },

  // ─────────────────────────────── CORE ───────────────────────────────
  {
    id: 'abdominal', origem: 'Crunches', nome: 'Abdominal (crunch)',
    grupo: 'core', cat: 'core', eq: 'peso_corporal', tipo: 'isolado', padrao: 'core', carga: 'pesoCorpo', prio: 1, teto: 20,
    passos: [
      'Deite de costas com os joelhos dobrados e os pés no chão.',
      'Mãos ao lado da cabeça, sem puxar o pescoço.',
      'Suba o tronco tirando as escápulas do chão, contraindo o abdômen.',
      'Desça devagar.',
    ],
    erros: ['Puxar a cabeça com as mãos.', 'Subir com impulso.'],
  },
  {
    id: 'abdominal-infra', origem: 'Reverse_Crunch', nome: 'Abdominal infra (reverso)',
    grupo: 'core', cat: 'core', eq: 'peso_corporal', tipo: 'isolado', padrao: 'core', carga: 'pesoCorpo', prio: 2, teto: 20,
    passos: [
      'Deite de costas, braços ao lado do corpo e pernas elevadas com os joelhos dobrados.',
      'Leve os joelhos em direção ao peito tirando o quadril do chão.',
      'Desça devagar até a posição inicial.',
      'Mantenha a lombar apoiada no chão.',
    ],
    erros: ['Balançar as pernas com impulso.', 'Deixar a lombar arquear na descida.'],
  },
  {
    id: 'abdominal-polia', origem: 'Cable_Crunch', nome: 'Abdominal na polia (ajoelhado)',
    grupo: 'core', cat: 'core', eq: 'cabo', tipo: 'isolado', padrao: 'core', carga: 'total', prio: 3,
    passos: [
      'Ajoelhe de frente para a polia alta segurando a corda ao lado da cabeça.',
      'Mantenha o quadril parado.',
      'Enrole o tronco para baixo levando os cotovelos em direção às coxas.',
      'Volte devagar.',
    ],
    erros: ['Sentar sobre os calcanhares e puxar com o quadril.', 'Puxar com os braços.'],
  },
  {
    id: 'dead-bug', origem: 'Dead_Bug', nome: 'Dead bug',
    grupo: 'core', cat: 'core', eq: 'peso_corporal', tipo: 'isolado', padrao: 'core', carga: 'pesoCorpo', prio: 4, teto: 20,
    passos: [
      'Deite de costas com os braços estendidos para o teto e os joelhos dobrados a 90° no alto.',
      'Pressione a lombar no chão.',
      'Estenda um braço para trás e a perna oposta à frente, sem encostar no chão.',
      'Volte e troque de lado. Cada lado conta uma repetição.',
    ],
    erros: ['Deixar a lombar sair do chão.', 'Fazer rápido.'],
  },
  {
    id: 'elevacao-pernas', origem: 'Flat_Bench_Lying_Leg_Raise', nome: 'Elevação de pernas no banco',
    grupo: 'core', cat: 'core', eq: 'peso_corporal', tipo: 'isolado', padrao: 'core', carga: 'pesoCorpo', prio: 5, teto: 20,
    contra: [['lombar', 'leve']],
    passos: [
      'Deite no banco reto segurando nas laterais, pernas estendidas para fora da borda.',
      'Com as pernas quase retas, eleve-as até formar 90° com o tronco.',
      'Desça devagar sem encostar os pés no chão.',
      'Mantenha a lombar apoiada.',
    ],
    erros: ['Arquear a lombar na descida.', 'Descer rápido.'],
  },
  {
    id: 'abdominal-maquina', origem: 'Ab_Crunch_Machine', nome: 'Abdominal na máquina',
    grupo: 'core', cat: 'core', eq: 'maquina', tipo: 'isolado', padrao: 'core', carga: 'total', prio: 6, nivel: 'iniciante',
    passos: [
      'Sente na máquina, ajuste o banco e segure as pegadas.',
      'Contraia o abdômen enrolando o tronco para frente.',
      'Volte devagar sem deixar o peso encostar.',
      'Mantenha o movimento curto e controlado.',
    ],
    erros: ['Puxar com os braços.', 'Usar carga alta com impulso.'],
  },
  {
    id: 'pallof', origem: 'Pallof_Press', nome: 'Pallof press',
    grupo: 'core', cat: 'core', eq: 'cabo', tipo: 'isolado', padrao: 'core', carga: 'total', uni: true, prio: 7,
    passos: [
      'Ajuste a polia na altura do peito e fique de lado para ela.',
      'Segure a pegada com as duas mãos junto ao peito, pés na largura do quadril.',
      'Estenda os braços à frente sem deixar o tronco girar.',
      'Volte as mãos ao peito. Faça as repetições e troque de lado.',
    ],
    erros: ['Deixar o tronco girar em direção à polia.', 'Ficar perto demais da máquina, sem tensão no cabo.'],
  },
  {
    id: 'abdominal-bicicleta', origem: 'Air_Bike', nome: 'Abdominal bicicleta',
    grupo: 'core', cat: 'core', eq: 'peso_corporal', tipo: 'isolado', padrao: 'core', carga: 'pesoCorpo', prio: 8, teto: 20,
    passos: [
      'Deite de costas com as mãos ao lado da cabeça e as pernas elevadas, joelhos a 90°.',
      'Leve um cotovelo em direção ao joelho oposto enquanto estende a outra perna.',
      'Troque de lado num movimento de pedalada.',
      'Conte cada lado como uma repetição.',
    ],
    erros: ['Puxar o pescoço.', 'Fazer rápido demais, sem controle.'],
  },
]
