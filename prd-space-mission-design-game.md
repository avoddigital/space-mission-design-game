# PRD: Space Mission Design Game (Tupi Orbit)

> **Versão:** 0.5 (14/11: campanha, Biblioteca, conquistas, identidade visual, sons e idiomas implementados, seção 15) · 0.4 (14/11: público-alvo, aprendizagem, unidades e idiomas, seção 14) · 0.3 (MVP de hackathon, junção com o que já está no repositório)
> **Data:** 13/11/2026 (véspera do evento, 14 e 15/11/2026)
> **Autores:** Carlos (versão 0.2) e Silvio (junção 0.3), equipe Tupi Orbit
> **Stack:** Vite + JavaScript puro (ES modules) + HTML/CSS + Three.js como camada visual + Vitest. Sem backend, `localStorage`, deploy estático no GitHub Pages.
> **Base:** repositório `avoddigital/space-mission-design-game` (versão 0.2 escrita sobre o commit `462b22e`; versão 0.3 ajustada ao motor e às tabelas do `main` em 13/11 à noite), desafio NASA Space Apps 2026 "Space Mission Design Game" e o protótipo 3D local (`index.html` desta pasta).

---

## 0. Como ler este PRD (e o que ele muda)

Este PRD **não recomeça o projeto**. Ele parte do que já está no repositório e mantém as decisões que o time já tomou:

| Já decidido no repo (mantido) | Fonte |
|---|---|
| Vite + JS puro, sem backend, só ferramentas gratuitas | `CLAUDE.md` › Stack and constraints |
| Regras do jogo em `src/engine/` como funções puras, testadas com Vitest | `CLAUDE.md` › Suggested structure |
| Three.js é só camada visual (`view3d/` lê o estado e nunca decide regra) | `CLAUDE.md` › 3D layer |
| Fluxo de 5 etapas: objetivo → nave/instrumentos → foguete/órbita → simulação → relatório | `CLAUDE.md` › Product |
| Formato dos dados (`parts`, `rockets`, `orbits`, `scenarios`, unidades no nome do campo) | `Carlos.md` |
| Textos escritos primeiro em **inglês** e traduzidos para português e espanhol (desde a 0.5); conversa da equipe em pt-BR | `CLAUDE.md` › Language rules e Translations |
| Sem `Co-Authored-By` nem atribuição de IA em commits | `CLAUDE.md` › Working agreements |

O que este PRD **acrescenta ou ajusta**, com base no feedback do protótipo ("ficou complexo demais; precisa ser mais educativo e 3D"):

1. **Menos números na tela.** Os 6 recursos do desafio continuam existindo no motor, mas o jogador vê **5 medidores simples** (Dados e Comunicação viram um medidor só: "dados gerados × dados que cabem no rádio"). Nada de Δv, bateria separada ou fórmulas na tela principal.
2. **Educação embutida em cada etapa:** caixa "Learn" com um conceito por etapa, checklist em linguagem simples antes do lançamento, relatório que explica o *porquê* e um quiz de 1 pergunta no fim.
3. **3D promovido de "enfeite" a parte central da demo**, sem quebrar a regra de arquitetura: visualizador da nave que muda a cada peça (etapa 2) e cena de lançamento e órbita (etapas 3 e 4). O jogo continua 100% jogável sem WebGL.
4. **Eventos aleatórios ligados a margens.** Tempestade solar, atraso de lançamento e queda de estação terrestre só machucam quem deixou pouca folga. Isso ensina por que engenheiros guardam margem.
5. **Equilíbrio protegido por testes** (seção 6.4): cada cenário precisa ter soluções vencedoras e nenhuma "resposta única".

### 0.1 Junção da versão 0.3 (13/11, noite): o que vale

A versão 0.2 foi escrita antes de o motor de regras e as tabelas do Carlos entrarem no `main`. A 0.3 junta as duas coisas. **Em caso de dúvida, vale o que está nesta seção e nas seções 6 e 7.**

| Tema | Decisão | Por quê |
|---|---|---|
| Motor de regras | **Mantido o que existe** (`computeBudget`, `validateMission`, `scoreMission`) e **estendido** com a simulação e os status dos medidores (seção 7) | Já está pronto e coberto por 50 testes |
| Dados | **Tabelas do Carlos** (`src/data/`). O PRD não repete números | Já estão equilibradas e verificadas por teste |
| Pontuação | **0 a 100: ciência 50, eficiência 30, objetivo 20** (aprovada pelo Silvio). Sem multiplicador de dificuldade | Simples de explicar no relatório |
| Quiz | Entra (US-018), mas **não soma pontos**: dá o selo "Mission expert" | Mantém a nota de 0 a 100 limpa |
| Textos | Um arquivo só, `src/data/content.js` (seção 6.5). Mensagens de problema são dados, com `{valores}` | O Carlos escreve sem depender do código |
| Eventos | Tabela `src/data/events.js` (seção 6.6). Sobra ≥ 15% protege; evento sozinho não destrói a missão | Ideia do PRD, com dados editáveis pelo Carlos |
| Estrutura da nave | 100 kg, 30 W, US$ 25M (já no motor) | O equilíbrio atual foi testado com esses valores |
| Física extra (sol e sinal por distância, RTG, arrasto) | **P1**, com valor padrão neutro (seção 6.3) | Boa lição, mas mexe no equilíbrio. Só depois do jogo pronto |
| Combustível automático, bônus de ciência por órbita | **Fora do MVP** | Complexidade que o feedback pediu para evitar |
| Experiência e educação (Learn, GO/NO-GO, 5 medidores, fases, 3D, controles, recorde, modo equipe P1) | **Mantidas do PRD** (seções 3, 4, 8 e 9) | É o ponto forte da 0.2 |

**Números nos fluxos e histórias:** os exemplos com números nas seções 3 e 4 (US$ 200M, Light Lifter, LEO 300 km, 594 kg) são **ilustrativos** e vêm da 0.2. Os números reais estão nas tabelas. O roteiro final da demo sai dos testes de jogo (tarefa do Carlos).

---

## 1. Visão geral

### 1.1 Elevator pitch
Um jogo de navegador em que estudantes montam uma missão espacial de verdade, do objetivo científico ao lançamento, vendo em 3D a nave que estão construindo. Cada escolha mexe em massa, energia, orçamento, dados e tempo, e no fim o jogo explica, em palavras simples, por que a missão deu certo ou falhou.

### 1.2 Problema
Projetar uma missão espacial é um exercício de trade-offs: um instrumento melhor traz mais ciência, mas também mais massa, consumo de energia, dados e custo. Estudantes quase nunca conseguem experimentar uma missão inteira. As ferramentas que existem tratam um tema por vez (órbitas no GMAT, foguetes em simuladores, CubeSat em apostilas) e não mostram como as decisões se afetam. O resultado é que esses trade-offs ficam abstratos.

Como é resolvido hoje: aula expositiva, slides, planilhas de "mass budget" ou ferramentas profissionais (GMAT, Mission Design Lab) que assustam iniciante.

### 1.3 Solução
Um simulador de decisões com cara de jogo:
- **Poucas escolhas por etapa** (3 a 8 cartas), cada uma com consequência visível na hora nos medidores e no modelo 3D.
- **Feedback que ensina:** em vez de "errado", o jogo diz "sua nave pesa 594 kg, mas o Light Lifter só leva 400 kg até GTO".
- **Rejogável:** errou, volta direto na etapa que falhou, com as escolhas preservadas.
- **Insight central:** não existe uma única resposta certa. Combinações diferentes de instrumentos, órbita e foguete cumprem o mesmo objetivo, com custos e riscos diferentes.

### 1.4 Métricas de sucesso do MVP (hackathon)
1. **Uma partida completa em menos de 5 minutos** na demo (cenário Terra), medida cronometrando 3 pessoas de fora do time.
2. **3 cenários jogáveis de ponta a ponta** (Terra, Lua, Marte), cada um com pelo menos 10 combinações vencedoras (verificado por teste automatizado, seção 6.4).
3. **Pelo menos 7 de 10 testadores** respondem certo à pergunta "por que sua missão falhou?" depois de ver o relatório (teste de corredor no evento).
4. **Zero erros no console** e jogo funcionando em celular (Chrome Android) e notebook fraco.
5. **Entrega completa no Space Apps:** link público (GitHub Pages), README, vídeo de demo e pitch em inglês.

### 1.5 Premissas e riscos principais
- **Premissa:** os jurados valorizam clareza educativa e trade-offs reais acima de realismo numérico. *Se falsa:* precisaríamos de dados bem mais precisos, o que não cabe em 48h.
- **Premissa:** dá para fechar o fluxo completo em HTML até a noite do dia 14 e usar o dia 15 para 3D e polimento. *Se falsa:* o 3D vira só o visualizador da nave (prioridade 1) e o resto fica 2D.
- **Premissa:** o time consegue manter as regras puras em `engine/`, sem misturar com DOM. *Se falsa:* os testes param de proteger o balanceamento.
- **Risco:** escopo crescer (modo equipe, sandbox, leaderboard). Mitigação: seção 9 lista o que está **fora**.
- **Risco:** WebGL falhar no computador do jurado. Mitigação: fallback 2D obrigatório e 3D carregado sob demanda.

---

## 2. Personas e jobs to be done

### 2.1 Persona primária: Ana, 15 anos, estudante do ensino médio
- Gosta de astronomia e vê vídeos de lançamentos, mas nunca estudou engenharia.
- Joga no celular ou no Chromebook da escola.
- **Dor:** "Eu não entendo por que a NASA não coloca todas as câmeras num satélite só."
- **Comportamento:** abandona qualquer coisa que pareça planilha. Aprende fazendo e errando.

### 2.1b Persona primária adulta: Lucas, 24 anos, universitário e fã de espaço
- Geração Z (nascidos de 1997 em diante, segundo a Pew Research Center; usamos 1997–2012 como faixa de trabalho, ou seja, de 14 a 29 anos em 2026).
- Acompanha lançamentos e notícias de exploração espacial, já tem noção de física e orçamento.
- **Dor:** "Os simuladores ou são infantis demais ou são ferramentas profissionais que exigem curso."
- **Comportamento:** quer autonomia, ir direto aos números ("Show numbers"), checar as fontes e testar estratégias diferentes. Joga em sessões curtas, no celular ou no notebook.

