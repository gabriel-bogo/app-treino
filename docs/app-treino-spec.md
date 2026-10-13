# Especificação: App de Treino (PWA pessoal)

> Documento de entrada para o Claude Code. Leia inteiro antes de começar. Em caso de dúvida sobre regra de negócio, pergunte antes de inventar.

## 1. Visão geral

App pessoal de academia para uso próprio e de pessoas próximas (inicialmente 2 a 5 usuários), cada um no próprio celular e com o próprio perfil. **Nada é fixo no código para um usuário específico:** toda personalização (sexo, ênfase, limitações, equipamentos) vem do perfil preenchido no onboarding. Quem recebe o link instala e começa do zero, com os dados só no próprio aparelho. Objetivo: montar sugestão de treino automática com base no perfil, registrar cargas e repetições e sugerir progressão.

Princípios:
- **Privacidade total:** sem servidor, sem login, sem analytics, sem chamadas externas em tempo de execução. Todos os dados ficam no aparelho.
- **Sem propaganda, sem cadastro.**
- **Mobile-first**, uso com uma mão durante o treino, botões grandes, modo escuro.
- **Interface 100% em português do Brasil.**
- **Funciona offline** depois de instalado.

### Repositório público (open source)
O código fica em repositório **público** no GitHub (`app-treino`). Qualquer pessoa pode clonar, publicar a própria cópia e usar.
- **Licença MIT** (arquivo `LICENSE`)
- **README.md** em PT-BR com: o que o app faz, aviso de saúde, como instalar no iPhone/Android, como publicar a própria cópia na Vercel (passo a passo para leigo) e como rodar localmente
- **Créditos** no README e na tela "Sobre": dataset Free Exercise DB (Unlicense)
- **Aviso de saúde** no README, no onboarding (aceite obrigatório na primeira abertura) e na tela "Sobre": o app dá sugestões gerais, não substitui médico, fisioterapeuta, educador físico ou nutricionista; uso por conta e risco
- **Nenhum dado pessoal no repositório:** nada de nomes, pesos, históricos ou perfis reais em código, testes, seeds ou exemplos. Usar dados fictícios
- **Nenhum segredo:** o app não usa chaves de API nem variáveis de ambiente sensíveis. Se em algum momento precisar, nunca commitar (`.env` no `.gitignore`)
- **`.gitignore`** inclui arquivos de backup do app (`app-treino-backup-*.json`) para ninguém subir o próprio backup por engano
- Código e comentários organizados para que outra pessoa consiga entender e contribuir; regras de negócio do motor de treino documentadas no próprio código com referência às seções deste documento

## 2. Stack técnica

- React + Vite + TypeScript
- `vite-plugin-pwa` (manifest + service worker, cache de todos os assets para uso offline)
- IndexedDB via **Dexie.js** para persistência local
- Tailwind CSS
- Hospedagem estática na **Vercel** (HTTPS obrigatório para instalar como PWA)
- Sem backend, sem banco remoto

### Particularidades do iPhone (Safari / PWA)
- Instalação via Safari: Compartilhar > "Adicionar à Tela de Início". Criar uma tela de ajuda explicando isso.
- Manifest com `display: standalone`, ícones e `apple-touch-icon`.
- Chamar `navigator.storage.persist()` na inicialização para pedir armazenamento persistente.
- iOS não suporta vibração via web nem notificação local sem servidor de push. O timer de descanso deve ser **visual + som**, funcionando com o app aberto. Não implementar push.
- Tentar manter a tela ligada durante o treino usando Screen Wake Lock API **se disponível** (com fallback silencioso).

## 3. Telas

1. **Onboarding / Perfil** (primeiro acesso, editável depois)
2. **Início:** próximo treino sugerido, botão "Começar treino", lembrete de backup se atrasado
3. **Plano da semana:** visão de todos os dias de treino gerados
4. **Treino em andamento:** exercício atual, séries, campos de carga e reps, timer de descanso, botão "como fazer", botão "senti dor / trocar exercício"
5. **Histórico:** sessões passadas e evolução de carga por exercício (gráfico simples)
6. **Biblioteca de exercícios:** listar, filtrar por grupo muscular, marcar como "indisponível na minha academia"
7. **Configurações:** perfil, backup (exportar/importar), sobre/instalação

