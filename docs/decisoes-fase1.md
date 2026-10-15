# Decisões da Fase 1

A especificação (`docs/app-treino-spec.md`) deixava alguns pontos em aberto ou contraditórios. Antes de programar, eles foram listados e aprovados assim. O código cita esses códigos (A1, B6…) nos comentários.

## A. Regras do motor e da progressão

| Código | Ponto | Decisão |
|---|---|---|
| A1 | Faixa de reps da §6.5 × ciclo 8→12 da §6.8 | Todo exercício usa o ciclo 8→12. A tabela da §6.5 vale só para o descanso. O código já aceita faixa por exercício no futuro. |
| A2 | Volume semanal × duração do treino | A duração é teto. Se não couber, prioriza ênfase e compostos e avisa "volume abaixo do recomendado". Se sobrar tempo, o treino fica mais curto. |
| A3 | Grupos e aumento de volume | Grandes: peito, costas, ombros, quadríceps, posteriores, glúteos (começam em 8 séries). Pequenos (bíceps, tríceps, panturrilha, core): 6. Série vale 1 para o músculo principal e 0,5 para o secundário. 3 séries por exercício (2 a 4). A cada 3 semanas, +2 séries no grupo em que pelo menos metade dos exercícios subiu um degrau, até 16. Ênfase +35%, feminino +10%. |
| A4 | Readaptação | Dura 3 × dias por semana (máx. 4) treinos, não semanas de calendário. 2 séries na 1ª semana e 3 depois. Progressão 12→15. Descanso de "saúde geral". Ao sair, o campo de carga vem vazio mostrando a carga usada na readaptação. |
| A5 | Carga diferente da sugerida | Vale a menor carga das séries. Maior que a sugerida: vira carga nova e o ciclo recomeça em 8. Menor: o treino não conta. |
| A6 | Regressão | Toda falha desce exatamente um degrau: alvo −1; em 8, volta à carga anterior com 12; sem carga anterior, carga − incremento com alvo 8. Depois de regredir, precisa de N+1 sucessos. No modo conservador (ombro/contraindicação leve), N+2. |
| A7 | Séries não feitas | Só contam as séries planejadas marcadas como feitas. Séries extras não entram. Nenhuma feita: o treino não conta para aquele exercício. |
| A8 | Peso do corpo | 1º treino sem alvo (o que fizer em todas as séries vira o alvo). Mínimo 5 reps. Teto 20 para flexões e core, 12 para o resto. Graviton incluído sem imagem. Exercícios por tempo (prancha) ficam fora da Fase 1. |
| A9 | Incremento de carga | Máquina/cabo: 2 kg superiores, 4 kg inferiores. Halter: 2 kg por halter. Barra: 1 kg por lado (superiores), 2 kg por lado (inferiores). Ombro + empurrar: metade do incremento. O valor ajustado pelo usuário sempre vale. |
| A10 | Joelho, lombar e punho | Tabela de contraindicações proposta em `docs/contraindicacoes.md`, para revisão. "Carga conservadora" = mesma regra do ombro (menor incremento e N+1). Com ombro, nenhum mergulho é sugerido. |
| A11 | 48 h × "próximo da sequência" | A divisão respeita 48 h. Se o próximo treino cair antes disso, o app só avisa. |
| A12 | Ênfase inferior/glúteos com 4 dias | Vira Inferior/Superior/Inferior/Full body automaticamente. |

## B. Outras decisões