### 2.2 Persona secundária: Prof. Marcos, 38 anos, professor de física/ciências
- Quer uma atividade de 20 a 40 minutos para a turma, em dupla ou em grupo de 4.
- **Dor:** não tem material interativo sobre missões completas, só sobre partes soltas.
- **Precisa:** algo que funcione no navegador sem instalação, sem login, que gere discussão ("por que vocês escolheram essa órbita?").

### 2.3 Persona terciária: Jurado do Space Apps
- Tem cerca de 3 minutos por projeto. Avalia impacto, criatividade, validade, relevância e apresentação.
- **Precisa:** entender o jogo em 30 segundos e ver uma partida inteira (sucesso e falha) no vídeo.

### 2.4 Jobs to be done
- Quando **estou curiosa sobre como missões funcionam**, eu quero **montar uma eu mesma e ver o que acontece**, para que **eu entenda por que cada peça importa**.
- Quando **minha missão falha**, eu quero **saber exatamente qual limite estourou e por quê**, para que **eu consiga consertar e tentar de novo**.
- Quando **dou aula sobre exploração espacial**, eu quero **uma atividade curta e jogável em grupo**, para que **os alunos discutam trade-offs reais**.
- Quando **avalio o projeto**, eu quero **ver em minutos o ciclo completo e o valor educativo**, para que **eu consiga pontuar com segurança**.

---

## 3. User stories + critérios de aceitação

Prioridade: **P0** = sem isso não tem demo. **P1** = entra se o P0 fechar até a noite de 14/11. **P2** = só se sobrar tempo.

> **Ajustes da junção 0.3 nas histórias:** US-005 (RTG e energia "no destino") e US-009 (arrasto em LEO) dependem dos campos P1 da seção 6.3; até lá, a energia e a antena mostram o valor da tabela. US-016: "tight but valid" e "Efficient design" são **selos**, sem bônus de pontos (a eficiência já vale 30 pontos). US-018: o quiz **não soma pontos**. US-020: o recorde é por cenário, de 0 a 100.

### Épico 1: Início e cenário (Etapa 1)

**US-001 (P0): Ver a tela inicial e entender o jogo**
> Como Ana, quero ver em uma tela o que é o jogo e como jogar, para começar sem tutorial longo.

- Dado que abro o jogo, quando a página carrega, então vejo título, frase de premissa, os 3 cenários, um bloco "How to play" com 5 passos e a legenda de controles.
- Dado que estou num celular em pé, quando a página carrega, então nada fica cortado e todos os botões têm pelo menos 44×44 px.
- Dado que já joguei antes, quando abro o jogo, então vejo minha melhor pontuação salva.

**US-002 (P0): Escolher um cenário**
> Como Ana, quero escolher entre observar a Terra, explorar a Lua ou estudar Marte, para jogar a missão que me interessa.

- Dado que estou na tela inicial, quando clico num cenário, então o cartão fica destacado (borda e leve aumento em 120 ms) e o planeta 3D ao fundo muda.
- Dado que escolhi um cenário, então vejo seu nível (Easy, Medium, Hard), orçamento, prazo e meta de ciência.
- Dado que uso teclado, quando aperto 1, 2 ou 3, então o cenário correspondente é selecionado.

**US-003 (P0): Ler o objetivo da missão**
> Como Ana, quero ver a pergunta científica da missão, para saber o que estou tentando responder.

- Dado que comecei uma missão, quando entro na etapa 1, então vejo a pergunta científica em uma frase, a meta de ciência (pontos) e um fato curto "Did you know?".
- Dado que confirmo a etapa 1, então aparece o banner "Stage complete" e avanço para a etapa 2.

### Épico 2: Nave e instrumentos (Etapa 2)

**US-004 (P0): Escolher instrumentos**
> Como Ana, quero adicionar e remover instrumentos, para alcançar a meta de ciência.

- Dado que estou na etapa 2, quando toco num instrumento, então ele entra ou sai da nave e os medidores atualizam no mesmo quadro (barra anima em 180 ms).
- Dado que adicionei um instrumento, então cada cartão mostra massa (kg), consumo (W), custo (M$), dados (GB/dia) e estrelas de ciência.
- Dado que nenhum instrumento foi escolhido, quando tento avançar, então o painel treme e aparece o aviso "Pick at least one instrument".

**US-005 (P0): Escolher energia**
> Como Ana, quero escolher painéis solares ou RTG, para alimentar a nave.

- Dado que estou no destino Marte, quando vejo os painéis solares, então cada cartão mostra a energia **no destino** (ex.: "430 W at Mars") e não só na Terra.
- Dado que a energia gerada fica abaixo do consumo, quando escolho essa opção, então o medidor de energia fica vermelho, treme e aparece uma mensagem explicando a diferença em W.

**US-006 (P0): Escolher antena**
> Como Ana, quero escolher uma antena, para conseguir mandar os dados para a Terra.

- Dado que escolhi uma antena, então o medidor "Data downlink" compara GB/dia gerados com GB/dia que a antena consegue enviar daquele destino.
- Dado que o destino é distante, então o cartão da antena mostra a capacidade já reduzida pela distância.

**US-007 (P0): Ver a nave em 3D mudando**
> Como Ana, quero ver minha nave em 3D mudar a cada peça, para entender o que estou montando.

- Dado que adiciono ou removo uma peça, então o modelo 3D é reconstruído com a peça visível (câmera, painel, RTG, antena) e faz um "pop" de escala de 1,08 para 1,00.
- Dado que arrasto sobre a nave (mouse ou dedo), então ela gira. Sem interação, ela gira devagar sozinha.
- Dado que WebGL não está disponível, então aparece um diagrama 2D da nave com a lista de peças, e o jogo continua normal.

**US-008 (P1): Ler a caixa "Learn" da etapa**
> Como Ana, quero uma explicação curta do conceito da etapa, para aprender enquanto jogo.

- Dado que estou em qualquer etapa de design, então vejo uma caixa "Learn" com no máximo 3 frases e uma "regra de bolso" (ex.: "Every gram you add must be launched and powered").
- Dado que toco num medidor, então abre um modal com o que ele mede, a regra simples e o valor atual explicado.

### Épico 3: Foguete e órbita (Etapa 3)

**US-009 (P0): Escolher a órbita**
> Como Ana, quero escolher uma órbita entre as permitidas pelo cenário, para ver como ela afeta a missão.

- Dado que estou no cenário Terra, então vejo 3 órbitas (LEO 300 km, SSO 700 km, GEO) com uma frase de prós e contras cada.
- Dado que escolho LEO 300 km, então o medidor de tempo avisa que o arrasto atmosférico derruba a nave em 180 dias, antes dos 365 dias de operação.
- Dado que mudo a órbita, então massa (combustível), energia (luz solar), dados (distância) e tempo (viagem) são recalculados.

**US-010 (P0): Escolher o foguete**
> Como Ana, quero escolher um foguete, para levar minha nave até a órbita.

- Dado que escolhi uma órbita, então cada foguete mostra quanto leva **para aquele destino** (ex.: "Carries 400 kg to GTO") e fica marcado como insuficiente se não levar a nave.
- Dado que o foguete não chega ao destino (`payloadKg = 0`), então o cartão mostra "Can't reach TMI" e fica desabilitado, com tremida e explicação ao tocar.
- Dado que escolho um foguete grande demais, então nada bloqueia, mas o orçamento sobe (lição: excesso também custa).

**US-011 (P1): Ver os foguetes em 3D lado a lado**
> Como Ana, quero comparar os foguetes visualmente, para sentir a diferença de tamanho.

- Dado que estou na etapa 3, então os 4 foguetes aparecem lado a lado em 3D, com o escolhido em destaque e os outros semitransparentes.

**US-012 (P0): Checklist de prontidão**
> Como Ana, quero uma lista "GO / NO-GO" antes de lançar, para saber o que ainda está errado.

- Dado que abro a revisão, então vejo uma linha por recurso (Budget, Mass, Power, Data downlink, Time, Science) com ✅ ou ❌ e uma frase de explicação com números.
- Dado que toco numa linha vermelha, então vou direto para a etapa que resolve aquele problema.
- Dado que há linhas vermelhas, então o botão "Launch" continua disponível (falhar ensina), mas em amarelo e com o aviso "physics doesn't negotiate".

### Épico 4: Simulação (Etapa 4)

**US-013 (P0): Rodar a simulação**
> Como Ana, quero ver minha missão acontecer, para descobrir se ela funciona.

- Dado que clico em Launch, então a simulação passa por 4 fases: Launch, Transfer, Operations, Data return, cada uma em cerca de 1,5 s, com marcador de fase e mensagem em uma linha.
- Dado que um limite rígido estoura, então a simulação para na fase correspondente: congela 300 ms no problema, pulso vermelho, tremida leve e mensagem explicando a falha.
- Dado que aperto P ou Esc, então tudo congela e vejo a tela de pausa.

**US-014 (P0): Eventos aleatórios que testam margens**
> Como Ana, quero que coisas inesperadas aconteçam, para entender por que engenheiros guardam folga.

- Dado que a simulação roda, então sorteia de 1 a 2 eventos entre: tempestade solar, atraso de lançamento, queda de estação terrestre, falha de instrumento.
- Dado que minha margem no recurso afetado é suficiente, então o evento aparece em verde: "Solar storm! Your 25% power margin kept everything running".
- Dado que minha margem é pequena, então o evento aparece em âmbar e tira parte da ciência, mas **não destrói** a missão sozinho.
- Dado que repito exatamente a mesma missão, então os eventos são os mesmos (semente fixa por design), para a comparação ser justa.

**US-015 (P1): Ver lançamento e órbita em 3D**
> Como Ana, quero ver o foguete decolar e a nave chegar na órbita, para a missão parecer real.

- Dado que lanço, então vejo o foguete subir da Terra com fumaça, a separação, a nave seguindo a trajetória até o destino e entrando em órbita (anel na altitude escolhida, em unidades de cena).
- Dado que o foguete era fraco demais, então ele sobe pouco, inclina e explode.
- Dado que faltou energia, então a nave chega, as luzes apagam e pisca uma luz vermelha.

### Épico 5: Relatório e aprendizagem (Etapa 5)

**US-016 (P0): Relatório final que explica**
> Como Ana, quero um relatório que diga o que funcionou, o que falhou e por quê, para aprender com o resultado.

- Dado que a missão terminou, então vejo título SUCCESS (verde, bounce de 600 ms) ou FAILED (vermelho), a pontuação detalhada, a lista do que funcionou e do que falhou, e uma caixa "What to learn" com a regra do recurso que falhou.
- Dado que a missão falhou, então o relatório cita os números ("594 kg vs 400 kg") e sugere uma correção concreta.
- Dado que a missão deu certo com algum recurso entre 95% e 100% do limite, então aparece o selo "tight but valid" e bônus "Efficient design".