### Detalhe da tela de Treino em andamento
- Cada exercício mostra suas séries como linhas: nº da série, carga (kg), reps e um **check de "série feita"**
- Carga e reps vêm **pré-preenchidas** com a sugestão (ou com o último registro). Se fez igual, basta tocar no check. Se mudou, ajusta com botões +/- (carga pelo `incrementoCarga`, reps de 1 em 1) antes de marcar
- Contador visível no topo do exercício: **"2 de 3 séries"**
- Ao marcar a série, o **timer de descanso inicia automaticamente** com o tempo previsto para aquele exercício (seção 6.5/6.6)
- Timer com botões **+15s / -15s** e **Pular**; som ao terminar
- Registrar o descanso real feito (do check até o check da próxima série)
- Permitir adicionar série extra ou remover série
- Exercício com todas as séries marcadas fica como concluído e o app avança para o próximo
- Barra de progresso geral do treino (exercícios concluídos / total) e cronômetro da sessão
- **Fora da ordem:** botão "deixar pra depois" move o exercício para o fim da fila (sem trocar). Também é possível tocar em qualquer exercício da lista e começar por ele
- **Treino nunca se perde:** salvar no IndexedDB a cada toque (série marcada, carga alterada). Se o iPhone fechar o app, ao abrir de novo mostrar "Continuar treino em andamento?" com o timer e o ponto exato onde parou. Sessão aberta há mais de 4 h: perguntar se quer finalizar com o que foi registrado

## 4. Perfil do usuário

Um perfil por aparelho.

| Campo | Valores |
|---|---|
| Nome | texto |
| Sexo | feminino, masculino |
| Data de nascimento | data (idade calculada automaticamente) |
| Altura | cm |
| Peso inicial | kg (vira o primeiro registro da seção 10) |
| Nível | iniciante, retornando após pausa, intermediário |
| Objetivo | hipertrofia, emagrecimento/condicionamento, saúde geral |
| Ênfase | equilibrado, inferior, superior, glúteos |
| Dias por semana | 2 a 6 |
| Duração do treino | 30, 45, 60, 75, 90 min |
| Limitações | nenhuma, joelho, lombar, ombro, punho (múltipla escolha) |
| Equipamentos indisponíveis | herdado da biblioteca |

**Importante:** o sexo NÃO define a ênfase. A ênfase é escolha do usuário. O sexo só faz ajustes finos (seção 6.6).

## 5. Biblioteca de exercícios

### Fonte
Usar o dataset **Free Exercise DB** (github.com/yuhonas/free-exercise-db), licença Unlicense (domínio público, uso livre).
- Contém ~870 exercícios com grupo muscular primário/secundário, equipamento, nível, instruções (em inglês) e imagens de demonstração.

### Curadoria (fazer em build, não em runtime)
- Selecionar um subconjunto de **~80 a 120 exercícios** típicos de academia comercial (máquinas, halteres, barra, cabo, peso corporal).
- **Baixar as imagens para dentro do projeto** (`/public/exercises/`). O app nunca busca imagens na internet em uso.
- **Traduzir para PT-BR** nome e instruções dos exercícios selecionados, usando nomes populares no Brasil (ex: "supino reto", "puxada frontal", "cadeira extensora", "stiff", "elevação pélvica").
- Gerar um `exercises.ptbr.json` final versionado no repositório.

### Campos adicionais por exercício (além dos do dataset)
- `tipo`: composto | isolado
- `padrao`: empurrar_horizontal, empurrar_vertical, puxar_horizontal, puxar_vertical, agachar, dobrar_quadril, isolado_bracos, isolado_pernas, core, panturrilha
- `contraindicacoes`: lista de limitações que excluem ou alertam (ex: agachamento livre pesado com `joelho` e `lombar` = alerta)
- `substitutos`: ids de exercícios equivalentes
- `incrementoCarga`: menor incremento sugerido (kg)

### Demonstração ("como fazer")
- O dataset tem imagens estáticas por exercício (normalmente posição inicial e final). Exibir **alternando as imagens a cada ~1 segundo** para simular a animação do movimento.
- Abaixo, instruções curtas em PT-BR (3 a 5 passos) + 1 ou 2 erros comuns.
- Botão opcional "Ver vídeo no YouTube" que abre uma busca pelo nome do exercício em nova aba (único ponto que sai do app, sempre por ação do usuário).
- Permitir que o usuário adicione exercícios próprios (sem imagem obrigatória).

