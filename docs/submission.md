# Rascunho da página de submissão (Space Apps 2026)

Rascunho em **português**, como recomendou a organização local: escrever e revisar em português, traduzir para o inglês só no fim e colar na plataforma **já em inglês** (a tradução automática da plataforma tem dado erro).

**Datas (horário local de São José do Rio Preto):**
- Sábado 14/11, até 11h30: entregável 1, equipe cadastrada na plataforma e desafio escolhido.
- Domingo 15/11, 9h: palestra de pitch.
- Domingo 15/11, **até 17h**: preencher tudo e clicar em **Submit for Judging**. Antes disso, só **Save Progress**. Ligue o **Lock** enquanto editar, para ninguém sobrescrever.

**O júri local** avalia impacto, criatividade, validade, relevância e apresentação. Não há perguntas nem feedback: só conta o que estiver na plataforma.

Marcações neste arquivo:
- **[CONFIRMAR]**: depende de algo que ainda não está pronto. Revisar no domingo de manhã e só afirmar o que o jogo de fato faz.
- Os 3 cenários, o checklist GO/NO-GO, os eventos, o relatório, o quiz e o visualizador 3D da nave foram conferidos no jogo publicado em 14/11.

---

## Project Name

Space Mission Design Game

## High-Level Summary

*Na plataforma: o que vocês desenvolveram, como responde ao desafio e por que é importante.*

O Space Mission Design Game é um jogo gratuito de navegador em que estudantes projetam uma missão espacial completa em 5 etapas: escolher o objetivo científico, montar a nave e os instrumentos, escolher a órbita e o foguete, simular a missão e ler o relatório final.

Cada escolha mexe em seis recursos ao mesmo tempo: massa, energia, orçamento, dados, comunicação e tempo. Uma câmera melhor traz mais ciência, mas também deixa a nave mais pesada, gasta mais energia, gera mais dados e custa mais. Se a missão falha, o jogo explica o motivo em linguagem simples, com os números ("sua nave está 10 kg acima do que o foguete leva") e uma dica de como corrigir.

Isso é importante porque estudantes quase nunca conseguem experimentar uma missão inteira: eles aprendem órbitas, foguetes e instrumentos em aulas separadas e não veem como uma decisão afeta a outra. O jogo transforma essas trocas em algo que se aprende jogando e errando, e mostra que não existe uma única resposta certa.

## Project Demo

*Na plataforma: UM link público, vídeo de 30 segundos OU apresentação de 7 slides.*

- Link: **[CONFIRMAR: link do vídeo de 30 s no YouTube ou Drive, com legendas em inglês]**
- Roteiro: `docs/demo-script.md`
- Testar o link numa janela anônima antes de enviar.

## Final Project

*Na plataforma: os complementos.*

- Jogo online: https://avoddigital.github.io/space-mission-design-game/ (abrir de novo numa janela anônima antes de enviar)
- Código-fonte: https://github.com/avoddigital/space-mission-design-game

## Project Details

*Na plataforma: o que faz, como funciona, benefícios, impacto esperado e ferramentas usadas.*

**O que faz.** O jogador escolhe uma de 3 missões, cada uma com uma pergunta científica, orçamento, prazo e meta de ciência:
- Observar a Terra (fácil)
- Explorar a Lua (média)
- Estudar Marte (difícil)

Depois monta a nave com instrumentos, painel solar e antena, escolhe a órbita e o foguete e lança.

**Como funciona.**
- Um motor de regras calcula os seis recursos a cada escolha. Ele confere se a nave cabe no foguete para aquela órbita e se a energia, o orçamento, os dados e o tempo fecham.
- Antes do lançamento, um checklist GO/NO-GO mostra o que ainda está errado, com os números ("Your spacecraft is 10 kg too heavy"). O jogador pode lançar mesmo assim, porque falhar também ensina.
- Na simulação, eventos aleatórios (tempestade solar, atraso no lançamento, queda de estação terrestre, tempestade de poeira em Marte...) só prejudicam quem deixou pouca margem. Isso ensina por que engenheiros guardam folga. A mesma nave sempre recebe os mesmos eventos, para o jogador comparar mudanças de forma justa.
- Uma visualização 3D mostra a nave mudando a cada peça escolhida, e depois o lançamento, a viagem e a órbita. Sem WebGL, o jogo mostra uma versão 2D e continua jogável. **[CONFIRMAR: testar com o WebGL desligado]**
- O relatório dá uma nota de 0 a 100, explica o que funcionou e o que falhou e mostra missões reais da NASA parecidas com a do jogador, como Landsat 9, LRO, LCROSS, MRO, 2001 Mars Odyssey e MAVEN.
- Uma caixa "Learn" em cada etapa e um quiz no final reforçam um conceito por vez.

**Benefícios.**
- É gratuito e roda no navegador, sem instalação nem login, em notebook ou celular.
- Os textos foram escritos para estudantes do ensino médio.
- Os números são simplificados, mas inspirados em instrumentos e foguetes reais. O jogo deixa claro que são simplificados.

**Impacto esperado.** Ser uma atividade de 20 a 40 minutos que professores possam usar em sala, em que os alunos discutem trocas reais de engenharia ("por que vocês escolheram esse foguete?").