**US-017 (P0): Comparar com uma missão real da NASA**
> Como Ana, quero ver uma missão real parecida com a minha, para conectar o jogo com o mundo real.

- Dado que termino um cenário, então vejo um cartão "Real mission like yours" (ex.: Landsat 9, Lunar Reconnaissance Orbiter, MAVEN) com 2 frases e o que ela tem em comum com a minha escolha.

**US-018 (P1): Quiz de 1 pergunta**
> Como Ana, quero responder uma pergunta rápida no final, para fixar o conceito e ganhar pontos.

- Dado que estou no relatório, então vejo 1 pergunta com 3 opções ligada ao cenário.
- Dado que respondo, então vejo a correta em verde, a explicação em 2 frases e, se acertei, o selo "Mission expert" (sem pontos; ver 0.1). Só posso responder uma vez.

**US-019 (P0): Refazer a missão**
> Como Ana, quero voltar e consertar minha missão, para tentar de novo sem recomeçar.

- Dado que estou no relatório, quando clico "Redesign mission", então volto para a etapa ligada ao primeiro problema, com todas as escolhas preservadas.
- Dado que clico "Next mission", então começo o próximo cenário.

**US-020 (P0): Recorde salvo**
> Como Ana, quero que minha melhor pontuação fique salva, para tentar superá-la.

- Dado que bati o recorde, então o relatório ganha borda dourada, estrela e o selo "Best mission so far", e o valor fica salvo em `localStorage` na chave `space-mission-design-game:best-v1`.
- Dado que o `localStorage` está bloqueado (modo anônimo, `data:` URL), então o jogo funciona normalmente, só sem salvar.

### Épico 6: Controles, pausa e acessibilidade

**US-021 (P0): Controles sempre visíveis**
- Dado que estou no menu ou em qualquer etapa, então vejo a legenda: Click/Tap, Enter (next), Backspace (back), 1–8 (pick card), P/Esc (pause), Drag (rotate 3D).

**US-022 (P0): Pausa**
- Dado que aperto P/Esc ou o botão II, então aparece a tela de pausa com Resume, Restart e Main menu. Animações e simulação congelam.

**US-023 (P1): Acessibilidade básica**
- Cartões e botões são `<button>` reais com foco visível. Medidores têm texto além da cor (ex.: "OVER THE LIMIT"). Contraste mínimo de 4,5:1 no texto.

### Épico 7: Modo equipe (colaboração, pedida pelo desafio)

**US-024 (P1): Modo equipe pass-and-play com papéis**
> Como Prof. Marcos, quero que até 4 alunos joguem a mesma missão num aparelho, cada um com um papel, para que discutam as decisões.

- Dado que escolho "Team mode" e 2 a 4 jogadores, então cada etapa mostra de quem é a vez: Mission Lead (etapa 1), Science Lead (instrumentos), Spacecraft Engineer (energia e antena), Flight Dynamics (órbita e foguete).
- Dado que começa a partida, então cada papel recebe uma "priority card" (ex.: Science Lead: "get at least 3 instruments"; Flight Dynamics: "keep 20% mass margin"). Prioridades cumpridas somam bônus de equipe, e algumas conflitam de propósito para gerar negociação.
- Dado que a missão termina, então o relatório mostra um placar de equipe com as prioridades cumpridas.

**US-025 (P2): Sandbox**
- Modo sem limites de orçamento e prazo, para experimentar.

---

## 4. Fluxos de usuário (passo a passo)

> Os números deste capítulo vêm da versão 0.2 e são **ilustrativos** (ver 0.1). O fluxo 4.2 depende do campo P1 `lifetimeDays`.

### 4.1 Fluxo: Primeira partida (cenário Terra, o caminho da demo)
1. Abre o link do GitHub Pages. Tela inicial com 3 cartões; "Observe Earth" já vem destacado.
2. Lê "How to play" (5 linhas) e clica **Start mission** (ou Enter).
3. **Etapa 1 · Objective:** pergunta "How is Earth's land and climate changing?", meta 12 pontos, orçamento US$ 200M, prazo 400 dias. Clica Next. Banner "Stage complete: Objective".
4. **Etapa 2 · Spacecraft:** à esquerda, cartões em 3 abas pequenas (Instruments, Power, Comms). No centro, a nave 3D. À direita, os 5 medidores.
   - Adiciona Multispectral Imager (+8) e Spectrometer (+6): ciência 14/12 ✅.
   - Power: Small solar panel (300 W): consumo 185 W já contando a antena ✅.
   - Comms: Low-gain antenna (5 GB/dia × 0,8 = 4 GB/dia) contra 35 GB/dia gerados ❌. O medidor treme e explica. Troca por High-gain ✅.
5. **Etapa 3 · Launch & orbit:** escolhe SSO 700 km (3.650 dias de vida útil ✅). Foguetes: Small Lifter (300 kg) ❌ para a nave de 320 kg, Light Lifter (1.500 kg, US$ 40M) ✅.
6. **Revisão GO/NO-GO:** tudo verde, pontuação projetada visível. Launch.
7. **Etapa 4 · Simulation:** decolagem 3D → órbita → evento "Solar storm" (margem de energia 38%, sem dano) → data return ✅.
8. **Etapa 5 · Report:** SUCCESS, pontuação, cartão "Real mission like yours: Landsat 9", quiz, recorde salvo. Botões Redesign / Next mission / Menu.

**Tempo-alvo:** de 3 a 4 minutos.

### 4.2 Fluxo: Falha educativa (o segundo trecho do vídeo)
1. Igual ao 4.1, mas escolhe **LEO 300 km** (melhor resolução, bônus de ciência ×1,2).
2. A revisão mostra ❌ Time: "At 300 km, air drag pulls the spacecraft down in about 180 days. Your mission needs 365 days."
3. Lança mesmo assim. Na fase Operations, a nave reentra (3D: anel encolhe, nave some com brilho laranja).
4. Relatório FAILED: "Orbit decayed after 180 days." What to learn: "Lower orbits see more detail but feel more air drag. Higher orbits last longer."
5. Redesign leva para a etapa 3 com as escolhas mantidas. Troca por SSO 700 e vence.

### 4.3 Fluxo: Missão Marte (difícil)
- Pontos de aprendizado: luz solar a 43% (painel pequeno vira 129 W), comunicação a 4% da capacidade em LEO, combustível de captura (+30% a +45% de massa) e só os foguetes médio e pesado chegam a TMI.
- O número de combinações vencedoras é medido pelo teste de equilíbrio (seção 6.4). A dica da etapa aponta para instrumentos com pouco dado (magnetômetro, altímetro, sondador atmosférico).

### 4.4 Fluxo: Modo equipe (P1)
1. Menu → "Team mode" → escolhe 2 a 4 jogadores e digita apelidos (opcional, só na memória, nunca salvo).
2. Tela "Priority cards": cada jogador vê a sua carta, uma por vez ("Pass the device to Science Lead").
3. Em cada etapa, um banner mostra de quem é a vez. Qualquer um pode tocar, mas o papel da vez confirma o "Next".
4. Relatório: pontuação da missão + bônus de equipe + quais prioridades foram cumpridas.

### 4.5 Tratamento de erros e casos de borda
| Situação | Comportamento |
|---|---|
| WebGL indisponível ou erro ao criar o renderer | Esconde o canvas 3D, mostra diagrama 2D estático e o aviso "3D view unavailable on this device". O jogo segue. |
| `localStorage` bloqueado | `try/catch` em toda leitura e escrita. Recorde só na memória. |
| Tela em pé no celular | Painel de cartões vira gaveta inferior (até 44% da altura), medidores em grade 2×3 no topo, 3D no meio. |
| Avançar sem escolha obrigatória | Painel treme 160 ms e toast âmbar com o que falta. |
| Foguete não chega ao destino | Cartão desabilitado com motivo. Toque mostra a explicação. |
| Aba do navegador em segundo plano | `dt` limitado a 100 ms por quadro para animações não "pularem". |

---

## 5. Arquitetura técnica

### 5.1 Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Build e dev | **Vite 8** (já no repo) | Dev server instantâneo, build estático com `base: './'` pronto para o GitHub Pages |
| Linguagem | **JavaScript puro, ES modules** | Decisão do time. Sem framework, sem curva de aprendizado em 48h |
| UI | **HTML + CSS** com componentes em funções (`renderX(state)`) | Cartões e botões acessíveis de verdade, layout responsivo com CSS Grid. Canvas 2D só para o fallback |
| Regras | **`src/engine/` com funções puras** | Testáveis, sem DOM, sem Three.js |
| 3D | **Three.js** (dependência npm `three`), carregado com `import()` dinâmico | Única lib 3D aprovada. Lazy-load protege celular fraco |
| Testes | **Vitest 5** (já no repo) | Testes do motor e do balanceamento |
| Persistência | **`localStorage`** | Só recorde e preferências. Sem conta, sem servidor |
| Deploy | **GitHub Pages** (GitHub Actions ou `gh-pages`) | Grátis, link público para os jurados |
| Observabilidade | Nenhuma no MVP | Sem serviços externos (regra "free tools only"). Console limpo é o critério |

### 5.2 Decisões técnicas chave (trade-offs)
1. **Sem backend.** Ganhamos zero custo, zero login, zero LGPD de dados pessoais. Perdemos leaderboard online e compartilhamento entre aparelhos. Isso é aceitável: o desafio só sugere essas coisas.
2. **HTML/CSS para UI em vez de tudo em Canvas.** O protótipo 2D desenhava a UI em Canvas e precisou de hit-testing manual. Em HTML vêm de graça foco, leitor de tela, quebra de texto e responsividade. O protótipo 3D já usa esse modelo (DOM por cima do WebGL).
3. **Fluxo de dados unidirecional:** `UI → state → engine → state → view3d`. A UI chama ações (`selectPart`, `setOrbit`), o motor recalcula um objeto `evaluation` derivado, e a UI e o `view3d` só leem. Assim o 3D nunca vira fonte de bug de regra.
4. **Eventos aleatórios com semente.** `mulberry32(seed)` com `seed = hash(design) + runCount`. A mesma missão relançada imediatamente repete os eventos, o que permite comparar mudanças. "Try again with new conditions" incrementa `runCount`.
5. **Valores simplificados e explicitamente rotulados.** Os números de foguetes vêm de referências públicas (Electron, Vega, Falcon 9, Falcon Heavy), mas TLI e TMI estão simplificados. Todo dado leva `// simplified`. Não alegamos precisão.