## 6. Motor de sugestão de treino

> Regras baseadas em princípios gerais de treinamento resistido. Não é prescrição médica. Mostrar aviso na primeira abertura recomendando avaliação profissional em caso de condição de saúde ou dor.

### 6.1 Fase de readaptação
Se nível = iniciante ou retornando: primeiras **3 semanas** em readaptação.
- Full body, independente da divisão escolhida (máximo 4 dias na semana nessa fase)
- 2 a 3 séries por exercício
- Faixa de 12 a 15 repetições
- Terminar cada série com 3 a 4 repetições "sobrando" (RIR 3-4)
- Ao final, o app avisa e passa para a divisão normal

### 6.2 Divisão conforme dias por semana
| Dias | Divisão |
|---|---|
| 2 | Full body A / B |
| 3 | Full body A / B / C (iniciante/retornando) ou Push / Pull / Legs (intermediário) |
| 4 | Superior / Inferior / Superior / Inferior |
| 5 | Superior / Inferior / Push / Pull / Legs |
| 6 | Push / Pull / Legs x2 |

Agrupamentos:
- **Push:** peito, ombro (anterior/lateral), tríceps
- **Pull:** costas, bíceps, deltoide posterior
- **Legs:** quadríceps, posteriores de coxa, glúteos, panturrilha
- **Core:** encaixa em qualquer dia, preferencialmente no fim

Ênfase "inferior" ou "glúteos" com 4 dias pode virar Inferior / Superior / Inferior / Full body.

O próximo treino é o **próximo da sequência**, não fixo por dia da semana (se faltar um dia, não pula treino).

### 6.3 Volume semanal (séries por grupo muscular)
- Pós-readaptação: começar com **8 a 10 séries semanais** por grupo grande
- Subir gradualmente até **12 a 16** ao longo das semanas se a progressão estiver acontecendo
- Grupo com ênfase: **+30 a 40%** de volume
- Grupos sem ênfase: podem reduzir, mas **mínimo de 6 séries** semanais
- Mesmo grupo muscular com intervalo mínimo de **48h**

### 6.4 Duração do treino define a quantidade de exercícios
- Reservar ~8 min para aquecimento
- Estimativa por série: composto = 3 min (execução + descanso), isolado = 2 min
- Preencher o tempo restante, priorizando compostos
- Ordem: compostos grandes > compostos menores > isolados > core

### 6.5 Faixas e descanso padrão (pós-readaptação)
| Objetivo | Compostos | Isolados | Descanso composto | Descanso isolado |
|---|---|---|---|---|
| Hipertrofia | 6-10 reps | 10-15 reps | 2-3 min | 60-90 s |
| Emagrecimento/condicionamento | 10-15 | 12-20 | 60-90 s | 45-60 s |
| Saúde geral | 8-12 | 12-15 | 90 s | 60 s |

RIR alvo: 1 a 3.

### 6.6 Ajustes finos por sexo
- Feminino: descanso **~15% menor** e tolerância de volume **~10% maior**
- Mais nada muda por sexo

### 6.7 Limitações
- Exercício com contraindicação **forte** para a limitação: não sugerir, usar substituto
- Contraindicação **leve**: sugerir com alerta visual e carga conservadora

**Regras gerais de limitações:**
- No onboarding o padrão é **"nenhuma"**; a pessoa só marca se quiser
- Limitações podem ser ativadas e desativadas a qualquer momento no perfil (ex: recuperou da lesão, desmarca e o app volta ao normal no próximo treino)
- Ao desativar uma limitação, os exercícios de empurrar voltam ao incremento e ao N padrão, sem apagar o histórico

