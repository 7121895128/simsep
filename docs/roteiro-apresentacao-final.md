# SIMSEP — Texto da apresentação (22 slides, ≈ 15 min)

---

**Slide 1 — Capa**

Bom dia / boa noite. Eu sou o Gabriel e vou apresentar o SIMSEP, o Sistema de Monitoramento e Controle de Segurança em Pedreiras, que desenvolvi na disciplina de Práticas Interdisciplinares. Vou passar pelo problema, pelo planejamento, pelo sistema funcionando, por como ele é construído por dentro e por como foi testado.


> **Siglas deste slide:** **SIMSEP** = Sistema de Monitoramento e Controle de Segurança em Pedreiras · **UEG** = Universidade Estadual de Goiás

---

**Slide 2 — O problema**

Uma pedreira detona rocha perto de bairros. A vibração, o ruído e a poeira têm limites definidos em norma, mas na prática as medições ficam em planilha ou papel, o alerta depende de alguém olhar o número, e o morador só descobre que teve detonação quando a casa treme.

Isso cria três problemas. Para a pedreira, uma leitura acima do limite demora a virar ação e não existe histórico fácil de analisar. Para a comunidade, não existe nenhum canal para saber se está tudo dentro do limite. E para a gestão, não existem indicadores: quantos alertas, quanto tempo para resolver, quais pontos preocupam.

---

**Slide 3 — A solução**

O SIMSEP é um sistema web com quatro perfis. O operador de segurança cadastra pontos e detonações, lança medições, recebe e resolve alertas e emite boletins. O engenheiro de minas consulta o histórico, vê estatísticas e exporta para o Excel. O administrador tem o relatório gerencial, edita os limites de segurança e gerencia usuários. E o morador acessa um painel público, sem login, pelo celular.

A regra central do sistema é esta: toda medição acima do limite gera um alerta automaticamente, na mesma transação do banco. Nunca existe uma leitura crítica sem alerta.


> **Siglas deste slide:** **CSV** = *Comma-Separated Values*, arquivo de texto com colunas separadas, que o Excel abre

---

**Slide 4 — Product Backlog**

Antes de mostrar o sistema, como ele foi planejado. O Product Backlog tem 21 histórias de usuário, escritas no formato "como tal perfil, quero tal coisa". Cada uma tem prioridade e pontos de esforço. Hoje, 20 estão concluídas. A única pendente é a notificação de alerta por e-mail, que depende de um servidor de e-mail.


> **Siglas deste slide:** **US** = *User Story*, história de usuário (US01, US02…) · **TD** = *Technical Debt* / tarefa técnica, item do backlog que não é funcionalidade (ex.: TD01 testes) · **Pts** = pontos de história, estimativa de esforço (sequência 1, 2, 3, 5, 8) · **Product Backlog** = lista de tudo que o produto precisa, priorizada

---

**Slide 5 — Histórias com critérios de aceitação**

Cada história tem critérios de aceitação no formato "dado, quando, então". Por exemplo, a história de alertas: dado que o limite é 5, quando eu registro 7,4, então um alerta é criado com "+48%". Cada critério recebe um número, TA, e aponta para o teste automatizado que comprova que ele funciona. Ou seja: a história diz o que o usuário quer, e o critério diz como eu provo que está pronto.


> **Siglas deste slide:** **US** = *User Story*, história de usuário · **TA** = Teste de Aceitação, cada critério "dado/quando/então" numerado · **DEF** = defeito encontrado pelos testes (DEF-01 a DEF-05) · **"integração #11"** = número do teste automatizado de integração que comprova o critério

---

**Slide 6 — Casos de uso**

Este é o diagrama de casos de uso. Os quatro atores à esquerda e à direita, e os treze casos de uso do sistema. O "registrar medição" inclui o "gerar alerta automático", porque um nunca acontece sem o outro. O administrador herda tudo que o operador pode fazer. Os casos em verde foram os que entraram na Sprint 1.