### 5.3 Alternativas consideradas e descartadas
- **React/Next.js:** melhor ecossistema para editores de IA, mas o repo já tem base em JS puro, o desafio não pede backend e trocar agora custaria horas. Descartado.
- **React Three Fiber / Babylon / motor de jogo:** proibido pelo `CLAUDE.md` e desnecessário.
- **Single-file HTML com Three.js por CDN (como o protótipo local):** ótimo para prototipar, ruim para dividir trabalho em equipe e testar. Usamos o protótipo como **referência visual**, não como base de código.
- **Firebase para leaderboard e multiplayer remoto:** quebra a regra "no paid services / API keys" e o escopo de 48h.
- **Simulação física de órbita:** fora de escopo. Usamos fatores simplificados por órbita (seção 6).

### 5.4 Requisitos não funcionais
- **Performance:** primeira tela interativa em menos de 2 s em 4G. Bundle inicial sem Three.js abaixo de 60 KB gzip; o chunk do `view3d` vem depois. 3D a 30+ fps em notebook integrado; `setPixelRatio(min(devicePixelRatio, 2))`; geometrias e materiais reutilizados e descartados ao sair da cena.
- **Responsividade:** de 360 px a 1920 px de largura. Alvos de toque de 44×44 px ou mais.
- **Acessibilidade:** elementos interativos são `<button>`; estado não depende só de cor (tags de texto); contraste 4,5:1; `prefers-reduced-motion` desliga tremida e confete.
- **Robustez:** jogável sem WebGL, sem `localStorage` e offline depois do primeiro carregamento (assets locais, nada de CDN em produção).
- **Compliance:** nenhum dado pessoal coletado. Apelidos do modo equipe só na memória. Texturas NASA de domínio público com créditos no README.
- **Idioma:** UI 100% em inglês. Glossário de termos na seção 13.

### 5.5 Estrutura de pastas (alvo)
```
index.html
src/
  main.js                # bootstrap: cria state, liga UI, carrega view3d sob demanda
  style.css              # tokens de cor (seção 8) + layout
  data/
    parts.js             # instrumentos, energia, antenas (Carlos)
    rockets.js
    orbits.js
    scenarios.js
    content.js           # textos para o jogador: issues, learn, meters, cenários, quiz, missões reais (Carlos)
    events.js            # eventos aleatórios (Carlos)
  engine/
    resources.js         # ✅ sumResources, launchCapacityKg, computeBudget, SPACECRAFT_BUS
    compatibility.js     # ✅ checkLaunch
    validation.js        # ✅ validateMission (códigos de problema)
    scoring.js           # ✅ scoreMission 0–100, effectiveScience
    constants.js         # TIGHT_RATIO, EVENT_SAFE_MARGIN
    resolve.js           # resolveDesign(design, data): ids -> objetos
    messages.js          # formatIssue(issue, content)
    simulate.js          # simulateMission(mission, scenario, events, seed)
    random.js            # mulberry32, hashDesign
  state/
    store.js             # estado único + subscribe/dispatch
    actions.js           # selectScenario, togglePart, setOrbit, setRocket, launch, ...
  ui/
    screens/menu.js, objective.js, spacecraft.js, launch.js, simulation.js, report.js
    components/card.js, meter.js, checklist.js, modal.js, toast.js, legend.js
  view3d/
    index.js             # API pública: mount(el), show(sceneName, state), dispose()
    spacecraft.js        # buildSpacecraft(design)
    rockets.js
    planets.js           # esferas com textura (NASA, pequenas)
    flight.js            # cena de lançamento, transferência e órbita
    fallback2d.js
  assets/textures/       # earth_1k.jpg, moon_1k.jpg, mars_1k.jpg (domínio público, < 300 KB cada)
tests/
  resources, compatibility, validation, scoring, findWinningMission, data  # ✅ já existem (50 testes)
  helpers/findWinningMission.js                                            # ✅ busca de solução vencedora
  simulate.test.js
  messages.test.js
```

---

## 6. Modelo de dados

> **Versão após a junção (13/11/2026, noite).** Os **números** dos dados não ficam mais neste PRD: a fonte da verdade são as tabelas em `src/data/`, feitas pelo Carlos e verificadas por `tests/data.test.js`. Assim, PRD e código não divergem. O formato de cada tabela está no [`Carlos.md`](Carlos.md).

Não há banco. O "schema" são as tabelas em `src/data/`, o estado em memória e as chaves do `localStorage`. **Valores simplificados, inspirados em missões reais, não exatos.**

### 6.1 Constantes do motor
| Constante | Valor | Onde | Situação |
|---|---|---|---|
| `SPACECRAFT_BUS` | `{ massKg: 100, powerW: 30, costMUsd: 25 }` | `src/engine/resources.js` | ✅ existe |
| `MIN_MASS_MARGIN_RATIO` | `0.1` (aviso "sobra de massa abaixo de 10%") | `src/engine/compatibility.js` | ✅ existe |
| `SCORE_WEIGHTS` | `{ science: 50, efficiency: 30, objective: 20 }` | `src/engine/scoring.js` | ✅ existe |
| `TIGHT_RATIO` | `0.95` (95–100% de um limite = "tight but valid") | `src/engine/constants.js` | a criar |
| `EVENT_SAFE_MARGIN` | `0.15` (sobra ≥ 15% protege contra eventos) | `src/engine/constants.js` | a criar |

### 6.2 Tabelas que já existem (`src/data/`, Carlos)
| Tabela | Conteúdo hoje | Campos |
|---|---|---|
| `parts.js` | 10 instrumentos, 3 painéis solares, 3 antenas | `id`, `name`, `type`, `massKg`, `powerW`, `costMUsd`, `dataGbPerDay`, `scienceValue`; `powerGenW` (power); `downlinkGbPerDay` (comms) |
| `rockets.js` | Small, Medium, Heavy, Super Heavy Lifter | `id`, `name`, `costMUsd`, `payloadKg: { LEO, GTO, TLI, TMI }` |
| `orbits.js` | LEO 500, SSO 700, GEO, órbita lunar, órbita de Marte | `id`, `name`, `target`, `altitudeKm`, `transferDays` |
| `scenarios.js` | Terra (US$ 150M), Lua (US$ 220M), Marte (US$ 230M) | `id`, `name`, `budgetMUsd`, `maxDays`, `operationDays`, `allowedOrbits`, `requiredTypes`, `minScience` |

### 6.3 Campos novos
**P0 (o Carlos pode acrescentar já, o motor ignora o que não usa):**
- `description` em todo item das 4 tabelas: 1 ou 2 frases para o cartão.
- `difficulty` nos cenários: `'easy'`, `'medium'` ou `'hard'`. Só rótulo, sem multiplicador de pontos.

**P1 (só depois do marco do dia 14, quando o jogo estiver jogável de ponta a ponta):** são os campos que dão "sabor de física" ao jogo. O Silvio implementa primeiro no motor, **com valor padrão neutro**, e só então o Carlos preenche. Os testes de equilíbrio avisam se algo quebrou.

| Campo | Tabela | Padrão se faltar | Efeito no motor | Lição |
|---|---|---|---|---|
| `sunFactor` | orbits | `1` | energia gerada = `powerGenW × sunFactor` | Marte recebe menos sol |
| `commsFactor` | orbits | `1` | capacidade de envio = `downlinkGbPerDay × commsFactor` | o sinal enfraquece com a distância |
| `nuclear: true` | parts (power) | `false` | ignora `sunFactor` | RTG funciona no escuro |
| `lifetimeDays` | orbits | sem limite | se `lifetimeDays < operationDays`, erro `ORBIT_DECAY` | órbitas baixas caem por arrasto |

**Fora do MVP:** `propellantFactor` (combustível automático), `scienceBonus` por órbita e multiplicador de dificuldade. Deixariam o jogo mais difícil de explicar.

### 6.4 Equilíbrio do jogo (testes automáticos)
`tests/data.test.js` já confere, com as tabelas reais:
- o formato de todas as tabelas;
- se cada cenário pode ser vencido;
- se a escolha do foguete importa;
- se não dá para levar todos os instrumentos.

A acrescentar (P1, Silvio): **pelo menos 10 combinações vencedoras por cenário** e **pelo menos 2 foguetes ou 2 órbitas diferentes entre as vencedoras**, para provar que não existe resposta única.

### 6.5 `src/data/content.js` (textos para o jogador, Carlos)
Todos os textos longos ficam num arquivo só. As descrições curtas ficam em `description`, nas tabelas.
```js
export const content = {
  issues: {   // one entry per issue code (section 7.3); {name} placeholders are filled by the game
    POWER_DEFICIT: { title: 'Not enough power', text: 'Your spacecraft needs {missingW} W more than it produces.', tip: 'Add a bigger solar panel or remove an instrument.', learn: 'Every instrument must be powered all the time.' },
  },
  learn: {    // "Learn" box, one per step (max. 3 sentences + one rule of thumb)
    objective: { text: '...', rule: '...' },
    spacecraft: { text: '...', rule: 'Every gram you add must be launched and powered.' },
    launch: { text: '...', rule: '...' },
    simulation: { text: '...', rule: '...' },
    report: { text: '...', rule: '...' },
  },
  meters: {   // modal opened when the player taps a meter (5 meters: data + comms are one)
    budget: { name: 'Budget', unit: 'million USD', text: '...' },
    mass: { name: 'Mass', unit: 'kg', text: '...' },
    power: { name: 'Power', unit: 'W', text: '...' },
    data: { name: 'Data downlink', unit: 'GB/day', text: '...' },
    time: { name: 'Time', unit: 'days', text: '...' },
  },
  scenarios: {
    'earth-observation': {
      question: "How are Earth's forests, ice and cities changing?",
      briefing: '2 to 4 sentences that tell the player the mission.',
      fact: 'Did you know? ...',
      realMissions: [ { name: 'Landsat 9', launchYear: 2021, summary: '...', url: 'https://...' } ],
      quiz: { q: '...', options: ['...', '...', '...'], answer: 0, why: '...' },
    },
  },
  glossary: { margin: 'Extra room left below a limit; protects against surprises.' },
};
```
Missões reais: **fatos conferidos** em nasa.gov, com link em `url`.