**Limitação "ombro" (ex: lesão ou histórico de lesão no manguito rotador):**
- Preferir halteres e pegada neutra a barra em empurrar horizontal e vertical (ex: supino com halteres no lugar de supino reto com barra como padrão)
- Não sugerir: desenvolvimento por trás da nuca, puxada por trás da nuca, remada alta, mergulho em paralela profundo
- Supino reto com barra e desenvolvimento com barra: contraindicação **leve** (permitido, com alerta)
- Em exercícios de empurrar: incremento de carga **menor** (o menor disponível) e **N + 1** treinos para confirmar cada degrau do ciclo 6.8
- Aquecimento específico obrigatório nos dias com empurrar (ver 6.11)
- Texto fixo na tela de perfil: "Confirme com seu fisioterapeuta quais exercícios evitar." O usuário pode marcar qualquer exercício como "evitar" manualmente

### 6.8 Progressão (ciclo 8 → 12 repetições)
Regra central do app. Vale por exercício, de forma independente.

**Ciclo:**
1. Carga nova começa com alvo de **8 repetições** em todas as séries
2. Depois de **N treinos confirmados** naquela meta, o alvo sobe **+1 repetição** (8 → 9 → 10 → 11 → 12), mesma carga
3. Ao confirmar **12 repetições**, o app sobe a carga pelo `incrementoCarga` (padrão 2 kg superiores, 4 kg inferiores, ou o menor salto disponível no aparelho) e o alvo volta para **8**
4. O ciclo se repete indefinidamente

- `N` (treinos para confirmar) é configurável por perfil: 1 a 3, **padrão 2**
- A faixa 8-12 é o padrão para todos os exercícios fora da readaptação. Deixar a faixa editável por exercício (ex: 10-15 em isolados pequenos) para o futuro, sem mudar a lógica
- Na fase de readaptação (6.1) a faixa é 12-15 com cargas leves; ao sair dela, cada exercício entra no ciclo em 8 reps com a carga que o usuário confirmar

**Como o app classifica cada treino do exercício:**
| Resultado | Critério | Efeito |
|---|---|---|
| Sucesso | bateu o alvo em todas as séries | conta 1 confirmação |
| Manter | errou o alvo por 1 rep em só 1 série | não conta, não regride, repete a meta |
| Falha | errou por 2+ reps em alguma série, ou errou em 2+ séries | aciona regressão |

**Regressão (falhou após um aumento):**
- Falhou com **carga nova**: volta para a carga anterior com alvo de 12 reps
- Falhou com **repetição nova**: volta para o alvo anterior (ex: 10 → 9), mesma carga
- Depois de regredir, o app **segura por N+1 treinos** (padrão 3) naquele ponto antes de sugerir o aumento de novo
- Registrar cada aumento e regressão no histórico do exercício (para gráficos e para a estagnação)

**Exercício estagnado:**
- 2 regressões no mesmo degrau, ou 6 treinos seguidos sem subir nenhum degrau
- Efeito: card sugerindo trocar por substituto (regras da 6.10) ou fazer deload só daquele exercício

**Deload:**
- A cada 6 a 8 semanas, ou quando a estagnação geral disparar (seção 10)
- Semana com ~50% das séries e carga ~10% menor; depois retoma o ciclo de onde parou

### 6.9 "Senti dor"
- Botão durante o treino marca o exercício com flag de dor na sessão
- Sugere substituto imediato
- Se marcado 2 vezes no mesmo exercício: tira do plano automaticamente e avisa para procurar avaliação profissional

### 6.10 Substituir exercício durante o treino
Botão **"Trocar exercício"** sempre visível em cada exercício do treino em andamento.

**Motivo (seleção rápida, 1 toque):** aparelho ocupado, academia não tem o equipamento, desconforto/dor, outro.

**Regras para gerar candidatos:**
1. Mesmo **músculo primário** do exercício original
2. **Excluir** o exercício original e **todos os exercícios do treino do dia** (já feitos e ainda pendentes), para não repetir
3. Respeitar limitações do perfil (6.7) e equipamentos marcados como indisponíveis
4. Ordenar por prioridade: mesmo `padrao` de movimento > mesmo `tipo` (composto/isolado) > nível compatível
5. Se o motivo for "aparelho ocupado" ou "não tem o equipamento", priorizar equipamento **diferente** do original
6. Se não houver candidato com o mesmo músculo primário, usar exercícios onde ele é músculo secundário. Se ainda assim não houver, oferecer "Pular exercício"

