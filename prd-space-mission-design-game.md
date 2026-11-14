# PRD: Space Mission Design Game (Tupi Orbit)

> **Versão:** 0.2 (MVP de hackathon)
> **Data:** 13/11/2026 (véspera do evento, 14 e 15/11/2026)
> **Autor:** Product Owner, equipe Tupi Orbit (Silvio Barretto e Carlos)
> **Stack:** Vite + JavaScript puro (ES modules) + HTML/CSS + Three.js como camada visual + Vitest. Sem backend, `localStorage`, deploy estático no GitHub Pages.
> **Base:** repositório `avoddigital/space-mission-design-game` (commit `462b22e`), desafio NASA Space Apps 2026 "Space Mission Design Game" e o protótipo 3D local (`index.html` desta pasta).

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
| Tudo que vai para o jogador em **inglês**; conversa da equipe em pt-BR | `CLAUDE.md` › Language rules |
| Sem `Co-Authored-By` nem atribuição de IA em commits | `CLAUDE.md` › Working agreements |

O que este PRD **acrescenta ou ajusta**, com base no feedback do protótipo ("ficou complexo demais; precisa ser mais educativo e 3D"):

1. **Menos números na tela.** Os 6 recursos do desafio continuam existindo no motor, mas o jogador vê **5 medidores simples** (Dados e Comunicação viram um medidor só: "dados gerados × dados que cabem no rádio"). Nada de Δv, bateria separada ou fórmulas na tela principal.
2. **Educação embutida em cada etapa:** caixa "Learn" com um conceito por etapa, checklist em linguagem simples antes do lançamento, relatório que explica o *porquê* e um quiz de 1 pergunta no fim.
3. **3D promovido de "enfeite" a parte central da demo**, sem quebrar a regra de arquitetura: visualizador da nave que muda a cada peça (etapa 2) e cena de lançamento e órbita (etapas 3 e 4). O jogo continua 100% jogável sem WebGL.
4. **Eventos aleatórios ligados a margens.** Tempestade solar, atraso de lançamento e queda de estação terrestre só machucam quem deixou pouca folga. Isso ensina por que engenheiros guardam margem.
5. **Dados de jogo propostos e balanceados** (seção 6), com força bruta: cada cenário tem várias soluções vencedoras e nenhuma "resposta única".

> ⚠️ **Campos novos nos dados** (marcados com 🆕 na seção 6) mudam o contrato que o Carlos está seguindo. **Combinar com o Silvio antes de usar**, como pede o `Carlos.md` §6.

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
2. **3 cenários jogáveis de ponta a ponta** (Terra, Lua, Marte), cada um com pelo menos 10 combinações vencedoras (verificado por teste automatizado, seção 7.6).
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
- Dado que respondo, então vejo a correta em verde, a explicação em 2 frases e +200 pontos se acertei. Só posso responder uma vez.

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
- Existem 16 combinações vencedoras de 18.360 (seção 6.6). A dica da etapa aponta para instrumentos com pouco dado (magnetômetro, altímetro, sondador atmosférico).

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
    content.js           # textos para o jogador: learn boxes, quiz, missões reais, eventos (etapa 6 do Carlos)
  engine/
    resources.js         # sumResources (já existe)
    constants.js         # BUS, limites de near-miss, pesos do score
    evaluate.js          # evaluateDesign(design, data) -> evaluation
    simulate.js          # simulateMission(design, evaluation, seed) -> timeline
    score.js             # scoreMission(...)
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
  resources.test.js      # já existe
  evaluate.test.js
  simulate.test.js
  score.test.js
  balance.test.js        # garante soluções vencedoras por cenário