> **Siglas deste slide:** **UC** = *Use Case*, caso de uso (UC01…UC13) · **UML** = *Unified Modeling Language*, notação padrão dos diagramas · **«include»** = um caso de uso sempre inclui o outro · **«extend»** = um caso de uso pode estender o outro, opcionalmente

---

**Slide 7 — Sprint Goal e Sprint Backlog**

O trabalho foi organizado em sprints. A Sprint 1, de 19 a 25 de outubro, tinha a meta de entregar histórico, relatório e boletim sobre uma base corrigida e com testes. Foram 10 tarefas, 28 pontos planejados e 28 concluídos. A Sprint 2, de 10 a 16 de novembro, teve a meta de validar com usuários, corrigir o que eles encontrassem e fechar as regras de negócio do domínio. Na retrospectiva ficou a lição de testar as bordas e colocar usuário real cedo.


> **Siglas deste slide:** **Sprint** = ciclo curto de trabalho do Scrum (1 a 2 semanas) · **Sprint Goal** = meta da sprint, em uma frase · **Sprint Backlog** = tarefas escolhidas para a sprint · **T01…T18** = tarefas técnicas · **Retro** = retrospectiva, reunião de fim de sprint sobre o que melhorar

---

**Slide 8 — Números**

O projeto em números: 13 telas, 32 endpoints na API, 8 tabelas no banco, 18 regras de negócio, 87 testes automatizados, 6 defeitos reais encontrados pelos testes e corrigidos, 5 usuários que testaram, e 25 commits no GitHub.


> **Siglas deste slide:** **Endpoint** = cada rota da API (ex.: `/api/medicoes`) · **REST** = estilo de API sobre HTTP com GET, POST, PUT, DELETE · **SUS** = *System Usability Scale*, questionário de usabilidade com nota de 0 a 100 · **Commit** = cada versão salva no Git

---

**Slide 9 — Funcionalidades × requisitos funcionais**

Aqui cada requisito funcional com onde ele está implementado: a tela e a rota da API. São 14 requisitos, do login ao gráfico, e os 14 estão implementados. Dois foram adicionados na última versão: edição de limites com histórico e os gráficos.


> **Siglas deste slide:** **RF** = Requisito Funcional, o que o sistema faz (RF01…RF14) · **JWT** = *JSON Web Token*, o token de login · **GET/POST/PUT/DELETE** = verbos HTTP: consultar, criar, alterar, excluir · **SVG** = *Scalable Vector Graphics*, formato de imagem vetorial usado nos gráficos

---

**Slide 10 — Requisitos não funcionais**

E os requisitos não funcionais, com como cada um foi atendido e como eu verifico. Senha só com hash. Toda rota interna exige token. Proteção contra XSS. O painel público não expõe dado pessoal. Integridade garantida no banco. Toda resposta em JSON. E dois que vieram do teste com usuários: funcionar no celular e acessibilidade básica, com contraste e leitor de tela.


> **Siglas deste slide:** **RNF** = Requisito Não Funcional, como o sistema deve ser (segurança, desempenho…) · **bcrypt** = algoritmo de hash de senha · **Hash** = versão embaralhada e irreversível da senha · **401 / 403** = códigos HTTP: não autenticado / sem permissão · **XSS** = *Cross-Site Scripting*, ataque de injeção de script na página · **PK / FK** = *Primary Key* / *Foreign Key*, chave primária / estrangeira · **UNIQUE / CHECK** = restrições do banco: valor único / condição obrigatória · **JSON** = formato de dados das respostas da API · **aria-live** = atributo de acessibilidade que faz o leitor de tela anunciar mensagens

---

**Slide 11 — Entrada e painel**

Agora o sistema. A tela de login, com o botão de mostrar senha. O primeiro acesso cria o administrador; depois disso só o administrador cadastra usuários. E o painel inicial, com os totais, os alertas em aberto, e destacados em vermelho os alertas atrasados — abertos há mais de 48 horas — e os críticos.


> **Siglas deste slide:** **JWT** = token de login, válido por 8 horas · **Admin** = administrador

---

**Slide 12 — Medições e histórico**