**Exibição:**
- Mostrar até 3 sugestões, cada uma com etiqueta do equipamento e botão "como fazer"
- Filtro rápido: **Com máquina** (máquina, cabo) / **Sem máquina** (halter, barra, peso corporal, elástico)
- Link "ver todos" para escolher manualmente da biblioteca filtrada pelo mesmo músculo

**Após escolher:**
- Mantém séries, faixa de reps e descanso do original
- Carga sugerida: última carga registrada naquele exercício substituto; se nunca foi feito, campo vazio com aviso "comece leve"
- Perguntar: **"Só hoje"** (padrão) ou **"Trocar no plano"**
- Se o motivo foi "não tem o equipamento", oferecer marcar o original como indisponível na biblioteca
- Registrar no histórico que houve substituição (original, substituto, motivo)

### 6.11 Aquecimento
- **Geral:** 5 min de cardio leve (esteira, bike, elíptico) no início, com timer opcional
- **Específico de ombro:** se o perfil tem limitação "ombro", nos dias com empurrar o app insere antes do primeiro exercício: rotação externa com elástico ou cabo (2 séries de 15) e face pull leve (2 séries de 15)
- **Séries de aproximação:** antes do **primeiro exercício composto** de cada grupo grande no dia:
  - Carga de trabalho até 20 kg: 1 série com ~50% x 10
  - Acima de 20 kg: ~50% x 10, depois ~70% x 5
  - Arredondar pelo incremento real do exercício (6.14)
- Séries de aquecimento aparecem na tela com outra cor, podem ser marcadas como feitas, **não entram** na progressão, no volume nem na estagnação
- Botão para pular o aquecimento (com aviso leve)

### 6.12 Retorno após pausa
- Se ficar **10 a 20 dias** sem treinar: cargas -10% no primeiro treino de volta, alvo de reps mantido
- **Mais de 20 dias**: cargas -20% e alvo de 8 reps
- **Mais de 60 dias**: perguntar se quer refazer a fase de readaptação (6.1)
- Depois disso o ciclo 6.8 segue normal a partir da carga reduzida
- Mostrar card explicando o ajuste

### 6.13 Exercícios com peso do corpo
Barra fixa, flexão, paralela, abdominais e similares têm regra própria:
- Ciclo por repetições: sobe +1 rep a cada N treinos confirmados até um teto (padrão 12; flexão e abdominais 20)
- Ao chegar no teto, o app oferece: **adicionar carga** (cinto/colete/halter, entra no ciclo 6.8 com 8 reps) ou **variação mais difícil** (ex: flexão → flexão com pés elevados)
- Se o usuário não consegue o mínimo (ex: menos de 5 barras): sugerir versão assistida (barra assistida/graviton, elástico, flexão inclinada) com ciclo normal
- Regressão igual à 6.8

### 6.14 Como a carga é registrada
Cada exercício define `tipoCarga`, mostrado como etiqueta ao lado do campo:
- `total` (máquinas, cabo): carga do pino/marcador
- `porHalter`: peso de **um** halter
- `porLado`: anilhas de **um** lado da barra, com campo de peso da barra (padrão 20 kg) e total calculado
- `pesoCorpo`: só reps, ou reps + carga extra
- Exercícios unilaterais registram reps **por lado**

`incrementoCarga` editável pelo usuário por exercício (ex: máquina que só sobe de 5 em 5 kg). A progressão nunca sugere carga impossível de montar naquele exercício.

## 7. Modelo de dados (IndexedDB / Dexie)

- `profile` (único registro)
- `exercises` (biblioteca base, carregada do JSON)
- `customExercises`
- `unavailableEquipment` / flags de exercício indisponível
- `plan` (plano ativo: fase, divisão, semana atual, data de início)
- `planDays` (treinos A, B, C...)
- `planExercises` (exercício, ordem, séries, faixa de reps, descanso, carga sugerida)
- `sessions` (data, planDay, duração real, observações)
- `setLogs` (sessão, exercício, nº série, carga, reps, RIR opcional, flag dor)
- `settings` (último backup, preferências de som)
- `bodyLogs` (data, peso kg, cintura cm opcional, observação)

Todas as tabelas com campo `schemaVersion` ou versionamento via Dexie para migrações.

## 8. Backup manual