```

---

## 6. Modelo de dados

Não há banco. O "schema" são as tabelas em `src/data/` (contrato do `Carlos.md`) mais o estado em memória e as chaves do `localStorage`. **Valores simplificados, inspirados em missões reais, não exatos.** Campos 🆕 são propostas novas: combinar com o Silvio.

### 6.1 Constantes do motor (`src/engine/constants.js`)
```js
// Simplified. Every spacecraft has a core bus: structure, computer, attitude control, thermal.
export const BUS = { massKg: 200, powerW: 60, costMUsd: 30 };
export const NEAR_MISS_MIN = 0.95;      // 95–100% of a limit = "tight but valid"
export const EVENT_SAFE_MARGIN = 0.15;  // margins below 15% get hurt by events
export const SCORE = { success: 1000, perScience: 20, budgetSaved: 300, nearMiss: 75, eventSurvived: 100, quiz: 200 };
export const DIFFICULTY_MULT = { easy: 1.0, medium: 1.3, hard: 1.6 };
```

### 6.2 `parts.js` (8 instrumentos, 3 energias, 3 antenas)
```js
// Simplified values, inspired by real missions. Not exact.
export const parts = [
  // --- instruments ---
  { id: 'wide-camera', name: 'Wide-Angle Camera', type: 'instrument', massKg: 15, powerW: 20, costMUsd: 8, dataGbPerDay: 10, scienceValue: 4 },
  { id: 'hd-camera', name: 'High-Resolution Camera', type: 'instrument', massKg: 50, powerW: 60, costMUsd: 20, dataGbPerDay: 40, scienceValue: 7 }, // inspired by LRO LROC
  { id: 'multispectral-imager', name: 'Multispectral Imager', type: 'instrument', massKg: 40, powerW: 50, costMUsd: 30, dataGbPerDay: 30, scienceValue: 8 }, // inspired by Landsat OLI
  { id: 'radar-sar', name: 'Imaging Radar (SAR)', type: 'instrument', massKg: 120, powerW: 300, costMUsd: 60, dataGbPerDay: 80, scienceValue: 9 },
  { id: 'spectrometer', name: 'Spectrometer', type: 'instrument', massKg: 25, powerW: 35, costMUsd: 25, dataGbPerDay: 5, scienceValue: 6 },
  { id: 'magnetometer', name: 'Magnetometer', type: 'instrument', massKg: 5, powerW: 5, costMUsd: 6, dataGbPerDay: 0.5, scienceValue: 3 },
  { id: 'laser-altimeter', name: 'Laser Altimeter', type: 'instrument', massKg: 20, powerW: 40, costMUsd: 18, dataGbPerDay: 2, scienceValue: 5 }, // inspired by LOLA
  { id: 'atmosphere-sounder', name: 'Atmosphere Sounder', type: 'instrument', massKg: 30, powerW: 40, costMUsd: 22, dataGbPerDay: 8, scienceValue: 6 }, // inspired by MAVEN
  // --- power ---
  { id: 'solar-panel-s', name: 'Small Solar Panels', type: 'power', massKg: 15, powerW: 0, powerGenW: 300, costMUsd: 5, dataGbPerDay: 0, scienceValue: 0 },
  { id: 'solar-panel-l', name: 'Large Solar Panels', type: 'power', massKg: 45, powerW: 0, powerGenW: 1000, costMUsd: 15, dataGbPerDay: 0, scienceValue: 0 },
  { id: 'rtg', name: 'Nuclear Battery (RTG)', type: 'power', massKg: 45, powerW: 0, powerGenW: 110, costMUsd: 70, dataGbPerDay: 0, scienceValue: 0, nuclear: true }, // 🆕 nuclear: ignores sunlight. Inspired by MMRTG
  // --- comms ---
  { id: 'low-gain-antenna', name: 'Low-Gain Antenna', type: 'comms', massKg: 3, powerW: 10, costMUsd: 2, dataGbPerDay: 0, downlinkGbPerDay: 5, scienceValue: 0 },
  { id: 'medium-gain-antenna', name: 'Medium-Gain Antenna', type: 'comms', massKg: 10, powerW: 30, costMUsd: 8, dataGbPerDay: 0, downlinkGbPerDay: 40, scienceValue: 0 },
  { id: 'high-gain-antenna', name: 'High-Gain Antenna', type: 'comms', massKg: 25, powerW: 40, costMUsd: 15, dataGbPerDay: 0, downlinkGbPerDay: 300, scienceValue: 0 },
];
```
Regra: `downlinkGbPerDay` é a capacidade **em órbita baixa da Terra**. O motor multiplica pelo `commsFactor` da órbita.

> Nota: o `Carlos.md` sugere de 8 a 10 instrumentos, 3 energias e 3 antenas; esta proposta fica no mínimo de propósito (menos é mais para o jogador).

### 6.3 `rockets.js`
```js
// Simplified values, inspired by real rockets. Not exact. TLI and TMI values are simplified.
export const rockets = [
  { id: 'small-lifter', name: 'Small Lifter', costMUsd: 10, payloadKg: { LEO: 300, GTO: 0, TLI: 0, TMI: 0 } },              // inspired by Electron
  { id: 'light-lifter', name: 'Light Lifter', costMUsd: 40, payloadKg: { LEO: 1500, GTO: 400, TLI: 250, TMI: 0 } },          // inspired by Vega
  { id: 'medium-lifter', name: 'Medium Lifter', costMUsd: 70, payloadKg: { LEO: 22800, GTO: 8300, TLI: 2500, TMI: 1500 } },  // inspired by Falcon 9
  { id: 'heavy-lifter', name: 'Heavy Lifter', costMUsd: 150, payloadKg: { LEO: 63800, GTO: 26700, TLI: 15000, TMI: 16800 } }, // inspired by Falcon Heavy
];
```

### 6.4 `orbits.js` (com campos 🆕 que o motor precisa)
```js
// Simplified values. Not exact.
// 🆕 sunFactor: sunlight vs Earth (1 = Earth). 🆕 commsFactor: downlink vs LEO.
// 🆕 propellantFactor: extra mass as fuel to reach/stay in orbit (fraction of dry mass).
// 🆕 lifetimeDays: how long the orbit lasts (drag). 🆕 scienceBonus: score multiplier for this vantage point.
export const orbits = [
  { id: 'leo-300', name: 'Low Earth Orbit (300 km)', target: 'LEO', altitudeKm: 300, transferDays: 0, lifetimeDays: 180, sunFactor: 1, commsFactor: 1, propellantFactor: 0.05, scienceBonus: 1.2 },
  { id: 'sso-700', name: 'Sun-Synchronous Orbit (700 km)', target: 'LEO', altitudeKm: 700, transferDays: 0, lifetimeDays: 3650, sunFactor: 1, commsFactor: 0.8, propellantFactor: 0.05, scienceBonus: 1.1 },
  { id: 'geo', name: 'Geostationary Orbit', target: 'GTO', altitudeKm: 35786, transferDays: 10, lifetimeDays: 5475, sunFactor: 1, commsFactor: 1, propellantFactor: 0.8, scienceBonus: 0.7 },
  { id: 'lunar-polar', name: 'Low Lunar Polar Orbit', target: 'TLI', altitudeKm: 100, transferDays: 5, lifetimeDays: 1000, sunFactor: 1, commsFactor: 0.1, propellantFactor: 0.35, scienceBonus: 1.2 },
  { id: 'lunar-elliptical', name: 'High Lunar Orbit', target: 'TLI', altitudeKm: 3000, transferDays: 5, lifetimeDays: 2000, sunFactor: 1, commsFactor: 0.1, propellantFactor: 0.25, scienceBonus: 0.8 },
  { id: 'mars-low', name: 'Low Mars Orbit', target: 'TMI', altitudeKm: 400, transferDays: 210, lifetimeDays: 3000, sunFactor: 0.43, commsFactor: 0.04, propellantFactor: 0.45, scienceBonus: 1.1 },
  { id: 'mars-high', name: 'High Mars Orbit', target: 'TMI', altitudeKm: 6000, transferDays: 210, lifetimeDays: 5000, sunFactor: 0.43, commsFactor: 0.04, propellantFactor: 0.3, scienceBonus: 0.8 },
];
```
`commsFactor` é um fator de jogo, **não** a lei do inverso do quadrado real (que tornaria Marte impraticável no jogo). O texto educativo explica a ideia ("signals get weaker with distance") sem prometer proporção exata.

### 6.5 `scenarios.js`
```js
// Simplified values. Not exact.
export const scenarios = [
  { id: 'earth-observation', name: 'Observe Earth', difficulty: 'easy', // 🆕 difficulty
    budgetMUsd: 200, maxDays: 400, operationDays: 365,
    allowedOrbits: ['leo-300', 'sso-700', 'geo'], requiredTypes: ['instrument', 'power', 'comms'], minScience: 12 },
  { id: 'moon-explorer', name: 'Explore the Moon', difficulty: 'medium',
    budgetMUsd: 240, maxDays: 400, operationDays: 365,
    allowedOrbits: ['lunar-polar', 'lunar-elliptical'], requiredTypes: ['instrument', 'power', 'comms'], minScience: 12 },
  { id: 'mars-study', name: 'Study Mars', difficulty: 'hard',
    budgetMUsd: 350, maxDays: 700, operationDays: 400,
    allowedOrbits: ['mars-low', 'mars-high'], requiredTypes: ['instrument', 'power', 'comms'], minScience: 11 },
];
```

### 6.6 Balanceamento verificado (força bruta, 13/11/2026)
Todas as combinações de subconjuntos de instrumentos × energia × antena × órbita permitida × foguete, com a regra da seção 7.2:

| Cenário | Combinações vencedoras | Taxa | Leitura |
|---|---|---|---|
| Observe Earth (easy) | 605 / 27.540 | 2,2% | Muitas saídas. Bom para a demo |
| Explore the Moon (medium) | 74 / 18.360 | 0,4% | Exige pensar em comunicação e combustível |
| Study Mars (hard) | 16 / 18.360 | 0,09% | Exige instrumentos de pouco dado e foguete médio ou pesado |

Exemplos de soluções:
- Terra: Multispectral + Spectrometer, painel S, antena HGA, SSO 700, Light Lifter → US$ 145M, 320 kg de 1.500 kg.
- Lua: Wide camera + Magnetometer + Laser altimeter, painel L, HGA, órbita lunar alta, Medium Lifter → US$ 162M.
- Marte: Magnetometer + Laser altimeter + Atmosphere sounder, painel L, HGA, órbita marciana alta, Heavy Lifter → US$ 256M.

Esse script vira o teste `tests/balance.test.js` (prompt 10.4), para ninguém quebrar o jogo mudando um número.

### 6.7 `content.js` (textos para o jogador, em inglês)
```js
export const content = {
  scenarios: {
    'earth-observation': {
      question: "How are Earth's forests, ice and cities changing?",
      fact: 'Landsat satellites have photographed every part of Earth since 1972.',
      realMission: { name: 'Landsat 9', text: 'Launched in 2021 into a 705 km sun-synchronous orbit to image all of Earth every 16 days.' },
      quiz: { q: 'Why do Earth-observing satellites often use a sun-synchronous orbit?',
        options: ['They pass over each place at the same local time, so the lighting is consistent', 'It is the only orbit rockets can reach', 'It is closer to the Sun'],
        answer: 0, why: 'Same lighting every pass makes it easy to compare images over the years.' },
    },
    // 'moon-explorer': realMission LRO, quiz about braking/propellant
    // 'mars-study': realMission MAVEN, quiz about weaker sunlight
  },
  learn: {
    objective: 'Scientists start with a question. Engineers then build the spacecraft that can answer it.',
    spacecraft: 'Every instrument adds science, but also mass, power, data and cost. Every gram must be launched and powered.',
    orbit: 'Lower orbits see more detail but feel more air drag. Farther destinations need more fuel and get less sunlight.',
    rocket: 'A rocket carries less the farther it has to go. Too small fails; too big wastes money.',
  },
  meters: { /* title, rule of thumb, explanation for each of the 5 meters */ },
  events: { /* text for each random event: safe and hurt variants */ },
};
```
Regra do `CLAUDE.md`: sempre que o texto em inglês for escrito, mandar ao Silvio um resumo em pt-BR.

### 6.8 Estado em memória (`src/state/store.js`)
```js
const initialState = {
  screen: 'menu',              // 'menu' | 'objective' | 'spacecraft' | 'launch' | 'simulation' | 'report'
  scenarioId: 'earth-observation',
  design: { partIds: [], orbitId: null, rocketId: null },
  confirmedSteps: [],          // for "Stage complete" banners and tab checkmarks
  runCount: 0,
  simulation: null,            // { seed, phases: [...], events: [...], outcome, failedKey }
  report: null,                // { success, score, breakdown, nearMisses, quizAnswered, quizRight }
  team: null,                  // P1: { players: [{ role, nick }], priorities: [...] }
  paused: false,
  ui: { modal: null, toast: null },
};
```
`evaluation` **não é guardado**: é sempre derivado com `evaluateDesign(state.design, data, scenario)`.

### 6.9 `localStorage`
| Chave | Valor | Quando |
|---|---|---|
| `space-mission-design-game:best-v1` | `{ "total": 2150, "byScenario": { "earth-observation": 2150 } }` | Ao fim de cada missão |
| `space-mission-design-game:prefs-v1` | `{ "reducedMotion": false, "seenHowTo": true }` | Ao mudar preferência |

Toda leitura e escrita em `try/catch`. Nunca guardar apelidos do modo equipe.

---

## 7. Contratos do motor (a "API" do jogo)

Tudo em `src/engine/`, sem DOM e sem Three.js, coberto por Vitest.

### 7.1 `sumResources(parts)` (já existe)
Soma `massKg`, `powerW`, `costMUsd` e `dataGbPerDay`. Manter como está.

### 7.2 `evaluateDesign(design, data, scenario) → evaluation`
**Entrada:** `design = { partIds, orbitId, rocketId }`, `data = { parts, rockets, orbits }`, `scenario`.

**Cálculo (ordem fixa):**
```
selected   = parts filtradas por partIds
orbit      = orbits[orbitId] (pode ser null)
dryKg      = BUS.massKg + Σ massKg
wetKg      = round(dryKg × (1 + orbit.propellantFactor))           // combustível automático
capKg      = rocket.payloadKg[orbit.target]                           // 0 = não chega
useW       = BUS.powerW + Σ powerW
genW       = Σ power parts: nuclear ? powerGenW : powerGenW × orbit.sunFactor
dataGb     = Σ dataGbPerDay
downGb     = Σ comms parts: downlinkGbPerDay × orbit.commsFactor
costM      = BUS.costMUsd + Σ costMUsd + rocket.costMUsd
missionDays= orbit.transferDays + scenario.operationDays
science    = Σ scienceValue
```

**Saída:**
```js
{
  ready: boolean,                    // has orbit, rocket, ≥1 power, ≥1 comms, ≥1 instrument
  missing: ['orbit', 'rocket', ...],
  totals: { dryKg, wetKg, propellantKg, useW, genW, dataGb, downGb, costM, missionDays, science },
  checks: {
    budget:  { used: costM, limit: budget, ratio, status },     // status: 'ok' | 'tight' | 'over' | 'pending'
    mass:    { used: wetKg, limit: capKg, ratio, status, reason },// reason: 'cannot-reach' quando capKg = 0
    power:   { used: useW, limit: genW, ratio, status },
    data:    { used: dataGb, limit: downGb, ratio, status },
    time:    { used: missionDays, limit: maxDays, ratio, status, orbitLifetimeOk },
    science: { used: science, limit: minScience, ratio, status },
  },
  allGo: boolean,
}
```
**Regras de status:** `ratio ≤ 0.95` → `ok`; `0.95 < ratio ≤ 1` → `tight`; `ratio > 1` → `over`. Ciência é invertida (`used ≥ limit` é ok). Tempo fica `over` também se `orbit.lifetimeDays < operationDays`.

**Erros:** IDs desconhecidos lançam `Error('Unknown part id: x')`, porque é bug de dados e deve aparecer nos testes.

### 7.3 `explainCheck(key, evaluation, scenario, data) → string`
Frase em inglês, com números, para o checklist, o toast e o relatório. Exemplo para `mass`/`over`:
`"Spacecraft + fuel = 594 kg, but the Light Lifter can only carry 400 kg to GTO. Pick a stronger rocket or a lighter design."`

### 7.4 `simulateMission(design, evaluation, scenario, seed) → simulation`
```js
{
  seed,
  phases: [
    { id: 'launch',     ok, failKey: 'budget' | 'mass' | null },
    { id: 'transfer',   ok, failKey: null },
    { id: 'operations', ok, failKey: 'power' | 'time' | null, events: [...] },
    { id: 'data',       ok, failKey: 'data' | 'science' | null, events: [...] },
  ],
  events: [{ id: 'solar-storm', hit: 'power', margin: 0.38, harmed: false, scienceLoss: 0 }],
  outcome: 'success' | 'failure',
  failedKey,           // primeiro check que falhou, na ordem budget → mass → power → time → data → science
  scienceDelivered,    // ciência depois das perdas por eventos
}
```
**Eventos** (sorteia 1 ou 2 com `mulberry32(seed)`):

| Evento | Recurso testado | Dano se a margem for < 15% |
|---|---|---|
| Solar storm | power | −20% de ciência entregue |
| Launch delay (+30 dias) | time | −15% de ciência (menos dias de operação) |
| Ground station outage | data | −15% de ciência |
| Instrument glitch | o instrumento sorteado | −metade do `scienceValue` dele |

Margem = `1 − ratio`. Eventos **nunca** transformam sucesso em falha sozinhos, a não ser que a ciência entregue caia abaixo de `minScience` (aí falha por `science`, com o evento citado no relatório). Isso ensina o valor da margem sem frustrar.

### 7.5 `scoreMission(evaluation, simulation, scenario, { quizRight }) → { total, breakdown }`
```
success:        +1000 (só se outcome = success)
science:        +20 × scienceDelivered × orbit.scienceBonus
budget saved:   +300 × max(0, (budget − cost) / budget)
efficient:      +75 por check 'tight' (exceto science)
events:         +100 por evento sobrevivido sem dano
quiz:           +200 se acertou
× DIFFICULTY_MULT[scenario.difficulty]
falha:          apenas science × 5 + quiz (para não zerar o aprendizado)
```

### 7.6 Testes obrigatórios (Vitest)
- `evaluate.test.js`: casos de borda (sem foguete, foguete com `payloadKg = 0`, RTG ignora `sunFactor`, `tight` em 0,96, `over` em 1,01, `leo-300` falha tempo).
- `simulate.test.js`: mesma semente gera os mesmos eventos; margem ≥ 15% não sofre dano; ordem de `failedKey`.
- `score.test.js`: breakdown soma o total; multiplicador por dificuldade.
- `balance.test.js`: para cada cenário, `≥ 10` combinações vencedoras e `≥ 2` órbitas ou foguetes diferentes entre as vencedoras (prova que não existe resposta única).

### 7.7 Contrato do `view3d` (somente leitura)
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
- [ ] Silvio aprova este PRD e os campos 🆕 da seção 6.
- [ ] Carlos faz o merge de `main` na `carlos/data` (passo 1 do `Carlos.md`).
- [ ] `npm install three` e confirmar `npm run dev`, `npm test` e `npm run build`.
- [ ] Criar as pastas da seção 5.5 vazias com `.gitkeep`.

### Fase 1: Jogo jogável em HTML (14/11, manhã e tarde, P0)
| Bloco | Dono sugerido | Stories |
|---|---|---|
| Dados (`parts`, `rockets`, `orbits`, `scenarios`) | Carlos | base da seção 6 |
| Motor: `evaluate`, `explainCheck`, testes | Silvio | US-004 a US-012 (regras) |
| Estado + menu + etapas 1 a 3 em HTML | Silvio | US-001 a US-006, US-009, US-010, US-012 |
| Simulação (sem 3D) + relatório | Silvio | US-013, US-014, US-016, US-019, US-020 |
| Textos (`content.js`): learn, explicações, missões reais, quiz | Carlos | US-008, US-017, US-018 |
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
- Modelos 3D importados (GLTF), som e música.
- Mais de 3 cenários, salvar e compartilhar designs por link.
- Tradução da UI para o português.

---

## 10. Prompts prontos para desenvolvimento

> Pensados para o **Claude Code** dentro do repositório (que já lê o `CLAUDE.md`). Cada prompt pede o plano antes de mexer em vários arquivos, como manda o acordo do time. Cole um por vez.

### 10.1 Prompt: Preparar a estrutura

```
Contexto: Space Mission Design Game (Tupi Orbit), NASA Space Apps 2026. Leia CLAUDE.md e
prd-space-mission-design-game.md (seções 5.5 e 6). Stack: Vite + JS puro + Vitest + Three.js como camada visual.