### 6.6 `src/data/events.js` (eventos aleatórios, Carlos)
```js
// Simplified random events. Effects are game values, not real statistics.
export const events = [
  {
    id: 'solar-storm',
    name: 'Solar Storm',
    scenarios: ['all'],          // or a list of scenario ids
    protectedBy: 'power',        // budget | mass | power | data | time
    scienceLossPct: 20,          // science lost if the margin is too small
    safeText: 'A solar storm hit, but your {marginPct}% power margin kept everything running.',
    hurtText: 'A solar storm hit and your power margin was only {marginPct}%. Some instruments shut down.',
    lesson: 'Engineers add extra power so missions survive bad space weather.',
  },
];
```
**Regra:** a cada lançamento o motor sorteia 1 ou 2 eventos que valem para o cenário. Se a sobra no recurso `protectedBy` for **≥ 15%**, não há dano: o cartão fica verde e mostra `safeText`. Abaixo disso, perde `scienceLossPct` da ciência: o cartão fica âmbar e mostra `hurtText`. Um evento **sozinho não destrói** a missão. Só falha se a ciência entregue cair abaixo de `minScience`, e o relatório cita o evento.

### 6.7 Estado em memória (`src/state/store.js`)
```js
const initialState = {
  screen: 'menu',              // 'menu' | 'objective' | 'spacecraft' | 'launch' | 'simulation' | 'report'
  scenarioId: 'earth-observation',
  design: { partIds: [], orbitId: null, rocketId: null },
  confirmedSteps: [],
  runCount: 0,
  simulation: null,            // result of simulateMission (7.2)
  report: null,                // { success, score, quizAnswered, quizRight }
  team: null,                  // P1
  paused: false,
  ui: { modal: null, toast: null },
};
```
A avaliação **não é guardada**: é sempre derivada com `validateMission(resolveDesign(state.design, data), scenario)`.

### 6.8 `localStorage`
| Chave | Valor | Quando |
|---|---|---|
| `space-mission-design-game:best-v1` | `{ "byScenario": { "earth-observation": 87 } }` | Ao fim de cada missão |
| `space-mission-design-game:prefs-v1` | `{ "reducedMotion": false, "seenHowTo": true }` | Ao mudar preferência |

Toda leitura e escrita em `try/catch`. Nunca guardar apelidos do modo equipe.

---

## 7. Contratos do motor (a "API" do jogo)

Tudo em `src/engine/`, sem DOM e sem Three.js, coberto por Vitest. O motor recebe **objetos resolvidos** (`{ parts, rocket, orbit }`), não ids.

### 7.1 Já existe e está testado ✅
| Função | Arquivo | Devolve |
|---|---|---|
| `sumResources(parts)` | `resources.js` | soma de `massKg`, `powerW`, `powerGenW`, `costMUsd`, `dataGbPerDay`, `downlinkGbPerDay`, `scienceValue` |
| `launchCapacityKg(rocket, orbit)` | `resources.js` | capacidade do foguete para o destino (`0` = não chega; `null` = falta escolher) |
| `computeBudget(mission, scenario)` | `resources.js` | os 6 recursos (`mass`, `power`, `budget`, `data`, `comms`, `time`), cada um com usado, limite, sobra e `ok`, mais `scienceValue` |
| `checkLaunch(rocket, orbit, massKg)` | `compatibility.js` | `{ ok, capacityKg, marginKg, marginRatio, issues }` |
| `validateMission(mission, scenario)` | `validation.js` | `{ ok, issues, budget }`; cada problema é `{ code, severity: 'error' \| 'warning', ...valores }` |
| `effectiveScience(budget)` | `scoring.js` | ciência que chega à Terra (cai se a antena não dá conta dos dados) |
| `scoreMission(mission, scenario)` | `scoring.js` | `{ total 0–100, failed, breakdown: { science, efficiency, objective }, issues, budget }` |

**Pontuação (aprovada pelo Silvio):**
- Ciência: 50 pontos, cheia com o dobro da ciência mínima.
- Eficiência: 30 pontos (15 pela sobra de orçamento e 15 pela sobra de massa, cheios com 20%).
- Objetivo: 20 pontos, ao atingir a ciência mínima.
- Qualquer erro: 0 pontos e missão falha.

### 7.2 A fazer (Silvio)
| Função | Arquivo | O que faz |
|---|---|---|
| `resolveDesign(design, data)` | `resolve.js` | ids → objetos. Id desconhecido lança `Error('Unknown part id: x')`, porque é bug de dados |
| status nos recursos | `resources.js` | acrescentar `ratio` e `status` (`'ok'` ≤ 0,95 · `'tight'` 0,95–1 · `'over'` > 1 · `'pending'` sem escolha) a cada recurso do `computeBudget`, para os medidores. Sem mudar o que já existe |
| `formatIssue(issue, content)` | `messages.js` | preenche os `{name}` do `content.issues` e devolve `{ title, text, tip, learn }` |
| `mulberry32(seed)`, `hashDesign(design)` | `random.js` | sorteio com semente: a mesma missão relançada repete os eventos |
| `simulateMission(mission, scenario, events, seed)` | `simulate.js` | fases, eventos e resultado (abaixo) |
| `scoreMission(...)` com simulação | `scoring.js` | a ciência dos 50 pontos passa a ser a **ciência entregue** depois dos eventos |

```js
// simulateMission result
{
  seed,
  phases: [
    { id: 'launch', ok, issues: [...] },
    { id: 'transfer', ok, issues: [...] },
    { id: 'operations', ok, issues: [...] },
    { id: 'data', ok, issues: [...] },
  ],
  events: [{ id: 'solar-storm', protectedBy: 'power', marginPct: 38, harmed: false, scienceLossPct: 0 }],
  outcome: 'success' | 'failure',
  failedPhase: null | 'launch' | 'transfer' | 'operations' | 'data',
  scienceDelivered,
}
```
A simulação **pode rodar com erros** ("falhar ensina"): ela para na fase do primeiro erro, conforme a tabela 7.3.

### 7.3 Códigos de problema → fase da simulação → etapa para corrigir
| Código | Tipo | Fase em que a missão falha | "Redesign" leva para |
|---|---|---|---|
| `NO_ROCKET`, `ROCKET_CANNOT_REACH_ORBIT`, `PAYLOAD_TOO_HEAVY` | erro | launch | etapa 3 |
| `OVER_BUDGET` | erro | launch | etapa 2 |
| `NO_ORBIT`, `ORBIT_NOT_ALLOWED` | erro | transfer | etapa 3 |
| `MISSING_REQUIRED_TYPE` (instrument, power), `POWER_DEFICIT` | erro | operations | etapa 2 |
| `OVER_TIME`, `ORBIT_DECAY` (P1) | erro | operations | etapa 3 |
| `MISSING_REQUIRED_TYPE` (comms), `NO_COMMS` | erro | data | etapa 2 |
| ciência entregue < mínima (depois dos eventos) | falha | data | etapa 2 |
| `LOW_SCIENCE` (ciência entregue abaixo da meta, já no projeto) | erro | data | etapa 2 |
| `LOW_MASS_MARGIN`, `DATA_BACKLOG` | aviso | não falha | — |

### 7.4 Testes
- ✅ Já existem: `resources`, `compatibility`, `validation`, `scoring`, `findWinningMission` e `data` (formato e equilíbrio com as tabelas reais). São 50 testes.
- A fazer: `simulate.test.js` (mesma semente gera os mesmos eventos; sobra ≥ 15% sem dano; fase de falha conforme 7.3), `messages.test.js` (todo código do motor tem texto em `content.issues`; nenhum `{name}` sobra sem preencher) e as regras extras de equilíbrio da 6.4.

### 7.5 Contrato do `view3d` (somente leitura)
```js
// src/view3d/index.js
export async function mount(container) {}           // cria renderer; lança se WebGL falhar (main.js trata e usa fallback2d)
export function showMenu(scenarioId) {}             // planeta girando
export function showSpacecraft(design, data) {}     // reconstrói a nave a partir de partIds
export function showRockets(rocketId, data) {}      // 4 foguetes lado a lado
export function playFlight(simulation, design, data, { onPhase }) {} // anima fases; chama onPhase(i) para a UI sincronizar
export function setPaused(bool) {}
export function dispose() {}
```
O `view3d` nunca importa `state/` nem chama ações. Recebe dados e desenha.

---

## 8. Design system e referências visuais

### 8.1 Estilo visual
Painel de controle de missão: limpo, plano, com ícones, tipo infográfico. Sério, inspirador e otimista. Fundo espacial escuro com estrelas, painéis translúcidos sobre a cena 3D. Brilho (glow) só para seleção, sucesso e alerta.

### 8.2 Paleta (do GDD original; unificar com `style.css`)
```
--bg:         #08111F  fundo espacial (substitui #0b1020 atual)
--panel:      #123A63  painéis
--sel:        #2D9CDB  seleção / CTA (substitui --accent #4da3ff)
--hi:         #56CCF2  destaque / informação
--warn:       #F2C94C  trade-off / atenção
--bad:        #EB5757  falha / limite estourado
--good:       #27AE60  sucesso
--text:       #E0E6F0  texto
--sub:        #8E9AAF  texto secundário
--gold:       #FFD166  recorde
```
Medidor: < 67% azul, 67–90% âmbar, 90–100% laranja pulsando (tag "RISKY"), > 100% vermelho (tag "OVER THE LIMIT").