- **Exportar:** gera um arquivo `app-treino-backup-AAAA-MM-DD.json` com todos os dados + versão do schema + data. Usar Web Share API quando disponível (no iPhone abre a folha de compartilhamento para salvar em Arquivos / iCloud / WhatsApp), com fallback para download.
- **Importar:** seleciona arquivo, valida estrutura e versão, mostra resumo (nº de sessões, datas) e pede confirmação. Opção "substituir tudo".
- **Lembrete:** na tela inicial, se o último backup tiver mais de 14 dias.

### Atualização do app (Fase 2)
- Quando houver nova versão publicada, mostrar aviso "Nova versão disponível" com botão Atualizar (nunca atualizar no meio de um treino)
- Antes de qualquer migração de schema do Dexie, gerar **backup automático** local (cópia no próprio IndexedDB, mantém as 3 últimas) e oferecer exportar
- Se a migração falhar, restaurar o backup automático e avisar

## 9. Fases de entrega

**Fase 1 (MVP)**
- Setup do projeto, PWA instalável, offline
- Perfil + onboarding
- Biblioteca curada em PT-BR com imagens locais
- Motor de sugestão (seções 6.1 a 6.7)
- Tela de treino com registro e timer
- Progressão 8 → 12 com regressão automática (6.8, sem deload)
- Regras de ombro (6.7), aquecimento (6.11), retorno após pausa (6.12), peso do corpo (6.13), registro de carga e incremento editável (6.14)
- Fora da ordem e retomada de treino interrompido (seção 3)
- Substituir exercício durante o treino (6.10)
- Registro diário de peso/cintura com média móvel e gráfico (seção 10, sem detecção de estagnação)
- Classificação de peso por IMC e cintura, com faixa de peso adequado (seção 10)
- Histórico básico
- Exportar/importar backup

**Fase 2**
- Exercício estagnado e deload (6.8)
- "Senti dor" com substituição (6.9)
- Gráficos de evolução por exercício
- Exercícios personalizados
- Detecção de estagnação de peso com sugestões (seção 10)
- Aviso de nova versão e backup automático antes de migração (seção 8)

**Fora do escopo por enquanto**
- Login, sincronização em nuvem, notificações push
- Integração com Apple Saúde ou relógio
- IA generativa

## 10. Registro de saúde

### Registro diário de peso
- Na tela inicial, card "Registrar peso de hoje" com teclado numérico (1 casa decimal). Um registro por dia; registrar de novo no mesmo dia substitui
- Campo opcional de **circunferência da cintura** (cm), sugerido 1x por semana
- Lembrete na tela inicial se não registrou hoje (sem notificação, só visual)

### Como mostrar a evolução
- O peso diário oscila 1 a 2 kg por água, sal, carboidrato e intestino. Por isso o app **nunca compara um dia com o outro**
- Usar **média móvel de 7 dias** como número principal ("peso de tendência")
- Gráfico: pontos do peso diário (claros) + linha da média móvel (destaque)
- Resumo: variação da média na última semana, últimas 4 semanas e desde o início
### Classificação de peso (IMC + cintura)
IMC = peso (kg) / altura (m)². Calculado sobre a **média móvel de 7 dias**, não sobre o peso do dia.

**Adultos de 18 a 59 anos (faixas da OMS):**
| IMC | Classificação |
|---|---|
| abaixo de 18,5 | Abaixo do peso |
| 18,5 a 24,9 | Peso adequado |
| 25 a 29,9 | Sobrepeso |
| 30 a 34,9 | Obesidade grau I |
| 35 a 39,9 | Obesidade grau II |
| 40 ou mais | Obesidade grau III |

**60 anos ou mais (faixas usadas pelo Ministério da Saúde para idosos):** abaixo de 22 = baixo peso, 22 a 27 = adequado, acima de 27 = sobrepeso.

**Menores de 18 anos:** não classificar (IMC infantil depende de curvas por idade). Mostrar só o valor e recomendar avaliação profissional.

**Cintura (risco cardiometabólico, referência OMS):**
| | Risco aumentado | Risco muito aumentado |
|---|---|---|
| Homem | 94 cm ou mais | 102 cm ou mais |
| Mulher | 80 cm ou mais | 88 cm ou mais |