**Ferramentas.**
- JavaScript puro (ES modules), HTML e CSS, com build pelo Vite.
- Testes automáticos com Vitest. Eles garantem que as regras funcionam e que cada missão continua com várias soluções vencedoras.
- Three.js para a visualização 3D, carregado só quando é usado, para o jogo abrir rápido em computadores fracos e celulares.
- Hospedagem no GitHub Pages. O código é aberto no GitHub.

## Use of AI

*Na plataforma: onde, como e quais IAs foram usadas. Conteúdo gerado não pode usar nem alterar marcas da NASA (logo, bandeira, identificadores de missão).*

Usamos o **Claude (Anthropic), pelo Claude Code**, como assistente durante o desenvolvimento:
- **Dados do jogo:** rascunho das tabelas de peças, foguetes, órbitas e cenários. Os valores foram revisados pela equipe e marcados como simplificados.
- **Textos do jogo:** rascunho das mensagens, caixas "Learn", descrições, eventos e quiz em inglês.
- **Checagem de fatos:** busca dos fatos sobre missões reais nas páginas oficiais da NASA. Cada missão tem o link da fonte.
- **Documentação:** PRD, README, roteiro do pitch e do vídeo.
- **[CONFIRMAR com o Silvio: como a IA foi usada no motor de regras, nas telas e nos testes]**

Nenhum logo, bandeira ou elemento de marca da NASA foi gerado ou modificado por IA.

## Space Agency Data

*Na plataforma: quais dados da NASA ou de agências parceiras foram usados, como foram usados e como inspiraram o projeto. **Obrigatório usar pelo menos um item da aba "Resources" do desafio.***

- **Design and Develop Science Missions (NASA).** Base da estrutura do jogo. O documento divide uma missão em quatro segmentos, e cada um virou uma parte do jogo:
  - *launch segment*: etapa de escolha do foguete e da órbita;
  - *space segment*: montagem da nave e dos instrumentos;
  - *ground segment*: antenas, limite de dados enviados à Terra e o evento de queda de estação terrestre;
  - *user segment*: a pergunta científica de cada missão e o relatório final.

  O documento também mostra a missão saindo de uma necessidade científica e passando por requisitos e projeto. Por isso o jogo começa pela pergunta científica antes de qualquer peça.
- **Mission Design Lab (NASA Goddard).** O MDL compara arquiteturas de missão em *trade studies*, olhando órbita, nave, comunicações, foguete, energia, custo e risco ao mesmo tempo. O jogo é um *trade study* simplificado: o jogador compara combinações e vê o efeito em todos os recursos.
- **A Learning Game About Telescopes (NASA, missão Webb).** Inspirou a ligação entre objetivo científico e escolhas de engenharia, e a ideia de mostrar no final missões reais da NASA parecidas com o projeto do jogador.
- **Páginas oficiais das missões da NASA** (science.nasa.gov). Fonte dos fatos reais mostrados no jogo e da inspiração dos instrumentos e valores simplificados:
  - Landsat 8 e 9;
  - Lunar Reconnaissance Orbiter (LRO) e LCROSS;
  - Mars Reconnaissance Orbiter (MRO), 2001 Mars Odyssey e MAVEN.
- **Imagens da NASA (domínio público)** usadas como textura dos planetas no 3D:
  - Terra: Blue Marble, NASA Goddard Scientific Visualization Studio;
  - Lua: CGI Moon Kit, feito com dados da LRO, NASA Scientific Visualization Studio;
  - Marte: mosaico colorido global da Viking, NASA/JPL/USGS.

## References

**NASA (aba Resources do desafio):**
- Design and Develop Science Missions: https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf
- Mission Design Lab: https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
- A Learning Game About Telescopes: https://science.nasa.gov/mission/webb/game-build-it-yourself/

**Páginas de missões da NASA:**
- https://science.nasa.gov/mission/landsat-9/
- https://science.nasa.gov/mission/landsat-8/
- https://science.nasa.gov/mission/lro/
- https://science.nasa.gov/mission/lcross/
- https://science.nasa.gov/mission/mars-reconnaissance-orbiter/
- https://science.nasa.gov/mission/odyssey/
- https://science.nasa.gov/mission/maven/

**Texturas dos planetas (domínio público):**
- Terra, Blue Marble: https://svs.gsfc.nasa.gov/3615/
- Lua, CGI Moon Kit: https://svs.gsfc.nasa.gov/4720/
- Marte, mosaico da Viking: https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m

**Outros fatos citados no jogo:**
- Luz do Sol em Marte (cerca de 43% da Terra): NASA TM-2001-210935, https://ntrs.nasa.gov/api/citations/20010046858/downloads/20010046858.pdf
- Conjunção solar de Marte: https://www.jpl.nasa.gov/news/whats-mars-solar-conjunction-and-why-does-it-matter/
- LRO durante eclipses lunares: https://science.nasa.gov/moon/eclipses/
- Tempestades de poeira em Marte: https://svs.gsfc.nasa.gov/30983

**Foguetes que inspiraram os valores simplificados:** Rocket Lab Electron, SpaceX Falcon 9, SpaceX Falcon Heavy e NASA SLS Block 1.

**Ferramentas e código aberto:**
- Vite: https://vite.dev
- Vitest: https://vitest.dev
- Three.js: https://threejs.org
- Claude Code (Anthropic): assistente de IA, ver "Use of AI".