### 8.3 Tipografia
- `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (já no repo; zero download).
- Títulos 800–900; corpo 400; números 700. Base de 14 px no desktop e 13 px no celular.

### 8.4 Componentes base (HTML/CSS próprios)
`Card` (escolha única ou múltipla, com chips de stats e estado desabilitado com motivo), `Meter` (barra + valor + tag + toque abre modal), `StepTabs`, `LearnBox`, `Checklist` (GO/NO-GO clicável), `Modal`, `Toast`, `Banner` ("Stage complete"), `PhaseTimeline`, `ReportCard`, `QuizCard`, `Legend`, `PauseOverlay`.

### 8.5 Animações (do GDD)
| Ação | Duração |
|---|---|
| Hover/seleção de cartão | 120 ms ease-out, escala 1,02 + glow |
| Barra do medidor | 180 ms ease-out |
| Troca de etapa | 220 ms slide/fade |
| Revelação do resultado | 450 ms |
| Sucesso | bounce de 600 ms + confete |
| Tremida (inválido/falha) | 160 ms, baixa intensidade |
| Flash | 120–180 ms |
| Falha | congela 300 ms → pulso vermelho → relatório |

Todas desligam com `prefers-reduced-motion`.

### 8.6 Referências visuais
- **Protótipo 3D local** (`index.html` desta pasta): layout com painel esquerdo, medidores à direita e 3D no centro; nave em primitivas; cena de lançamento. É a referência principal.
- NASA Eyes on the Solar System (planetas e trajetórias).
- Kerbal Space Program (só o "montar e ver voar", sem física).
- Interface do NASA Mission Design Lab e dashboards do SpaceX (seriedade e clareza).
- Texturas: NASA Visible Earth (Blue Marble), NASA SVS CGI Moon Kit, Mars Viking/MGS mosaics (domínio público; usar versões de 1k).

---

## 9. Roadmap faseado (48 horas)

> Datas do evento: 14 e 15/11/2026. Confirmar o prazo de submissão no site do Space Apps.

### Fase 0: Setup (hoje, 13/11, ~1 h)
- [x] Motor de regras com testes (`silvio/engine`) e tabelas de dados (`carlos/data`) juntos no `main`, 50 testes verdes.
- [x] Junção do PRD 0.2 com o que já existe (versão 0.3, seção 0.1).
- [ ] `npm install three` e confirmar `npm run dev`, `npm test` e `npm run build`.
- [ ] Criar as pastas da seção 5.5 vazias com `.gitkeep`.

### Fase 1: Jogo jogável em HTML (14/11, manhã e tarde, P0)
| Bloco | Dono sugerido | Stories |
|---|---|---|
| Dados (`parts`, `rockets`, `orbits`, `scenarios`) | Carlos | ✅ feito; falta `description` e `difficulty` (6.3) |
| Motor: status dos medidores, `resolveDesign`, `formatIssue`, testes | Silvio | US-004 a US-012 (regras) |
| Estado + menu + etapas 1 a 3 em HTML | Silvio | US-001 a US-006, US-009, US-010, US-012 |
| Simulação (sem 3D) + relatório | Silvio | US-013, US-014, US-016, US-019, US-020 |
| Textos (`content.js`) e eventos (`events.js`): mensagens, learn, medidores, missões reais, quiz | Carlos | US-008, US-014, US-016, US-017, US-018 |
| Controles, pausa, legenda | Silvio | US-021, US-022 |

**Marco do fim do dia 14:** os 3 cenários jogáveis de ponta a ponta sem 3D, testes verdes, deploy no GitHub Pages.

### Fase 2: 3D e polimento (15/11, P1, time-box de 3 a 4 h de 3D)
1. Visualizador da nave (US-007) com fallback 2D.
2. Cena de lançamento, transferência e órbita (US-015).
3. Foguetes lado a lado (US-011).
4. Animações e juice (seção 8.5), confete e near-miss.
5. Modo equipe pass-and-play (US-024), **só se 1 a 4 estiverem prontos até as 14h do dia 15**.

### Fase 3: Entrega (15/11, últimas 3 h)
- [ ] README: como rodar, como jogar, time, link do desafio, créditos (texturas NASA, uso de IA).
- [ ] Vídeo de demo (⚠️ confirmar duração e formato exigidos no site do Space Apps): fluxo 4.1 + falha 4.2.
- [ ] Pitch em inglês (roteiro de 1 minuto: problema → jogo → aprendizado → próximos passos).
- [ ] Submissão no site do Space Apps.

### O que fica FORA do MVP (explicitamente)
- Leaderboard online, contas, login e qualquer backend.
- Multiplayer em rede (o modo equipe é no mesmo aparelho).
- Sandbox (US-025) e modo competitivo entre equipes.
- Física orbital real, Δv explícito, bateria e eclipse como recursos separados (estavam no protótipo e deixaram o jogo complexo demais).
- Modelos 3D importados (GLTF) e música. (Efeitos sonoros entraram na 0.5, sintetizados no navegador.)
- Mais de 3 cenários, salvar e compartilhar designs por link. (A campanha é salva no navegador desde a 0.5; compartilhar por link continua fora.)
- Tradução da UI para o português.

---

## 10. Prompts prontos para desenvolvimento

> Pensados para o **Claude Code** dentro do repositório (que já lê o `CLAUDE.md`). Cada prompt pede o plano antes de mexer em vários arquivos, como manda o acordo do time. Cole um por vez.

### 10.1 Prompt: Preparar a estrutura

```
Contexto: Space Mission Design Game (Tupi Orbit), NASA Space Apps 2026. Leia CLAUDE.md e
prd-space-mission-design-game.md (seções 0.1, 5.5, 6 e 7). Stack: Vite + JS puro + Vitest + Three.js como camada visual.

Tarefa:
1. Instalar `three` como dependência.
2. Criar as pastas de src/ da seção 5.5 que ainda não existem (state, ui/screens, ui/components, view3d,
   assets/textures) com .gitkeep onde estiver vazio. Não mexer no que já existe em engine/ e data/.
3. Criar src/engine/constants.js com TIGHT_RATIO e EVENT_SAFE_MARGIN (seção 6.1).
4. Atualizar src/style.css com os tokens de cor da seção 8.2 (manter a estrutura atual).

Antes de mexer, mostre o plano em pt-BR e espere aprovação.
Critérios de aceitação:
- npm run dev, npm test e npm run build passam (os 50 testes atuais continuam verdes).
- Nenhuma outra dependência adicionada.
- Comentários e código em inglês.
```

### 10.2 Prompt: Dados e textos (Carlos)

As tabelas já estão prontas. Os próximos passos do Carlos, com um prompt para cada tarefa, estão no [`Carlos.md`](Carlos.md).

### 10.3 Prompt: Status dos medidores, resolveDesign e formatIssue

```
Contexto: PRD seções 6.1, 7.1, 7.2 e 7.3. Funções puras em src/engine/, sem DOM e sem Three.js.
O motor atual (computeBudget, validateMission, scoreMission) já funciona e tem testes: estender, não reescrever.

Tarefa:
1. src/engine/resolve.js: resolveDesign(design, data) transforma { partIds, orbitId, rocketId } em
   { parts, rocket, orbit }. Id desconhecido lança Error('Unknown part id: x').
2. Em computeBudget, acrescentar ratio e status ('ok' | 'tight' | 'over' | 'pending') a cada recurso,
   usando TIGHT_RATIO. Não mudar os campos que já existem.
3. src/engine/messages.js: formatIssue(issue, content) preenche os {name} de content.issues[issue.code].
   Se o código não tiver texto, devolver um texto genérico com o código (não quebrar).

Critérios de aceitação:
- Os 50 testes atuais continuam verdes.
- Novos testes: status em 0,96 → 'tight', 1,01 → 'over', sem foguete → mass 'pending';
  resolveDesign com id desconhecido lança erro; formatIssue preenche todos os valores.
- Mostre a saída de npm test ao terminar.
```

### 10.4 Prompt: Regras extras de equilíbrio

```
Contexto: PRD seção 6.4. tests/data.test.js e tests/helpers/findWinningMission.js já existem.

Tarefa: acrescentar a tests/data.test.js, para cada cenário, a contagem de combinações vencedoras
(subconjunto não vazio de instrumentos × 1 power × 1 comms × órbitas permitidas × foguetes), usando
validateMission e scoreMission (vencedora = sem erros e objetivo atingido).

Critérios de aceitação:
- Cada cenário tem ≥ 10 combinações vencedoras.
- Entre as vencedoras há pelo menos 2 foguetes OU 2 órbitas diferentes.
- O teste imprime (console.info) a contagem por cenário e roda em menos de 2 s.
- Se as tabelas atuais não passarem, NÃO mude os dados: mostre os números para o time decidir.
```

### 10.5 Prompt: Estado e ações

```
Contexto: PRD seção 6.8 e 5.2 (fluxo UI → state → engine → state → view3d).

Tarefa: criar src/state/store.js (estado único, getState, subscribe(listener), dispatch(action)) e
src/state/actions.js com: selectScenario, startMission, confirmStep, goToStep, togglePart(partId),
setPower(partId) (troca a fonte de energia anterior), setComms(partId), setOrbit, setRocket, launch,
redesign, togglePause, answerQuiz.
- A avaliação nunca é guardada no estado: exporte selectEvaluation(state), que chama
  validateMission(resolveDesign(state.design, data), scenario).
- Recorde: src/state/persistence.js com loadBest/saveBest usando a chave
  space-mission-design-game:best-v1, tudo em try/catch.

Critérios de aceitação:
- tests/state.test.js: togglePart duas vezes remove a peça; setPower substitui; redesign mantém o design
  e vai para a etapa da tabela 7.3 ligada ao primeiro erro.
- Sem DOM nesses arquivos.
```

### 10.6 Prompt: Telas HTML das etapas 1 a 3

```
Contexto: PRD seções 3 (Épicos 1 a 3), 4.1, 8. UI em inglês, HTML/CSS puro.
Use o index.html do protótipo local (pasta game-hackaton) só como referência visual de layout:
painel esquerdo com cartões, medidores à direita, área central reservada ao 3D, rodapé com
Back/Next e legenda de controles.

Tarefa:
1. src/ui/components: card.js, meter.js, checklist.js, modal.js, toast.js, legend.js (funções que
   devolvem HTML ou elementos; nada de regra de jogo).
2. src/ui/screens: menu.js, objective.js, spacecraft.js (abas Instruments / Power / Comms),
   launch.js (órbita + foguete + checklist GO/NO-GO).
3. Medidores: Budget, Mass, Power, Data downlink, Time + linha de Science (estrelas).
   Cores e tags conforme a seção 8.2. Tocar no medidor abre modal com content.meters.
   Problemas aparecem com formatIssue + content.issues.
4. Teclado: Enter = next, Backspace = back, 1–8 = escolher cartão, P/Esc = pause.
5. Responsivo: abaixo de 860 px, cartões viram gaveta inferior (máx. 44vh) e os medidores ficam em grade no topo.

Critérios de aceitação:
- Consigo jogar o fluxo 4.1 até o checklist sem 3D.
- Escolha que estoura um limite: medidor treme 160 ms e aparece toast com formatIssue.
- Todos os cartões são <button>, com foco visível. Sem erros no console.
- Teste manual em 375×812 e 1280×720 (descreva o que verificou).
```

### 10.7 Prompt: Simulação e relatório

```
Contexto: PRD seções 6.6, 7.2, 7.3, 3 (Épicos 4 e 5) e 4.2. src/data/events.js e content.js (Carlos).

Tarefa:
1. src/engine/random.js: mulberry32(seed) e hashDesign(design).
2. src/engine/simulate.js: simulateMission(mission, scenario, events, seed) conforme 7.2 e 7.3
   (4 fases, 1 ou 2 eventos do cenário, sobra ≥ EVENT_SAFE_MARGIN sem dano, fase de falha pela tabela 7.3,
   scienceDelivered depois dos eventos; falha por ciência só se scienceDelivered < minScience).