| Código | Decisão |
|---|---|
| B1 | Tela "Saúde" como aba própria (citada na §10, ausente na lista da §3). |
| B2 | Histórico da Fase 1 em tabelas; gráfico por exercício fica para a Fase 2. |
| B3 | "Senti dor" completo é Fase 2. Na Fase 1, trocar por "desconforto/dor" marca a dor na sessão. |
| B4 | Importar backup só com "substituir tudo". |
| B5 | Marcações por exercício: "indisponível" e "evitar" (mesmo efeito: não é sugerido). |
| B6 | Descanso no meio da faixa (2–3 min → 2:30); feminino −15%, arredondado de 5 em 5 s. |
| B7 | Pausa contada do último treino; cargas reduzidas arredondadas para baixo no incremento. Exercícios só com peso do corpo não mudam. |
| B8 | Média móvel = média dos registros dos últimos 7 dias corridos. |
| B9 | Faixa de peso adequado com IMC 18,5 a 24,9 (o exemplo da spec dá 78,9 kg com essa conta). |
| B10 | Exercício nunca feito: carga vazia com "comece leve"; sem carga, sem séries de aproximação. |
| B11 | O limite de 20 kg das séries de aproximação usa a carga total (barra + anilhas). |
| B12 | Sem nenhum backup, o lembrete conta 14 dias a partir do primeiro uso. |
| B13 | RIR só como texto de orientação (sem campo para digitar). |
| B14 | Aquecimento específico de ombro entra no tempo do treino. |
| B15 | O plano só é refeito quando muda algo que o afeta; nunca no meio de um treino. |
| B16 | Core no fim do treino, em dias alternados da sequência. |
| B17 | Ênfase inferior = quadríceps, posteriores, glúteos e panturrilha; superior = peito, costas, ombros, bíceps e tríceps; glúteos = só glúteos. |
| B18 | "Empurrar" na regra do ombro = padrões empurrar horizontal/vertical. |
| B19 | Traduções e "erros comuns" escritos para o app; recomenda-se revisão por profissional. |
| B20 | A especificação fica no repositório em `docs/`. |

## C. Ajustes pedidos depois da primeira versão

Mudanças de regra aprovadas depois de usar o app. Onde elas contradizem a especificação, vale o que está aqui.