Tarefa:
1. Instalar `three` como dependência.
2. Criar as pastas de src/ da seção 5.5 (data, engine, state, ui/screens, ui/components, view3d, assets/textures) com .gitkeep onde estiver vazio.
3. Criar src/engine/constants.js com BUS, NEAR_MISS_MIN, EVENT_SAFE_MARGIN, SCORE e DIFFICULTY_MULT exatamente como na seção 6.1.
4. Atualizar src/style.css com os tokens de cor da seção 8.2 (manter a estrutura atual).

Antes de mexer, mostre o plano em pt-BR e espere aprovação.
Critérios de aceitação:
- npm run dev, npm test e npm run build passam.
- Nenhuma outra dependência adicionada.
- Comentários e código em inglês.
```

### 10.2 Prompt: Dados do jogo (para o Carlos ou com ele)

```
Contexto: siga Carlos.md (formato e regras) e a seção 6 do PRD.

Tarefa: criar src/data/parts.js, rockets.js, orbits.js e scenarios.js com os valores das seções 6.2 a 6.5.
Os campos marcados 🆕 (nuclear, sunFactor, commsFactor, propellantFactor, lifetimeDays, scienceBonus, difficulty)
só devem entrar se o Silvio já aprovou. Se não, pare e me avise.

Regras:
- Comentário "// simplified" e a missão ou foguete de referência quando houver.
- Nomes de campo exatamente como no PRD, com unidade no nome.
- Nada de textos para o jogador nesses arquivos (vão para content.js).