3. scoreMission passa a aceitar a simulação e usa scienceDelivered nos 50 pontos de ciência.
4. src/ui/screens/simulation.js: linha do tempo das 4 fases (~1,5 s cada), mensagem por fase,
   cartões de evento (verde com safeText, âmbar com hurtText), congela 300 ms na falha + pulso vermelho.
   Pausa congela o tempo.
5. src/ui/screens/report.js: SUCCESS/FAILED, nota 0–100 com breakdown, o que funcionou/falhou com formatIssue,
   What to learn, Real mission like yours, quiz (uma resposta, selo "Mission expert", sem pontos),
   recorde por cenário, botões Redesign / Next mission / Main menu.

Critérios de aceitação:
- tests/simulate.test.js conforme 7.4; os testes atuais continuam verdes.
- Mesma missão relançada → mesmos eventos. "Try again with new conditions" → runCount+1.
- Se events.js ou content.js ainda não existirem, a simulação roda sem eventos e com textos genéricos.
```

### 10.8 Prompt: Visualizador 3D da nave

```
Contexto: CLAUDE.md seção "3D layer" e PRD 7.7. Three.js só lê dados e desenha.
Referência visual: buildProbe() do index.html do protótipo local (primitivas: corpo dourado, antena
parabólica, painéis com textura de células, RTG com aletas, câmera, espectrômetro, antenas de radar,
haste do magnetômetro).

Tarefa:
1. src/view3d/index.js com mount, showMenu, showSpacecraft, setPaused, dispose (API da 7.7).
2. src/view3d/spacecraft.js: buildSpacecraft(design, data) mapeando cada part id para uma peça visual.
   Peças desconhecidas viram uma caixinha genérica (não quebra).
3. src/view3d/fallback2d.js: diagrama 2D simples (SVG ou canvas) com a lista de peças.
4. main.js: carregar view3d com import() dinâmico; se mount lançar, usar fallback2d.
5. Interação: arrastar gira; sem interação gira devagar; "pop" de escala 1,08 → 1 ao mudar peças.
6. Performance: pixel ratio máx. 2, reutilizar geometrias e materiais, dispose ao trocar de tela.