A tela de medições. O operador lança o valor; a unidade já vem preenchida pelo tipo. Se passar do limite, aparece em vermelho na hora. Embaixo, o histórico com filtro por período, ponto e tipo, os cartões de mínimo, média e máximo, e o gráfico com a linha do limite — os pontos vermelhos são os que passaram. Dá para exportar em CSV que abre direto no Excel.

À direita, a tela de alertas: cada um tem nível alto ou crítico, mostra se está atrasado e quem resolveu. Um alerta crítico, acima de 150% do limite, só pode ser resolvido com uma observação da providência tomada.


> **Siglas deste slide:** **mm/s** = milímetros por segundo (vibração) · **dB** = decibéis (ruído) · **µg/m³** = microgramas por metro cúbico (poeira / qualidade do ar) · **CSV** = arquivo de colunas que o Excel abre · **mín / média / máx** = mínimo, média e máximo do período

---

**Slide 13 — Relatório e limites**

Para o administrador, o relatório gerencial: medições, detonações, alertas, percentual resolvido, tempo médio de resolução, e gráficos por semana e por ponto. Dá para imprimir. E a tela de limites de segurança, onde o administrador altera o limite de cada tipo, com histórico de quem mudou, quando, de quanto para quanto e por quê. Alertas já gerados não mudam.


> **Siglas deste slide:** **%** resolvidos = percentual de alertas resolvidos · **PDF** = formato de impressão

---

**Slide 14 — Boletim e painel público**

E a parte de transparência. O operador emite um boletim semanal, gerado automaticamente a partir das medições e detonações do período. Ele fica público e imprimível, e é um retrato: depois de publicado não muda. À direita, o painel público no celular, sem login, e o boletim no celular, onde as tabelas viram cartões. Isso foi uma correção que veio direto do teste com usuários, que eu mostro daqui a pouco.


> **Siglas deste slide:** **JSONB** = coluna do PostgreSQL que guarda o boletim como retrato imutável

---

**Slide 15 — Arquitetura**

Como é feito por dentro. Três camadas. O navegador, em HTML, CSS e JavaScript puro, sem framework; toda chamada passa por uma função que envia o token e trata os erros. A API em Node e Express, com 32 rotas; cada rota passa por autenticação e por verificação de perfil, e as regras de negócio ficam separadas em módulos de serviço, que são funções puras. E o PostgreSQL com 8 tabelas e as restrições de integridade.

O princípio é: toda regra crítica vale em mais de uma camada. A tela orienta, a API valida e o banco garante. Então a regra continua valendo mesmo se alguém chamar a API direto, sem passar pela tela.


> **Siglas deste slide:** **HTML / CSS / JavaScript** = linguagens da página web · **API** = *Application Programming Interface*, o servidor que atende a tela · **Node.js** = JavaScript no servidor · **Express** = biblioteca que cria as rotas da API · **JWT** = token de login · **PostgreSQL** = banco de dados · **SQL** = linguagem de consulta ao banco · **CHECK / FK / UNIQUE** = restrições de integridade do banco · **400 / 403 / 409** = códigos HTTP: dado inválido / sem permissão / conflito

---

**Slide 16 — Diagrama de classes**

O diagrama de classes do domínio. As entidades: usuário, ponto, limite, detonação, medição, alerta, boletim e o histórico de limites, com seus atributos e métodos — nos métodos está marcada a regra de negócio que cada um implementa. À direita, os quatro módulos de serviço com as funções de regra, que as entidades usam.


> **Siglas deste slide:** **«service»** = módulo de serviço (arquivos em `services/`) com as regras · **RN** = Regra de Negócio (RN01…RN18) · **int / string / decimal / datetime / bool** = tipos de dado: inteiro, texto, número decimal, data-hora, verdadeiro/falso · **[0..1]** = relação opcional (zero ou um)

---

**Slide 17 — Modelo de dados**

E o modelo de dados no PostgreSQL, com chaves primárias, estrangeiras e as restrições. O que está em verde foi adicionado nas últimas versões.