**Como mostrar:**
- Card na tela de saúde com: classificação atual, IMC, **faixa de peso adequado para a altura** (ex: "Para 1,78 m: 58,6 a 79,0 kg") e quanto falta para entrar na faixa, se estiver fora
- Barra visual com as faixas e um marcador da posição atual
- Classificação de cintura ao lado, se houver registro
- Texto fixo: "IMC é uma estimativa. Não diferencia músculo de gordura: pessoas musculosas podem aparecer como sobrepeso. A cintura ajuda a complementar."
- Se IMC indicar sobrepeso mas cintura estiver abaixo do risco: mensagem "provável massa muscular, IMC pode estar superestimando"
- Linguagem neutra e informativa, sem julgamento

**Coerência com o objetivo do perfil:**
- Ao escolher o objetivo no onboarding, mostrar a classificação como contexto (ex: sobrepeso → "emagrecimento pode ser um bom objetivo para você")
- Se a pessoa estiver **abaixo do peso** (ou com IMC até 19,9) e escolher **emagrecimento**: mostrar alerta recomendando conversar com médico ou nutricionista, sugerir "saúde geral" ou "hipertrofia", e **desativar** as sugestões de estagnação voltadas a perder peso
- Obesidade grau II ou III: recomendar liberação médica antes de começar, e manter a fase de readaptação mesmo que o nível seja "intermediário"

### Detecção de estagnação (Fase 2)
Janela de análise: últimas **3 semanas**. O app cruza três indicadores:

1. **Peso:** variação da média móvel de 7 dias contra a de 3 semanas antes
2. **Cintura:** variação, se houver registros
3. **Força:** usando o ciclo da 6.8
   - % de exercícios do plano que subiram pelo menos um degrau (rep ou carga) na janela
   - Volume de carga por grupo muscular (carga × reps × séries) contra as 3 semanas anteriores

**Força estagnada** = menos de 30% dos exercícios subiram degrau na janela, OU volume de carga caiu/ficou estável na maioria dos grupos.

| Situação | Sugestões do app |
|---|---|
| Força evoluindo, peso estável, cintura caindo ou estável | Mensagem positiva: provável recomposição corporal. Não mexer no treino |
| Força evoluindo, peso não cai (objetivo emagrecimento) | Treino está funcionando; lembrar que o fator principal é alimentação. Sugerir cardio leve ou mais caminhada |
| Força estagnada, qualquer peso | Sugerir deload de 1 semana; se persistir após o deload, sugerir trocar divisão ou exercícios estagnados |
| Força estagnada + peso caindo rápido (mais de 1% do peso por semana) | Alerta: possível déficit exagerado, comendo pouco para o treino. Recomendar nutricionista |
| Força estagnada + peso subindo (objetivo hipertrofia) | Revisar sono e recuperação; sugerir deload |

Regras:
- Exigir pelo menos **14 dias de registros de peso** e **6 treinos** nas últimas 3 semanas para avaliar; com menos dados, não sugerir nada (sem treinos suficientes, avaliar só o peso)
- Sugestões aparecem como card na tela inicial com opção "aplicar ao plano" ou "dispensar". Nunca alterar o plano sozinho
- Não sugerir dietas, calorias ou suplementos. Para alimentação, recomendar acompanhamento com nutricionista

## 11. Critérios de aceite do MVP

- Instala no iPhone pelo Safari e abre em tela cheia
- Funciona em modo avião depois de instalado
- Nenhuma requisição de rede em uso normal (verificar no DevTools)
- Gera plano coerente para todas as combinações de dias (2-6) e duração (30-90)
- Registrar um treino completo com no máximo 2 toques por série
- Substituição nunca sugere exercício que já está no treino do dia nem o próprio original
- Fechar o app no meio do treino e reabrir retoma exatamente do mesmo ponto
- Com limitação "ombro", nenhum exercício da lista proibida aparece em plano, substituição ou sugestão
- Nenhuma carga sugerida é impossível de montar com o incremento configurado
- Testes automatizados da progressão 6.8: ciclo completo 8 → 12 → nova carga em 8, regressão de carga, regressão de repetição e espera de N+1 treinos
- Exportar, apagar os dados do app e importar de volta sem perda
- README permite que uma pessoa leiga publique a própria cópia seguindo só o passo a passo
- Nenhum dado pessoal real ou segredo em qualquer arquivo do repositório