Critérios de aceitação:
- npm run build gera um chunk separado para view3d.
- Com WebGL desligado (chrome://flags ou forçando erro), o jogo segue jogável com o fallback.
- 30+ fps no notebook do time com a nave completa.
- Time-box: se passar de 2 h, pare e me mostre o que tem.
```

### 10.9 Prompt: Lançamento e órbita em 3D

```
Contexto: PRD US-015 e 7.7 (playFlight). Referência: setupFlight3D/updateFlight do index.html do protótipo.

Tarefa: src/view3d/flight.js + planets.js
- Cena: Terra (textura NASA 1k em src/assets/textures, crédito no README), foguete escolhido (showRockets já
  monta os modelos), destino (Terra/Lua/Marte) e anel de órbita na altitude em escala de cena.
- playFlight(simulation, design, data, { onPhase }) anima: launch (subida com partículas),
  transfer (curva Bezier com rastro), operations (nave orbitando o anel), data (pulsos da nave para a Terra).
- Falhas: mass → foguete sobe pouco, inclina e explode; power → nave apaga e pisca vermelho;
  time (arrasto) → anel encolhe e a nave some com brilho laranja.
- setPaused(true) congela tudo.

Critérios de aceitação:
- A UI de simulação (10.7) recebe onPhase e fica sincronizada com a animação.
- Sem WebGL, a simulação 2D da 10.7 continua funcionando sozinha.
- Nada em flight.js decide resultado: tudo vem de simulation.
```

### 10.10 Prompt: Modo equipe (P1, só se o P0 estiver pronto)

```
Contexto: PRD US-024 e fluxo 4.4.

Tarefa:
- Menu: botão "Team mode" → escolher 2 a 4 jogadores e apelidos opcionais (só em memória).
- Papéis: Mission Lead, Science Lead, Spacecraft Engineer, Flight Dynamics (com 2 ou 3 jogadores, papéis acumulam).
- Priority cards (em content.js), sorteadas com a semente da missão; algumas conflitam de propósito:
  "Get 3+ instruments", "Keep 20%+ mass margin", "Spend under 80% of the budget", "Reach 1.5× the science goal".
- Banner de vez em cada etapa; o papel da vez confirma o Next.
- Relatório: placar de equipe (+150 por prioridade cumprida).

Critérios de aceitação:
- Single player continua idêntico.
- Teste de unidade: a avaliação das priority cards é pura e está em engine/team.js.
```

### 10.11 Prompt: Deploy no GitHub Pages

```
Contexto: vite.config.js já usa base './'.

Tarefa: criar .github/workflows/deploy.yml que, em push na main, roda npm ci, npm test e npm run build e
publica dist/ no GitHub Pages (actions/upload-pages-artifact + actions/deploy-pages).
Atualizar o README com o link do jogo, como rodar, como jogar, time, link do desafio e créditos
(texturas NASA, uso de assistentes de IA).

Critérios de aceitação:
- Workflow falha se os testes falharem.
- O jogo abre no link público sem erro 404 de assets.
- Não faça commit nem push sem eu pedir. Mensagens de commit em inglês imperativo, sem Co-Authored-By.
```

### 10.12 Prompt: Checagem final antes da submissão

```
Tarefa: rodar npm test e npm run build; abrir npm run preview; jogar os fluxos 4.1 e 4.2 e um Marte
vencedor (o teste de equilíbrio da seção 6.4 mostra combinações vencedoras); testar em 375×812; testar com WebGL desligado e em aba anônima.
Relatar em pt-BR, com honestidade, o que passou, o que falhou e o que não foi possível verificar.
Não corrigir nada sem me perguntar.
```

---

## 11. Riscos técnicos e trade-offs

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| 3D consome o dia 15 e o jogo não fecha | Alta | Alto | 3D só depois do marco do dia 14; time-box de 3 a 4 h; prompts 10.8 e 10.9 com "pare em 2 h" |
| Mudança de dados quebra o balanceamento | Média | Alto | `tests/data.test.js` no CI (formato + equilíbrio) |
| Carlos e Silvio divergem no formato dos dados | Média | Médio | Formatos combinados no `Carlos.md` e na seção 6; `data.test.js` valida tudo |
| Jurado acha os números "irreais" | Média | Médio | Rótulo "simplified" visível no jogo e no README; citar referências reais |
| WebGL ou GPU fraca no PC do jurado | Baixa | Alto | Lazy-load + fallback 2D + vídeo de demo como garantia |
| Jogo complexo demais de novo | Média | Alto | Máx. 5 medidores; máx. 8 cartões por tela; teste de corredor com alguém de fora |
| Prazo de submissão diferente do esperado | Baixa | Alto | ⚠️ Confirmar no site no início do dia 14 |

### Trade-offs explícitos assumidos
1. **Simplicidade acima de realismo:** fatores por órbita no lugar de física; combustível calculado sozinho.
2. **Dados e comunicação num medidor só** para o jogador, mas os dois campos continuam separados no motor (o desafio cita os dois).
3. **Eventos aleatórios que raramente matam a missão:** ensinam margem sem frustrar a demo.
4. **Sem backend:** sem ranking online, em troca de custo zero e nenhum dado pessoal.

---

## 12. Checklist de lançamento (submissão)

- [ ] 3 cenários jogáveis de ponta a ponta (sucesso e falha) no link público
- [ ] `npm test` verde (motor, simulação, score, balanceamento)
- [ ] Controles visíveis no menu e durante o jogo
- [ ] Pausa funciona no design e na simulação
- [ ] Recorde persiste entre sessões (e o jogo não quebra sem `localStorage`)
- [ ] Jogável sem WebGL (fallback 2D)
- [ ] Testado em celular (em pé) e em notebook
- [ ] Console sem erros
- [ ] Textos em inglês revisados; resumo em pt-BR enviado ao Silvio
- [ ] Rótulo "values are simplified" no jogo e no README
- [ ] README completo (como rodar, como jogar, time, desafio, créditos NASA e de IA)
- [ ] Vídeo de demo e pitch em inglês
- [ ] Favicon, `<title>`, meta description, OG image simples
- [ ] Submissão feita antes do prazo oficial

---

## 13. Apêndices

### 13.1 Glossário (termos que o jogo explica)
| Termo (UI) | Explicação simples (para `content.js`) |
|---|---|
| Payload capacity | How much mass a rocket can carry to a destination |
| LEO / SSO / GEO | Low orbit (close, detailed, more drag) / Sun-synchronous (same light every pass) / Geostationary (stays over one spot, far away) |
| TLI / TMI | Trans-Lunar / Trans-Mars Injection: the push that sends a spacecraft to the Moon or Mars |
| Downlink | Data the spacecraft can send to Earth each day |
| RTG | Nuclear battery that turns heat into electricity; works in the dark |
| Margin | Extra room left below a limit; protects against surprises |
| Propellant | Fuel the spacecraft carries to brake or stay in orbit |

### 13.2 Links de referência
- Desafio: https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/
- Repositório: https://github.com/avoddigital/space-mission-design-game
- Recursos citados no `CLAUDE.md`: NASA Design and Develop Science Missions, Mission Design Lab, GMAT, CubeSat 101 (links na aba Resources do desafio).
- Missões reais para os cartões: Landsat 9, Lunar Reconnaissance Orbiter (LRO), MAVEN.
- Three.js docs: https://threejs.org/docs/
- Texturas de domínio público: NASA Visible Earth, NASA Scientific Visualization Studio.

### 13.3 Estimativa de custos
| Serviço | Tier | Custo |
|---|---|---|
| GitHub (repo + Pages + Actions) | Free | US$ 0 |
| Vite, Vitest, Three.js | Open source | US$ 0 |
| Texturas NASA | Domínio público | US$ 0 |
| **Total** | | **US$ 0** (regra "free tools only") |

### 13.4 Mapeamento: desafio → PRD
| Pedido do desafio | Onde está |
|---|---|
| Definir objetivo antes do design | Etapa 1, US-003 |
| Nave, instrumentos com massa, energia, custo, dados, ciência | US-004 a US-007, seção 6.2 |
| Foguete e órbita com checagem de compatibilidade | US-009, US-010, 7.1 (`checkLaunch`) |
| Recursos: massa, energia, orçamento, dados, comunicação, tempo | 5 medidores, 7.1 (`computeBudget`) |
| Simulação e avaliação | US-013, US-014, 7.2, 7.3 |
| Explicar o porquê, não só certo ou errado | `formatIssue` + `content.issues`, What to learn, US-016 |
| Não existe solução única | 6.4 e `tests/data.test.js` |
| Até 4 participantes com papéis | US-024 (P1) |
| Níveis de dificuldade e cenários | 3 cenários com rótulo easy, medium, hard (6.3) |
| Eventos aleatórios, relatório, visualização interativa | US-014, US-016, US-007, US-015 |

---

## 14. Público-alvo, aprendizagem, unidades e idiomas (v0.4, 14/11/2026)

O texto completo, em inglês e com as fontes conferidas, está em [`docs/learning-design.md`](docs/learning-design.md). Aqui fica o resumo das decisões.

### 14.1 Público-alvo (recorte)
- **Adolescentes e adultos da Geração Z.** A Pew Research Center define o início da geração em quem nasceu de 1997 em diante e não fixou um ano final; usamos 1997–2012 (14 a 29 anos em 2026).
- Dois grupos: **estudantes de 14 a 17 anos** (persona Ana) e **jovens adultos de 18 a 29** (persona Lucas, 2.1b). Professores continuam como público secundário (modo Missão livre).
- Requisitos que saem desse recorte (testáveis, sem estereótipos): navegador sem instalação e sem login, sessões curtas com salvamento, aprender fazendo antes de ler, autonomia de escolha, fontes reais checáveis, jogável sem som e com movimento reduzido.

### 14.2 O que fazer em cada missão
- **Fase 1 · Terra:** satélite que observa a Terra por um ano. Desafio: caber num foguete pequeno e num orçamento pequeno. Erro comum: câmera melhor = pesado demais ou dados demais para a antena.
- **Fase 2 · Lua:** mapear a Lua da órbita. Desafio: foguete maior, porque a capacidade até a Lua é bem menor que até a órbita baixa. Erro comum: manter o foguete pequeno.
- **Fase 3 · Marte:** estudar Marte depois de meses de viagem. Desafio: tempo, orçamento e dados apertados; a antena limita a ciência que chega. Erro comum: instrumentos demais para a antena.
- **Entre missões:** verba paga cada lançamento (mesmo com falha), missões secundárias dão verba ou ciência, pesquisas melhoram peças, eventos ajudam ou atrapalham, a Biblioteca libera conteúdo real.

### 14.3 O que o jogador aprende em cada etapa
Objetivo (a missão começa por uma pergunta científica) → Nave (cada peça custa massa, energia, dinheiro e dados) → Órbita e foguete (a órbita define o que se vê e o quanto custa chegar; a capacidade do foguete depende do destino) → Voo (margem protege contra imprevistos) → Relatório (por que deu certo ou errado e quais missões reais tiveram o mesmo problema) → Redesenho (não existe uma única resposta certa). A tabela completa, com os níveis da taxonomia de Bloom revisada, está no documento.

### 14.4 Pedagogia e andragogia
Referências usadas e onde aparecem no jogo: Kolb (ciclo da aprendizagem experiencial = laço projetar, lançar, refletir, redesenhar), Knowles (andragogia: saber o porquê, autonomia, experiência prévia, foco em problemas), Vygotsky e Wood, Bruner & Ross (andaimes: Terra → Lua → Marte, dicas que vão sumindo), Papert (construcionismo: construir a nave em 3D), Gee (informação "na hora certa" em jogos), Kapur (falha produtiva), Paulo Freire (diálogo e autonomia em aula) e Black & Wiliam (feedback formativo durante a atividade).

### 14.5 Democratização dos dados da NASA
- Política SPD-41a da NASA: informação de pesquisa financiada pela diretoria científica é pública; publicações sem embargo; dados de missão liberados o quanto antes.
- Imagens da NASA em geral sem direito autoral nos EUA, com crédito à NASA, sem logotipo e sem sugerir endosso.
- No jogo: texturas e imagens reais com crédito, fatos com link para a fonte, recursos do desafio na Biblioteca. O jogador aprende a checar informação e descobre que os mesmos dados e ferramentas dos profissionais estão abertos.

### 14.6 Aprender com os erros
Limite exato nomeado com números; link "Fix in step N"; redesenho mantendo as escolhas; mesma nave = mesmos eventos (comparação justa); relatório explica a margem; exemplo real da Mars Climate Orbiter (perdida em 1999 por um erro de conversão de unidades inglesas para métricas, segundo a NASA); falha custa verba na campanha, mas não encerra o jogo.
- **Risco conhecido:** uma agência que gasta quase toda a verba pode demorar a se recuperar (a missão secundária gratuita tem 3 usos por fase). Avaliar no playtest; se for problema, criar um "auxílio do governo" quando a verba ficar abaixo do custo da missão mais barata.

### 14.7 Unidades de medida
- **Decisão: Sistema Internacional (SI) em tudo** (kg, W, km, dias, GB/dia); dinheiro em milhões de dólares (M USD).
- **Conferido:** a diretiva NPD 7120.4E da NASA manda usar o SI em novos projetos espaciais, especialmente com parceiros internacionais (vigente até 26/06/2027). O NIST diz que todos os países reconheceram e adotaram o SI, inclusive os EUA, mas que o uso é obrigatório em alguns países e voluntário em outros.
- Nos EUA, no dia a dia, ainda se usam libras (lb). **Proposta (não feita):** mostrar a massa também em libras como opção, sem mudar as regras (que continuam em SI).

### 14.8 Idiomas
- **Feito (14/11):** inglês (padrão), português e espanhol. Botão de idioma (ícone de globo) no título, centro de comando, barra da missão, Missão livre e Biblioteca, e tecla **L**. Primeira visita segue o idioma do navegador; a escolha fica salva.
- Textos da interface em `src/i18n/` (en, pt, es); tabelas, conteúdo, Biblioteca e campanha traduzidos por id sobre o inglês. A tradução só muda palavras: ids, números, links e quantidade de fatos ficam iguais (`tests/i18n.test.js`). Números no formato do idioma (vírgula decimal em pt/es); unidades continuam SI.

---

## 15. O que entrou em 14/11/2026 (v0.5)

Tudo abaixo está implementado e coberto por testes (198 testes passando em 14/11). Detalhes de visual em `DESIGN.md`; de aprendizagem em `docs/learning-design.md`.

### 15.1 Campanha (decisões tomadas pela equipe em perguntas e respostas)
| Tema | Decisão |
|---|---|
| Escopo | **Campanha enxuta:** 3 fases em ordem (Terra → Lua → Marte), usando os 3 cenários existentes |
| País | Os 16 países parceiros do Space Apps 2026 **+ Europa** (ESA), sem EUA (anfitrião, não parceiro). Só o país e a bandeira; **nunca o nome da agência** |
| Efeito do país | **Só identidade.** A diferença de jogo vem do **foco da agência**: Observação da Terra (+30% de ciência), Exploração (viagens 15% mais curtas) ou Tecnologia (pesquisa 25% mais barata) |
| Recursos da agência | **Verba** e **pontos de ciência**, separados do orçamento de cada missão |
| Orçamento da missão | Limitado pela verba da agência; o lançamento paga o custo real, **mesmo se falhar** |
| Falha | Perde a verba gasta e pode tentar de novo; **sem fim de jogo** |
| Novas fontes de recursos | Missões secundárias (podem falhar, uma é grátis), pesquisas (gastam ciência e melhoram peças) e eventos entre missões |
| Modo antigo | Vira **Missão livre**, no título |
| Salvamento | Automático no navegador (`localStorage`), com "Continuar" e "Nova campanha" |
| Menu | Tela de título com a **Terra vista do espaço em 3D**; centro de comando com o globo, que acende a Lua e Marte conforme as fases são liberadas |
| Bandeiras | Pacote **flag-icons** (MIT), aprovado pela equipe |

Regras em `src/engine/campaign.js` (funções puras), tabelas em `src/data/campaign.js`, testes em `tests/campaign.test.js`. **Risco conhecido:** uma agência que gasta quase tudo pode demorar a se recuperar; avaliar no playtest (seção 14.6).

### 15.2 Biblioteca de Missões
- Repositório separado de conhecimento: 7 missões reais, 7 temas e os 8 recursos oficiais do desafio.
- **Só fatos reais e conferidos**, cada um com link para a página oficial; imagens da NASA Image and Video Library com crédito. `tests/library.test.js` garante fonte oficial e imagem da NASA.
- Desbloqueio **por fase e por descobertas** (pesquisas, missões secundárias, eventos); itens bloqueados mostram como descobrir.
- As imagens carregam dos servidores da NASA: precisam de internet.

### 15.3 Conquistas (badges)
- 16 emblemas de missão em 5 grupos: primeiros passos, destinos, engenharia, aprendizado e agência.
- Valem na campanha e na Missão livre; ficam salvos no navegador. Aviso ao ganhar, lista no relatório e tela de coleção.
- Premiam hábitos de aprendizado, não só vencer (ex.: "Lição aprendida": ter sucesso depois de falhar na mesma missão).
- Regras em `src/engine/achievements.js`, testes em `tests/achievements.test.js`.

### 15.4 Identidade visual, sons e tela
- Estilo **"Console Tupi"** (console de controle de missão dos anos 60): placas de metal, lâmpadas, visores âmbar, botão de lançamento com faixas de perigo, fontes B612 e Big Shoulders Stencil. Substitui a paleta da seção 8.2.
- **Sons** sintetizados com a Web Audio API, com botão e tecla M para desligar.
- Em telas a partir de 861 px, o jogo **ocupa a janela sem rolagem de página**; listas longas rolam dentro do próprio painel.
- Título em destaque: **Tupi Orbit**, com "Space Mission Design Game" como subtítulo.
- Selos nos cartões de peças e foguetes ("High science", "Heavy"...), calculados a partir das tabelas.

### 15.5 Idiomas
Inglês, português e espanhol (seção 14.8): textos em `src/i18n/`, tabelas traduzidas por id, `tests/i18n.test.js` garante que a tradução não muda regras, números nem links.

### 15.6 Pendências
- Juntar a branch no `main` para publicar no GitHub Pages e conferir de novo no site publicado.
- Revisão das traduções por falantes nativos (principalmente o espanhol).
- Playtest do equilíbrio da campanha (verba, recompensas, chances).
- Opcional: mostrar a massa também em libras (seção 14.7) e baixar as imagens da Biblioteca para funcionar offline.