> **Siglas deste slide:** **DER** = Diagrama Entidade-Relacionamento · **PK / FK** = chave primária / estrangeira · **SERIAL** = inteiro com numeração automática · **VARCHAR / NUMERIC / TIMESTAMP / JSONB** = tipos de coluna: texto, número decimal, data-hora, JSON · **1 — N** = um para muitos

---

**Slide 18 — Regras de negócio**

São 18 regras de negócio implementadas. Não vou ler todas; destaco três. A RN02: valor maior que o limite gera exatamente um alerta, na mesma transação. A RN14: alerta acima de 150% é crítico e só é resolvido com observação. E a RN15: detonação só pode ser programada em dia útil, entre 8 e 17 horas, com pelo menos 24 horas de antecedência, para dar tempo de avisar a comunidade. A coluna da direita mostra em quais camadas cada regra é garantida.


> **Siglas deste slide:** **RN** = Regra de Negócio · **Web · API · BD** = camadas onde a regra é garantida: tela, servidor, banco de dados · **JSONB** = retrato imutável do boletim

---

**Slide 19 — Testes automatizados**

Testes. São 87 automatizados: 55 unitários, que testam cada regra isoladamente sem banco e rodam em menos de um segundo, e 32 de integração, que sobem o sistema inteiro com o PostgreSQL e chamam a API como o navegador faria.

A parte mais importante está à direita. Eu escrevi 11 testes com entradas estranhas, que ninguém digitaria de propósito: data 30 de fevereiro, um ponto chamado com uma fórmula do Excel, o valor "true" em vez de número. Nove falharam. Cada falha era um bug real que eu não tinha visto usando a tela. Por exemplo, o filtro aceitava 30 de fevereiro porque o JavaScript corrige a data em vez de recusar. E o CSV exportado abria uma fórmula no Excel, que é um ataque conhecido. Corrigi todos, e deixei no GitHub o commit com os testes falhando e o commit com a correção, para dar para ver o antes e o depois.


> **Siglas deste slide:** **Unitário** = testa uma função isolada, sem banco · **Integração** = testa o sistema inteiro pela API, com o banco real · **node:test** = executor de testes nativo do Node.js · **HTTP** = protocolo de comunicação da web · **CSV injection** = ataque em que uma célula começando com "=" vira fórmula no Excel · **schema.sql** = arquivo que cria as tabelas do banco · **3eb53af / 6a31570** = códigos dos commits no GitHub (antes e depois da correção)

---

**Slide 20 — Como um teste funciona**

Para ficar concreto, dois exemplos reais. O unitário chama a função que decide se passou do limite, com 7,4 e limite 5, e confere que a resposta é "ultrapassou, mais 48%". E confere também que 5,0 exatos não gera alerta, porque a regra é "maior que", não "maior ou igual".

O de integração faz login, manda uma medição de 6,8 pela API e confere que voltou o código 201 com o alerta junto na resposta. E confere que o engenheiro, que só consulta, recebe 403 se tentar lançar.

Se alguém mudar o código e quebrar uma regra, o teste fica vermelho antes de chegar ao usuário.


> **Siglas deste slide:** **test / assert** = comandos do teste: "teste" e "confira que" · **201 / 403** = códigos HTTP: criado com sucesso / sem permissão · **token** = credencial de login enviada na chamada · **npm test** = comando que roda os testes unitários · **npm run test:integracao** = comando que roda os testes de integração

---

**Slide 21 — Validação com usuários**

O sistema foi testado com cinco pessoas da pedreira: dois operadores, o engenheiro, o gerente e uma moradora do bairro. Sete tarefas cada um, sem ajuda. 26 das 30 tentativas foram concluídas sem ajuda, e a nota de satisfação SUS ficou em 73,5, que é faixa "bom".

O que deu certo: o alerta automático foi entendido na hora, a unidade preenchida sozinha evitou erro, e o painel público foi entendido sem explicação.

O que deu errado: a moradora não achou o boletim no celular, porque a tabela não cabia na tela. Resolver alerta não pedia confirmação. Não aparecia "carregando". O campo não aceitava vírgula. Faltavam gráficos. E faltava o botão de mostrar senha. Os seis viraram correções, e todas estão no sistema que vocês viram.