Critérios de aceitação:
- Arquivos exportam arrays com os nomes parts, rockets, orbits, scenarios.
- Teste simples em tests/data.test.js: ids únicos; todo allowedOrbits existe em orbits; todo target ∈ {LEO, GTO, TLI, TMI}; todo part tem type válido.
- npm test verde.
```

### 10.3 Prompt: Motor de avaliação

```
Contexto: PRD seção 7.2 e 7.3. Funções puras em src/engine/, sem DOM e sem Three.js.

Tarefa:
1. Criar src/engine/evaluate.js com evaluateDesign(design, data, scenario) seguindo exatamente o cálculo e o
   formato de saída da seção 7.2 (incluindo status 'ok' | 'tight' | 'over' | 'pending', reason 'cannot-reach'
   e a regra de lifetimeDays no check de tempo).
2. Criar src/engine/explain.js com explainCheck(key, evaluation, scenario, data) que devolve frases em
   inglês com números, no estilo do exemplo da seção 7.3. Uma frase para cada key × status.
3. Reutilizar sumResources de resources.js onde fizer sentido.

Critérios de aceitação (tests/evaluate.test.js):
- design vazio → ready=false e missing lista orbit, rocket, power, comms, instrument.
- RTG em mars-low gera 110 W; painel S em mars-low gera 129 W.
- light-lifter + geo + nave de 594 kg → mass 'over'.
- small-lifter + lunar-polar → mass 'over' com reason 'cannot-reach'.
- leo-300 no cenário earth-observation → time 'over' mesmo com missionDays ≤ maxDays.
- ratio 0,96 → 'tight'; 1,01 → 'over'.
- Mostre a saída de npm test ao terminar.
```

### 10.4 Prompt: Teste de balanceamento

```
Contexto: PRD seção 6.6 e 7.6. Quero um teste que impeça mudanças de dados de quebrar a jogabilidade.