| Código | Ponto | Decisão |
|---|---|---|
| C1 | Objetivo | Pode marcar mais de um. O descanso é a média dos descansos de cada objetivo marcado (§6.5), arredondada de 5 em 5 s. Ex: hipertrofia + emagrecimento = 1:55 nos compostos. Emagrecimento marcado com IMC baixo continua gerando o alerta da §10. |
| C2 | Ênfase | Sai a opção "Equilibrado": nada marcado = equilibrado. Dá para marcar várias (inferiores, superiores, glúteos). Superiores + inferiores juntos se anulam (glúteos, se marcado também, continua valendo). Inferiores + glúteos = inferiores. Com 4 dias, vira Inferior / Superior / Inferior / Full body quando a ênfase que sobra é só de membros inferiores. |
| C3 | Duração do treino | Barra deslizante de 30 a 120 min, de 5 em 5 (padrão 60). Abaixo de 30 não cabem aquecimento e 3 exercícios. Acima de 120 o teto de volume semanal (16 séries por grupo) não deixa preencher o tempo. O teste do motor cobre todas as durações da faixa. |
| C4 | Ordem dos exercícios | Agrupada por músculo, como numa ficha de academia (substitui a ordem geral da §6.4): aquecimento de ombro primeiro, músculos grandes antes dos pequenos (com ênfase primeiro), composto antes de isolado dentro de cada músculo, core no fim. |
| C5 | Proposta do plano | Ao terminar o onboarding, o app mostra o programa ("Treino A · Superior", "Treino B · Inferior"…, com seções por músculo) para aprovar, trocar exercício ou mudar as escolhas. A troca vale para todos os treinos em que o exercício aparece; trocar de novo substitui a troca anterior e voltar ao original desfaz. Na readaptação, a tela explica a fase e mostra como fica o plano depois. A aba Plano usa o mesmo formato. |
| C6 | Fase × perfil | Antes do primeiro treino, a fase (readaptação ou normal) acompanha o perfil. Ex: mudar o nível de "iniciante" para "intermediário" na revisão do plano tira a readaptação. Depois do primeiro treino, não muda mais por causa do nível. |
| C7 | IMC no onboarding | A mensagem do IMC vem antes das opções de objetivo. Fora da faixa adequada, aparece num bloco vermelho com a classificação em maiúsculas e negrito. O objetivo recomendado fica em negrito, com a etiqueta "Recomendado": sobrepeso e obesidade → emagrecimento; abaixo do peso → hipertrofia e saúde geral; peso adequado → nenhum. |
| C8 | Foco em superiores | Com só "Superiores" marcado, a ênfase muda a divisão, não só o volume (ficha de academia). 2 dias: peito + ombros + tríceps / costas + bíceps + pernas. 3 dias: ombros + tríceps / peito + costas + bíceps / pernas. 4 dias: os mesmos 3 + peito, costas e bíceps de novo. 5 dias: ombros + tríceps / peito + costas + bíceps / pernas / ombros + tríceps / peito + costas + bíceps. 6 dias: os 5 + pernas de novo. Pernas: 2 exercícios de quadríceps e 1 de posteriores, 3 séries cada. Sem glúteo isolado, panturrilha nem abdômen. Superiores começam com 10 séries semanais (bíceps e tríceps 8), mais a ênfase de +35%. Todo músculo do nome do dia tem pelo menos um exercício. Nenhum músculo se repete em dias seguidos. |
| C9 | Readaptação | Segue a divisão escolhida (não força mais full body, nem o limite de 4 dias). Usa os mesmos exercícios da fase normal, só mais leve: 2 séries na 1ª semana e até 3 depois, 12 a 15 repetições, RIR 3-4. Dura 3 semanas = 3 × dias por semana treinos. Substitui a regra de full body da §6.1. |
| C10 | Número de treinos | Campo próprio no perfil, logo depois de "Dias por semana": quantos treinos diferentes (A, B, C…), de 2 até o número de dias. Os treinos se revezam nos dias (5 dias com 3 treinos = A, B, C, A, B, C…). Sugestão: 2 dias → 2, 3 → 3, 4 → 4, 5 → 3, 6 → 3. A divisão é escolhida pelo número de treinos; o volume semanal considera quantas vezes cada treino cai na semana. Perfis antigos recebem a sugestão para os dias deles. |
| C11 | Músculos de cada treino | Na proposta do plano e na aba Plano, "Mudar músculos deste treino" deixa escolher quais músculos cada treino trabalha (inclusive abdômen). O app remonta os exercícios para esses músculos, com pelo menos um exercício por músculo marcado. Mesmo músculo em treinos seguidos: o app só avisa. Mudar nível, dias, número de treinos ou ênfase no perfil volta à divisão sugerida. Também dá para voltar à sugestão pelo próprio diálogo. |
| C12 | Data de nascimento | Campo de texto com máscara DD/MM/AAAA (teclado numérico), em vez do seletor de data. Data incompleta ou inexistente (ex: 31/02) mostra erro. |
| C13 | Usar o tempo escolhido | Depois de bater a meta semanal, se sobra tempo no treino, o app coloca mais exercícios nos músculos daquele treino (o músculo com menos exercícios primeiro; até 4 exercícios nos grandes e 3 nos pequenos), depois mais séries (até 4), sem passar da duração nem do teto semanal (16 séries, +35% com ênfase). O dia de pernas do foco em superiores continua com uns 3 exercícios. Se o corte por tempo deixar um músculo escolhido sem exercício, o app tira um de outro músculo do mesmo treino para dar lugar. |
| C14 | Incluir exercício | Cada músculo do treino tem "+ incluir exercício": lista todos os exercícios do músculo permitidos pelas limitações, com 3 séries e o tempo aproximado (§6.4), avisando se passa do tempo escolhido. O incluído fica fixo (o motor não corta), aparece com "Remover" e o app avisa se o treino passar da duração. Exercício trocado pela pessoa não volta como extra no mesmo treino. |
| C15 | Excluir exercício | Cada exercício do plano tem "✕" (excluir). Ele sai só daquele treino e nada entra no lugar (o treino fica mais curto). Os excluídos aparecem no fim do treino com "Desfazer". Se um músculo do treino ficar sem exercício, o app avisa. Exercício incluído pela pessoa continua com "Remover". |
| C16 | Fuso horário | O app trabalha sempre no horário de Brasília (GMT-3, America/Sao_Paulo), não no fuso do aparelho: "hoje", datas do histórico, peso do dia, pausa e lembretes. O histórico mostra a data e a hora de início ("13 out 2026 às 21:30") e a duração por extenso ("1 h 05 min"). |
| C17 | Modo escuro | Sem o tom azul-escuro: fundo quase preto e cartões cinza-escuro (cinzas neutros no app todo). |
| C18 | Nada de full body | O app nunca sugere treino full body. 2 treinos: Superior / Inferior; 3: Push / Pull / Legs (qualquer nível); 4: Superior / Inferior ×2 (ênfase só em inferiores começa por Inferior); 5: Superior / Inferior / Push / Pull / Legs; 6: Push / Pull / Legs ×2. Treinos seguidos nunca repetem músculo, nem o abdômen (com número ímpar de treinos, o último não tem abdômen, porque o seguinte é o A). Substitui o full body da §6.2 e o A12. |
| C19 | Frequência por músculo | Base: Schoenfeld et al. 2016 (treinar cada músculo 2×/semana dá mais hipertrofia que 1×). Se algum músculo fica abaixo de 1,5×/semana, o app avisa na escolha do número de treinos e no plano, e sugere menos treinos diferentes (que se revezam mais). A sugestão padrão passou a ser 3 dias → 2 treinos (Superior/Inferior, 1,5×). Com 2 dias não há como chegar a 2× sem full body: o app só avisa. Pernas no foco em superiores e abdômen ficam fora da conta. |
| C20 | Descanso mínimo entre séries | 60 s em qualquer objetivo (Singer et al. 2024: pequeno ganho acima de 60 s; nada a mais acima de 90 s). Emagrecimento nos isolados passou de 55 s para 60 s. |
| C21 | Nível avançado | Novo nível "Avançado" (treina há anos). Não passa pela readaptação, pode receber exercícios de nível avançado e começa no topo da faixa de volume (10 séries semanais nos músculos grandes, §6.3). |
| C22 | 3 séries por exercício | 3 séries é o padrão de todo exercício (4 no máximo, quando sobra tempo). Na readaptação, 3 séries desde a 1ª semana (antes eram 2, A4). O corte por tempo tira exercício em vez de deixar com 2 séries. |
| C23 | Usar o tempo | A readaptação também usa o tempo (completa com mais exercícios, já que o máximo lá é 3 séries). O teto semanal ao completar o tempo subiu para 20 séries por músculo (+35% com ênfase). Até 60 min, todo treino sugerido usa pelo menos 75% do tempo; acima disso o teto pode deixar alguns treinos mais curtos. No foco em superiores, o dia de pernas continua com 3 exercícios (só ganha séries). |
| C24 | Sugestão de treinos | Com mais dias, a sugestão acompanha: 4 dias → 4 treinos, 5 → 5, 6 → 6 (A a F). 3 dias continua com 2 treinos (C19: com 3 treinos cada músculo treinaria só 1×/semana). |

O banco local passou para a versão 2 (e depois 3, com o número de treinos). Quem já tinha o app instalado tem o perfil convertido automaticamente: objetivo vira lista de um item, "Equilibrado" vira nenhuma ênfase e a duração é mantida. Backups da versão 1 continuam podendo ser importados.

## Interpretações feitas durante a implementação

- **Nível "retornando"** recebe exercícios de nível iniciante e intermediário (só "iniciante" fica restrito aos de nível iniciante).
- **Readaptação curta (ex: 30 min):** se nem 3 compostos cabem com 3 séries, usa 2 séries (dentro dos "2 a 3" da spec).
- **Máquina assistida (graviton):** a carga é a ajuda; progredir = diminuir a ajuda.
- **Séries de aproximação são opcionais:** podem ser marcadas, mas não são necessárias para concluir o exercício.
- **Troca com séries já feitas:** as feitas ficam no exercício original; o substituto recebe as que faltavam.
- **Finalizar sem nenhuma série de trabalho marcada** descarta o treino (não conta na sequência nem na readaptação).
- **Versão nova do app** só entra quando o app é fechado e aberto de novo (nunca no meio de um treino). O aviso "Nova versão disponível" é da Fase 2.
