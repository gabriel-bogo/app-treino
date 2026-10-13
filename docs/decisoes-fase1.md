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

O banco local passou para a versão 2. Quem já tinha o app instalado tem o perfil convertido automaticamente: objetivo vira lista de um item, "Equilibrado" vira nenhuma ênfase e a duração é mantida. Backups da versão 1 continuam podendo ser importados.

## Interpretações feitas durante a implementação

- **Nível "retornando"** recebe exercícios de nível iniciante e intermediário (só "iniciante" fica restrito aos de nível iniciante).
- **Readaptação curta (ex: 30 min):** se nem 3 compostos cabem com 3 séries, usa 2 séries (dentro dos "2 a 3" da spec).
- **Máquina assistida (graviton):** a carga é a ajuda; progredir = diminuir a ajuda.
- **Séries de aproximação são opcionais:** podem ser marcadas, mas não são necessárias para concluir o exercício.
- **Troca com séries já feitas:** as feitas ficam no exercício original; o substituto recebe as que faltavam.
- **Finalizar sem nenhuma série de trabalho marcada** descarta o treino (não conta na sequência nem na readaptação).
- **Versão nova do app** só entra quando o app é fechado e aberto de novo (nunca no meio de um treino). O aviso "Nova versão disponível" é da Fase 2.