Tarefa: criar tests/balance.test.js que, para cada cenário, testa todas as combinações de
(subconjunto não vazio de instrumentos) × (1 power) × (1 comms) × (órbitas permitidas) × (foguetes)
usando evaluateDesign, e conta as que têm allGo = true.

Critérios de aceitação:
- Cada cenário tem ≥ 10 combinações vencedoras.
- Entre as vencedoras de cada cenário há pelo menos 2 foguetes OU 2 órbitas diferentes.
- O teste imprime (console.info) a contagem por cenário. Com os dados do PRD, o esperado é cerca de 605 / 74 / 16.
- Roda em menos de 2 s.
```

### 10.5 Prompt: Estado e ações

```
Contexto: PRD seção 6.8 e 5.2 (fluxo UI → state → engine → state → view3d).

Tarefa: criar src/state/store.js (estado único, getState, subscribe(listener), dispatch(action)) e
src/state/actions.js com: selectScenario, startMission, confirmStep, goToStep, togglePart(partId),
setPower(partId) (troca a fonte de energia anterior), setComms(partId), setOrbit, setRocket, launch,
redesign, togglePause, answerQuiz.
- evaluation nunca é guardada no estado: exporte selectEvaluation(state) que chama evaluateDesign.
- Recorde: src/state/persistence.js com loadBest/saveBest usando a chave
  space-mission-design-game:best-v1, tudo em try/catch.