> **Siglas deste slide:** **SUS** = *System Usability Scale*, questionário de 10 perguntas que dá nota de 0 a 100; 68 é a média de referência, 73,5 é "bom" · **26/30** = tentativas concluídas sem ajuda, de 5 pessoas × 6 tarefas em média

---

**Slide 22 — Evolução por entregas**

Para fechar, a linha do tempo. Sprints 1 a 4 até setembro, com a base do sistema. A nova Sprint 1 em outubro, com histórico, relatório, boletim e os primeiros testes. Os artefatos de engenharia. A entrega de integração e testes em novembro, com os defeitos encontrados e o teste com usuários. E a versão atual, com as regras de domínio e 87 testes verdes. Tudo está no GitHub, com documento, código e commits de cada entrega.

Agora vou mostrar o sistema funcionando ao vivo.


> **Siglas deste slide:** **Scrum** = método ágil de organização do trabalho em sprints · **DER** = Diagrama Entidade-Relacionamento · **RF / RNF / RN** = requisitos funcionais, não funcionais e regras de negócio · **v1.4.0** = número da versão do sistema · **GitHub** = site onde o código e o histórico de commits ficam publicados

---

## Demonstração ao vivo (3 min)

1. **Medições:** lançar vibração `7,4` com vírgula na Frente Norte → mensagem vermelha "Alerta gerado (+48%)".
2. Lançar `9` → alerta **crítico**. Em **Alertas**, clicar "Marcar como resolvido" → pede observação. Cancelar.
3. Filtrar histórico da última semana → gráfico com a linha do limite. Clicar **Exportar CSV**.
4. **Detonações:** tentar cadastrar para hoje às 20h → bloqueado pela regra.
5. **Celular:** painel público com os cartões, abrir o boletim.
6. **PowerShell:** `npm test` → `# pass 55`.

"É isso. Obrigado."


---

## Glossário geral (para consulta rápida)

| Sigla | Significado |
|---|---|
| SIMSEP | Sistema de Monitoramento e Controle de Segurança em Pedreiras |
| US | *User Story* — história de usuário |
| TA | Teste de Aceitação — critério "dado/quando/então" |
| TD | Tarefa técnica do backlog (*technical debt*) |
| UC | *Use Case* — caso de uso |
| RF / RNF | Requisito Funcional / Não Funcional |
| RN | Regra de Negócio |
| DEF | Defeito encontrado por teste |
| AH | Achado da avaliação heurística (usabilidade) |
| DER | Diagrama Entidade-Relacionamento |
| UML | *Unified Modeling Language* — notação dos diagramas |
| API / REST | Servidor que atende a tela / estilo de API sobre HTTP |
| HTTP 200, 201, 400, 401, 403, 404, 409, 500 | OK · criado · dado inválido · não autenticado · sem permissão · não existe · conflito · erro interno |
| JWT | *JSON Web Token* — token de login |
| JSON / JSONB | Formato de dados da API / coluna do PostgreSQL que guarda JSON |
| SQL | Linguagem do banco de dados |
| PK / FK / UNIQUE / CHECK | Chave primária / estrangeira / valor único / condição obrigatória |
| bcrypt / hash | Algoritmo e resultado do embaralhamento irreversível da senha |
| XSS | *Cross-Site Scripting* — injeção de script na página |
| CSV / CSV injection | Arquivo de colunas para Excel / ataque com fórmula numa célula |
| SVG | Imagem vetorial (gráficos) |
| SUS | *System Usability Scale* — nota de usabilidade 0–100 |
| Scrum / Sprint / Backlog / Retro | Método ágil / ciclo de trabalho / lista de itens / retrospectiva |
| npm / Node.js / Express / PostgreSQL | Gerenciador de pacotes / JavaScript no servidor / biblioteca de rotas / banco de dados |
| Commit / GitHub | Versão salva no Git / site onde o repositório está |
| mm/s · dB · µg/m³ | Unidades de vibração, ruído e qualidade do ar |