Critérios de aceitação:
- tests/state.test.js: togglePart duas vezes remove a peça; setPower substitui; redesign mantém o design
  e vai para a etapa ligada ao failedKey (mapa: budget→launch, mass→launch, power→spacecraft,
  time→launch, data→spacecraft, science→spacecraft).
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
4. Teclado: Enter = next, Backspace = back, 1–8 = escolher cartão, P/Esc = pause.
5. Responsivo: abaixo de 860 px, cartões viram gaveta inferior (máx. 44vh) e os medidores ficam em grade no topo.

Critérios de aceitação:
- Consigo jogar o fluxo 4.1 até o checklist sem 3D.
- Escolha que estoura um limite: medidor treme 160 ms e aparece toast com explainCheck.
- Todos os cartões são <button>, com foco visível. Sem erros no console.
- Teste manual em 375×812 e 1280×720 (descreva o que verificou).
```

### 10.7 Prompt: Simulação e relatório

```
Contexto: PRD seções 7.4, 7.5, 3 (Épicos 4 e 5) e 4.2.

Tarefa:
1. src/engine/random.js: mulberry32(seed) e hashDesign(design).
2. src/engine/simulate.js: simulateMission conforme 7.4 (4 fases, 1 ou 2 eventos, margem 15%,
   ordem de failedKey, ciência entregue).
3. src/engine/score.js: scoreMission conforme 7.5.
4. src/ui/screens/simulation.js: linha do tempo das 4 fases (~1,5 s cada), mensagem por fase,
   cartões de evento (verde se seguro, âmbar se houve dano), congela 300 ms na falha + pulso vermelho.
   Pausa congela o tempo.
5. src/ui/screens/report.js: título SUCCESS/FAILED, breakdown, o que funcionou/falhou com explainCheck,
   What to learn, Real mission like yours, quiz (uma resposta só, +200), recorde dourado,
   botões Redesign / Next mission / Main menu.

Critérios de aceitação:
- tests/simulate.test.js e tests/score.test.js conforme 7.6.
- Fluxo 4.2 (leo-300) falha em Operations com a frase de arrasto.
- Mesma missão relançada → mesmos eventos. "Try again with new conditions" → runCount+1.
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
vencedor (use uma combinação da seção 6.6); testar em 375×812; testar com WebGL desligado e em aba anônima.
Relatar em pt-BR, com honestidade, o que passou, o que falhou e o que não foi possível verificar.
Não corrigir nada sem me perguntar.
```

---

## 11. Riscos técnicos e trade-offs

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| 3D consome o dia 15 e o jogo não fecha | Alta | Alto | 3D só depois do marco do dia 14; time-box de 3 a 4 h; prompts 10.8 e 10.9 com "pare em 2 h" |
| Mudança de dados quebra o balanceamento | Média | Alto | `balance.test.js` no CI |
| Carlos e Silvio divergem no formato dos dados | Média | Médio | Campos 🆕 aprovados antes; `data.test.js` valida ids e targets |
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
| Foguete e órbita com checagem de compatibilidade | US-009, US-010, 7.2 (`cannot-reach`) |
| Recursos: massa, energia, orçamento, dados, comunicação, tempo | 5 medidores, 7.2 |
| Simulação e avaliação | US-013, US-014, 7.4, 7.5 |
| Explicar o porquê, não só certo ou errado | `explainCheck`, What to learn, US-016 |
| Não existe solução única | 6.6 e `balance.test.js` |
| Até 4 participantes com papéis | US-024 (P1) |
| Níveis de dificuldade e cenários | 3 cenários easy, medium, hard |
| Eventos aleatórios, relatório, visualização interativa | US-014, US-016, US-007, US-015 |
