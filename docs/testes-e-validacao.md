



Práticas Interdisciplinares · Entrega 4



# SIMSEP — Testes e Validação com Usuários



Histórias de usuário com critérios de aceitação · Plano e casos de teste · Execução, defeitos encontrados e correções · Avaliação heurística · Protocolo de validação com usuários  
Sistema de Monitoramento e Controle de Segurança em Pedreiras





**Data:** 16 de novembro de 2026

**Versão do sistema:** 1.2.0 (commits 3eb53af → f10573a)

**Aluno:** Gabriel Henrique Damaceno Alves

**Instituição:** Universidade Estadual de Goiás — UEG Trindade · Sistemas de Informação

**Repositório:** github.com/7121895128/simsep





## 1. Resumo

Esta entrega documenta **como o SIMSEP é testado** e **como é validado com usuários**. A parte de testes é inteiramente executada e evidenciada: as histórias de usuário ganharam critérios de aceitação no formato Dado/Quando/Então, cada critério virou caso de teste, e a execução dos testes de borda escritos nesta etapa **encontrou cinco defeitos reais** no código — todos registrados com a saída do executor, corrigidos e confirmados verdes. A parte de validação com usuários tem duas frentes: uma **avaliação heurística** (inspeção por especialista, já realizada, com 4 dos 10 achados corrigidos nesta mesma entrega) e um **protocolo de teste com usuários** completo — perfis, tarefas, métricas, questionário SUS, termo de consentimento e planilha de tabulação — pronto para ser aplicado.





**12**histórias com critérios de aceitação (41 cenários)





**60**testes automatizados (36 unitários + 24 de integração)





**5**defeitos encontrados por testes nesta entrega (9 testes falharam)





**10**achados da avaliação heurística (4 já corrigidos)





## 2. Estratégia de testes

| Nível                | O que testa                                                                                                                                                                                                                                                                       | Como                                              | Qtde        |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|-------------|
| **Unitário**         | Regras de negócio isoladas em `services/`: validação de medição, usuário e período; avaliação de limite; classificação de situação; CSV; montagem do boletim; **casos de borda** (datas inexistentes, injeção em CSV, coerção numérica, normalização de e-mail, divisão por zero) | `node:test`, sem banco · `npm test` · \< 0,3 s    | 36          |
| **Integração (API)** | Rotas + middleware + banco real, por HTTP: autenticação, autorização por perfil, CRUD, transação medição + alerta, histórico, CSV, relatório, boletim, público, e os cenários dos defeitos DEF-01 a DEF-04                                                                        | `node:test` + `fetch` · `npm run test:integracao` | 24          |
| **Banco de dados**   | Schema e migrações em banco limpo; `CHECK`/`FK`/`UNIQUE` rejeitando dados inválidos; consultas agregadas; migração de normalização de e-mail                                                                                                                                      | `psql` em PostgreSQL 16                           | 11          |
| **Aceitação**        | Cenários Dado/Quando/Então das histórias (seção 3), executados nas telas com os perfis operador, engenheiro, admin e público                                                                                                                                                      | Manual, roteiro + evidência                       | 41 cenários |
| **Segurança**        | XSS, CSV injection, token ausente/adulterado, escalação de perfil, exposição de dados no público, SQL parametrizado, `npm audit`                                                                                                                                                  | Automatizado (integração) + revisão               | 8           |
| **Usabilidade**      | Avaliação heurística (Nielsen) realizada; teste com usuários (tarefas, tempo, erros, SUS) protocolado                                                                                                                                                                             | Inspeção + sessões moderadas                      | 10 achados  |



**Definição de pronto (DoD):** critérios de aceitação da história verificados · `npm test` e `npm run test:integracao` verdes · `npm audit` sem vulnerabilidade alta · migração e documentação atualizadas · nenhum achado de severidade ≥ 3 aberto.



## 3. Histórias de usuário com critérios de aceitação

Formato: *Como \<perfil\>, quero \<ação\> para \<benefício\>*, com cenários **Dado / Quando / Então**. Cada cenário tem um identificador (`TA-xx`) e indica o teste automatizado que o cobre, quando houver.





US01 Login — *Como Administrador, quero entrar no sistema para acessar as funções do meu perfil com segurança.*







**TA-01** Dado um usuário cadastrado · Quando informo e-mail e senha corretos · Então recebo um token válido por 8 h e sou levado ao painel integração \#1 **TA-02** Dado um usuário cadastrado · Quando informo senha errada · Então vejo "Credenciais invalidas" e o sistema não revela se o e-mail existe integração \#1 **TA-03** Dado que digito o e-mail com maiúsculas ou espaços · Quando entro · Então o login funciona normalmente DEF-04 → integração \#6 **TA-04** Dado que minha sessão expirou · Quando tento usar o sistema · Então volto ao login com a mensagem "Sua sessão expirou" AH-01











US02 Pontos de monitoramento — *Como Operador, quero cadastrar pontos para organizar onde as medições são feitas.*







**TA-05** Dado que informo nome e localização · Quando salvo · Então o ponto aparece na lista e nos seletores de medição integração \#8 **TA-06** Dado um ponto já existente · Quando cadastro outro com o mesmo nome · Então vejo "já existe" (409) integração \#8 **TA-07** Dado um ponto com medições · Quando tento excluir · Então o sistema recusa e explica o motivo (409) integração \#20 **TA-08** Dado que clico em excluir · Quando o sistema pede confirmação · Então posso cancelar sem perder nada aceitação











US03 Detonações — *Como Operador, quero registrar detonações programadas para informar equipe e comunidade.*







**TA-09** Dado identificador, data/hora futura e ponto · Quando salvo · Então a detonação aparece no painel público em "próximas detonações" aceitação **TA-10** Dado um identificador já usado · Quando salvo · Então vejo 409 "ja existe" aceitação **TA-11** Dado data/hora inválida · Quando salvo · Então vejo 400 "Data/hora invalida" aceitação











US04 / US05 Medições — *Como Operador, quero registrar vibração, ruído e qualidade do ar para acompanhar a segurança.*







**TA-12** Dado um ponto e o tipo "vibração" · Quando informo 3,2 · Então a unidade "mm/s" é preenchida sozinha e a medição é salva como "normal" integração \#12 **TA-13** Dado valor negativo · Quando salvo · Então vejo 400 "Valor nao pode ser negativo" e nada é gravado unitário · integração \#10 **TA-14** Dado valor "true", "Infinity" ou acima de 99.999.999,99 · Quando salvo · Então vejo 400 "Valor deve ser numerico" DEF-03 **TA-15** Dado que sou Engenheiro · Quando tento registrar · Então recebo 403 e continuo logado integração \#9











US06 Alertas automáticos — *Como Operador, quero ser alertado quando um limite for ultrapassado para agir rápido.*







**TA-16** Dado limite de vibração 5 mm/s · Quando registro 7,4 · Então um alerta aberto é criado na mesma transação com "+48,0%" unitário (5) · integração \#11 **TA-17** Dado limite 5 · Quando registro exatamente 5,0 · Então nenhum alerta é criado unitário **TA-18** Dado um alerta aberto · Quando marco como resolvido · Então ficam gravados quem e quando, e o botão some integração \#21 **TA-19** Dado um alerta já resolvido · Quando tento resolver de novo · Então recebo 409 integração \#21 **TA-20** Dado limite cadastrado como 0 · Quando registro qualquer valor · Então a mensagem não mostra "Infinity%" DEF-05











US07 Boletins — *Como Operador, quero emitir boletins periódicos para informar a comunidade.*







**TA-21** Dado um período com medições · Quando pré-visualizo · Então vejo resumo, situação por ponto e detonações, sem gravar nada unitário (3) · integração \#23 **TA-22** Dado a prévia · Quando emito · Então o boletim aparece no painel público e abre em página imprimível integração \#23 **TA-23** Dado período sem início ou fim · Quando pré-visualizo · Então vejo 400 "Informe inicio e fim" integração \#23 **TA-24** Dado que sou Engenheiro · Quando tento emitir · Então recebo 403 integração \#23











US08 Painel público — *Como Morador, quero consultar a situação da pedreira sem precisar de login.*







**TA-25** Dado que não estou logado · Quando abro publico.html · Então vejo a última leitura de cada ponto com "normal"/"acima do limite", próximas detonações, alertas e boletins integração \#24 **TA-26** Dado qualquer resposta do painel público · Então ela não contém e-mails, nomes de usuários nem senhas integração \#24 **TA-27** Dado que abro no celular · Então a página se adapta à largura da tela AH-03











US09 Histórico — *Como Engenheiro de Minas, quero consultar o histórico por período para analisar tendências.*







**TA-28** Dado filtros de período, ponto e tipo · Quando filtro · Então vejo só as leituras correspondentes, com limite e situação integração \#14 **TA-29** Dado o filtro aplicado · Então vejo mín/média/máx e quantas ficaram acima do limite integração \#16 **TA-30** Dado data "30/02" ou início maior que fim · Quando filtro · Então vejo 400 com a mensagem do erro DEF-01 → integração \#17 **TA-31** Dado o filtro aplicado · Quando exporto · Então baixo um CSV que abre no Excel com acentos e colunas corretas integração \#18 **TA-32** Dado um ponto cujo nome começa com "=" · Quando exporto · Então a célula vem como texto, não como fórmula DEF-02 → integração \#19











US10 Relatórios gerenciais — *Como Administrador, quero indicadores consolidados para acompanhar a segurança.*







**TA-33** Dado que sou admin · Quando abro Relatórios · Então vejo totais, % de alertas resolvidos, tempo médio de resolução e tabelas por tipo, ponto e semana integração \#22 **TA-34** Dado que não sou admin · Quando acesso /api/relatorios · Então recebo 403 e o menu não mostra a opção integração \#5 **TA-35** Dado nenhum período informado · Então o relatório usa os últimos 30 dias e informa isso aceitação











US11 Usuários — *Como Administrador, quero cadastrar usuários para que ninguém crie contas sem autorização.*







**TA-36** Dado que já existe um usuário · Quando alguém tenta /registrar · Então recebe 403 integração \#4 **TA-37** Dado nome, e-mail, senha ≥ 6 e perfil · Quando cadastro · Então o usuário consegue entrar com o perfil certo integração \#5 **TA-38** Dado que sou o único admin · Quando tento me excluir · Então o sistema recusa aceitação **TA-39** Dado e-mail " ANA@Simsep.COM " · Quando cadastro · Então é salvo como "ana@simsep.com" DEF-04











TD01 Qualidade — *Como equipe, queremos testes automatizados para evitar regressões.*







**TA-40** Dado o repositório · Quando rodo `npm test` · Então 36 testes passam em menos de 1 s, sem banco **TA-41** Dado o servidor no ar · Quando rodo `npm run test:integracao` · Então 24 testes passam contra o banco real







## 4. Casos de teste automatizados

### 4.1 Unitários (`tests/unit/`) — 36 casos

| Arquivo                                           | Casos                                                                                                                                                                       | Regras cobertas                  |
|---------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|
| validacao.test.js                                 | 11 — medição válida; negativa; tipo/valor inválidos; zero; sem ponto; período nulo; intervalo fechado; só início; data inválida/invertida; usuário válido; usuário inválido | RN03, RN09, validação de usuário |
| alertas.test.js                                   | 9 — acima/igual/abaixo do limite; sem limite; strings do banco; classificação normal/atenção/acima/sem limite                                                               | RN01, RN02                       |
| csv-boletim.test.js                               | 5 — cabeçalho/BOM/separador; escape de ; " e quebra de linha; boletim vazio; dentro do limite; acima do limite                                                              | CSV, RN08                        |
| defeitos.test.js novo | 11 — 30/02 e 31/04; bissexto; fórmulas = + - @; negativos legítimos; booleano; Infinity/NaN; estouro NUMERIC; texto numérico; e-mail normalizado; limite zero               | DEF-01 a DEF-05                  |

### 4.2 Integração (`tests/integracao/api.test.js`) — 24 casos

| \#  | Caso                                                                            | \#  | Caso                                                                           |
|-----|---------------------------------------------------------------------------------|-----|--------------------------------------------------------------------------------|
| 1   | Login com senha errada → 401 sem revelar e-mail                                 | 13  | Medição dentro do limite não gera alerta                                       |
| 2   | Rota protegida sem token → 401                                                  | 14  | Histórico filtra por ponto e tipo com situação                                 |
| 3   | Token adulterado → 403                                                          | 15  | Filtro com data em formato errado → 400                                        |
| 4   | Registro público bloqueado após 1º usuário → 403                                | 16  | Estatísticas mín/média/máx por ponto e tipo                                    |
| 5   | Admin cria engenheiro; engenheiro não acessa usuários/relatórios                | 17  | DEF-01 data inexistente 30/02 → 400                |
| 6   | DEF-04 login aceita e-mail com maiúsculas e espaços | 18  | Exportação CSV responde text/csv com cabeçalho                                 |
| 7   | Rota /api inexistente → JSON 404                                                | 19  | DEF-02 CSV neutraliza ponto que começa com fórmula |
| 8   | Cadastra ponto e rejeita duplicado → 409                                        | 20  | Excluir ponto com medições → 409; inexistente → 404                            |
| 9   | Engenheiro não lança medição (403), mas consulta (200)                          | 21  | Resolver alerta grava resolvido_por; 2ª vez 409; inexistente 404               |
| 10  | Medição negativa e tipo inválido → 400                                          | 22  | Relatório gerencial consolida totais e % resolvidos                            |
| 11  | Medição acima do limite gera alerta na transação                                | 23  | Boletim: prévia exige período; engenheiro 403; emissão pública                 |
| 12  | DEF-03 valor booleano e Infinity → 400              | 24  | Painel público sem token e sem dados de usuários                               |

## 5. Execução: defeitos encontrados e corrigidos

No início desta entrega foram escritos 11 testes de **casos de borda** (arquivo `tests/unit/defeitos.test.js`) — entradas incomuns que as histórias não mencionavam explicitamente. **Nove deles falharam na primeira execução**, revelando cinco defeitos. Os testes foram commitados <u>falhando</u> (commit 3eb53af), depois o código foi corrigido (commit 6a31570). Saída real do executor antes da correção:

``` fail
$ npm test

    not ok 1 - rejeita 30 de fevereiro
    not ok 2 - rejeita 31 de abril
    not ok 3 - aceita 29 de fevereiro em ano bissexto e rejeita em ano comum
not ok 5 - DEF-01 montarPeriodo - datas inexistentes
    not ok 1 - neutraliza celulas que comecam com = + - @
not ok 6 - DEF-02 CSV - injecao de formula (Excel/LibreOffice)
    not ok 1 - rejeita booleano
    not ok 2 - rejeita Infinity e NaN textual
    not ok 3 - rejeita valor acima da capacidade da coluna NUMERIC(10,2)
not ok 7 - DEF-03 validarMedicao - valores nao numericos aceitos por coercao
    not ok 1 - aceita e-mail com espacos nas pontas e devolve normalizado em minusculas
not ok 8 - DEF-04 validarUsuario - normalizacao do e-mail
    not ok 1 - nao produz percentual infinito quando o limite e zero
not ok 9 - DEF-05 avaliarLimite - limite zero
# tests 36
# pass 27
# fail 9
```





DEF-01 Datas inexistentes eram aceitas no filtro de período severidade média





**Sintoma:** `GET /api/medicoes?inicio=2026-02-30` respondia 200 com dados de 2 de março, em vez de 400. Causa: `Date.parse('2026-02-30')` do JavaScript "corrige" a data em vez de rejeitá-la.

``` fail
not ok 1 - rejeita 30 de fevereiro
  location: 'tests/unit/defeitos.test.js:10:3'
  error: Expected values to be strictly equal:  true !== false
  expected: false   actual: true
```

**Correção** (`services/validacao.js`): a data é reconstruída com `Date.UTC(ano, mês−1, dia)` e comparada campo a campo com o texto informado; se divergir, é inválida. Cobre bissextos (29/02/2028 aceito, 29/02/2026 rejeitado).









DEF-02 Injeção de fórmula no CSV exportado severidade alta · segurança





**Sintoma:** um ponto chamado `=HYPERLINK("http://site-malicioso")` era exportado tal qual; ao abrir no Excel/LibreOffice a célula vira um link ativo (ataque conhecido como *CSV injection*). Como qualquer operador cadastra pontos, um operador mal-intencionado poderia atingir o engenheiro que exporta o histórico.

``` fail
not ok 1 - neutraliza celulas que comecam com = + - @
  location: 'tests/unit/defeitos.test.js:23:3'
  error: 'nao neutralizou: "=HYPERLINK(""http://x"")"'
```

**Correção** (`services/csv.js`): texto iniciado por `= + - @` recebe um apóstrofo (`'=HYPERLINK…`), que as planilhas exibem como texto literal. Números (inclusive negativos) não são alterados. Teste de integração \#19 confirma ponta a ponta.









DEF-03 Valores não numéricos aceitos por coerção severidade média





**Sintoma:** `{ valor: true }` virava 1 (`Number(true)`), `"Infinity"` passava na validação e só estourava no banco (erro 500 genérico), e 123.456.789,99 excedia `NUMERIC(10,2)`.

``` fail
not ok 1 - rejeita booleano          expected: false   actual: true
not ok 2 - rejeita Infinity e NaN textual
not ok 3 - rejeita valor acima da capacidade da coluna NUMERIC(10,2)
```

**Correção:** só é aceito número ou texto que case com `^-?\d+(\.\d+)?$`, finito e ≤ 99.999.999,99; mensagem 400 específica para o estouro. Teste de integração \#12.









DEF-04 E-mail não normalizado impedia login severidade alta · usuário bloqueado





**Sintoma:** o admin cadastrava `Ana@Simsep.com`; a usuária digitava `ana@simsep.com` e recebia "Credenciais invalidas", porque a comparação no banco é sensível a maiúsculas. Espaços colados do WhatsApp tinham o mesmo efeito.

``` fail
not ok 1 - aceita e-mail com espacos nas pontas e devolve normalizado em minusculas
  location: 'tests/unit/defeitos.test.js:52:3'
  error: Expected values to be strictly equal:  false !== true
```

**Correção:** função `normalizarEmail()` (trim + minúsculas) aplicada no cadastro (`/api/usuarios`, `/api/auth/registrar`) e no login. Para quem já estava cadastrado, `sql/migracao_entrega4.sql` normaliza os e-mails existentes (validado em banco local: `" Ana@X.COM "` → `ana@x.com`). Teste de integração \#6.









DEF-05 Mensagem de alerta com "+Infinity%" quando o limite é zero severidade baixa





**Sintoma:** divisão por zero no cálculo do percentual excedido. Só ocorre se um limite for cadastrado como 0, mas a mensagem vai para a comunidade no painel público.

**Correção:** o percentual só é incluído quando o limite é maior que zero.





Saída após as correções (versão 1.2.0):

``` pass
$ npm test
# tests 36
# suites 12
# pass 36
# fail 0
# duration_ms 264.66
```



**O que isso ensinou:** as 45 verificações anteriores cobriam os *caminhos descritos nas histórias*; os defeitos estavam nas *bordas* (datas impossíveis, entradas de tipo errado, conteúdo hostil, divisão por zero). Testes de borda e de segurança passam a fazer parte do DoD de toda história nova.



## 6. Validação com usuários — parte 1: avaliação heurística (realizada)

Antes de colocar usuários reais diante do sistema, foi feita uma **inspeção com as 10 heurísticas de Nielsen** sobre todas as 11 telas, com a escala de severidade de 0 (cosmético) a 4 (catastrófico). Isso remove problemas óbvios que só desperdiçariam o tempo dos participantes. Resultado: 10 achados; 4 corrigidos nesta entrega (commit f10573a), 6 priorizados no backlog.

| ID    | Heurística                                      | Achado                                                                                                                          | Sev. | Situação                                                                               |
|-------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|------|----------------------------------------------------------------------------------------|
| AH-01 | H1 Visibilidade do status · H9 Reconhecer erros | Ao expirar a sessão (8 h) o usuário era devolvido ao login **sem nenhuma mensagem**; parecia bug                                | 2    | Corrigido — "Sua sessão expirou. Entre novamente para continuar."                      |
| AH-02 | H1 Visibilidade do status                       | Tabelas e relatório não mostram indicador de carregamento; em rede lenta a tela parece vazia                                    | 1    | Backlog (US17)                                                                         |
| AH-03 | H7 Flexibilidade · acessibilidade               | 9 das 11 páginas não tinham `<meta viewport>`; no celular apareciam em escala minúscula                                         | 2    | Corrigido — viewport em todas as páginas (layout responsivo completo continua em US15) |
| AH-04 | Acessibilidade (WCAG 1.4.3)                     | Vermelho de alerta `#d9534f` sobre o painel escuro tinha contraste **4,14:1**, abaixo do mínimo 4,5:1 para texto                | 2    | Corrigido — `#e8665f`, contraste 5,07:1                                                |
| AH-05 | H9 Reconhecer, diagnosticar e recuperar erros   | Erros 500 mostram só "Erro ao listar medicoes", sem dizer o que fazer (tentar de novo, avisar suporte)                          | 1    | Backlog (US18)                                                                         |
| AH-06 | Acessibilidade (WCAG 4.1.3)                     | Mensagens de sucesso/erro não eram anunciadas por leitores de tela                                                              | 2    | Corrigido — `role="status" aria-live="polite"` em todas as mensagens                   |
| AH-07 | H5 Prevenção de erros                           | Exclusão de ponto e de usuário pede confirmação **(positivo)**; mas resolver alerta não pede e não pode ser desfeito            | 1    | Backlog — confirmação ou "desfazer" (US19)                                             |
| AH-08 | H3 Controle e liberdade                         | Login sem "mostrar senha" e sem recuperação de senha                                                                            | 1    | Backlog (US16)                                                                         |
| AH-09 | H4 Consistência e padrões                       | Unidade de qualidade do ar aparece como `ug/m3` na API/CSV e `µg/m³` na tela                                                    | 1    | Backlog                                                                                |
| AH-10 | H7 Flexibilidade e eficiência                   | Histórico limitado a 1.000 linhas sem paginação; o aviso existe, mas o engenheiro não consegue ver o resto sem refinar o filtro | 1    | Backlog (US20 — paginação)                                                             |

Pontos positivos registrados: unidade preenchida automaticamente; feedback imediato (verde/vermelho) após registrar medição; confirmação antes de excluir; painel público sem jargão; mensagens de erro da API em português.

## 7. Validação com usuários — parte 2: protocolo do teste com usuários

Teste de usabilidade **moderado, presencial ou por chamada de vídeo**, com pensamento em voz alta. Mínimo de 5 participantes (Nielsen: 5 usuários encontram ~85 % dos problemas), um por perfil, podendo repetir perfil.

### 7.1 Participantes

| Perfil do sistema     | Quem representa | Critério de recrutamento                                                                          |
|-----------------------|-----------------|---------------------------------------------------------------------------------------------------|
| Operador de Segurança | P1, P2          | Pessoa que trabalha com rotina operacional e planilhas; não precisa conhecer mineração            |
| Engenheiro de Minas   | P3              | Estudante ou profissional de engenharia/exatas, habituado a analisar dados                        |
| Administrador         | P4              | Pessoa com perfil de gestão ou TI                                                                 |
| Morador / comunidade  | P5              | Pessoa **sem** familiaridade com sistemas; testa só o painel público, de preferência pelo celular |

### 7.2 Tarefas, métricas e critérios

| \#  | Perfil     | Tarefa (lida em voz alta ao participante)                                                                  | Tempo ref. | Sucesso se…                                          |
|-----|------------|------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------|
| T1  | Operador   | "Entre no sistema e encontre o ponto chamado Frente Norte."                                                | 60 s       | Chega à lista de pontos e aponta o item              |
| T2  | Operador   | "Registre uma medição de vibração de 7,4 na Frente Norte e me diga se isso gerou algum alerta."            | 90 s       | Medição salva e participante afirma que houve alerta |
| T3  | Operador   | "Marque esse alerta como resolvido."                                                                       | 45 s       | Status muda para resolvido                           |
| T4  | Engenheiro | "Veja o histórico de vibração da Frente Norte na última semana e salve em um arquivo para abrir no Excel." | 120 s      | Filtro correto aplicado e CSV baixado                |
| T5  | Operador   | "Publique o boletim da última semana para a comunidade."                                                   | 120 s      | Boletim emitido e visível no painel público          |
| T6  | Admin      | "Descubra quantos alertas foram resolvidos este mês."                                                      | 90 s       | Lê o número correto no relatório                     |
| T7  | Morador    | "Sem fazer login, descubra se algum ponto está acima do limite e abra o último boletim."                   | 90 s       | Identifica o ponto e abre o boletim                  |

| Métrica                        | Como medir                                                                 | Meta                                      |
|--------------------------------|----------------------------------------------------------------------------|-------------------------------------------|
| **Eficácia** — taxa de sucesso | 1 = sem ajuda · 0,5 = com uma dica · 0 = não concluiu / desistiu           | ≥ 80 % por tarefa                         |
| **Eficiência** — tempo         | Cronômetro do início da leitura da tarefa ao "pronto"                      | ≤ 1,5 × tempo de referência               |
| **Erros**                      | Cliques em lugar errado, mensagens de erro recebidas, caminhos abandonados | ≤ 1 por tarefa em média                   |
| **Satisfação** — SUS           | Questionário de 10 itens ao final (7.4)                                    | ≥ 68 (média de mercado); meta 75          |
| **Achados qualitativos**       | Falas do pensamento em voz alta, hesitações, sugestões                     | Registrar todos; priorizar por severidade |

### 7.3 Roteiro da sessão (≈ 20 min por participante)

1.  **Abertura (2 min):** explicar que o que está sendo testado é o sistema, não a pessoa; pedir para falar o que pensa em voz alta; coletar o termo de consentimento (7.5).
2.  **Perfil (1 min):** idade, familiaridade com sistemas web (1–5), se já viu o SIMSEP.
3.  **Tarefas (12 min):** ler uma tarefa por vez; não ajudar antes de 60 s de travamento; anotar tempo, sucesso, erros e falas na planilha.
4.  **SUS (3 min):** participante responde sozinho.
5.  **Fechamento (2 min):** "O que mais te incomodou?" "O que mudaria primeiro?" "Usaria isso no dia a dia?"

**Ambiente:** servidor local com os dados de exemplo (`sql/seed_exemplo.sql`), três contas prontas (operador, engenheiro, admin) e o painel público aberto em um celular. Entre participantes, resetar o banco.

### 7.4 Questionário SUS (System Usability Scale) — versão em português

Responda de 1 (discordo totalmente) a 5 (concordo totalmente). Pontuação: itens ímpares (resposta − 1), itens pares (5 − resposta); soma × 2,5 → 0 a 100. A planilha anexa calcula automaticamente.

| \#  | Afirmação                                                                       | 1   | 2   | 3   | 4   | 5   |
|-----|---------------------------------------------------------------------------------|-----|-----|-----|-----|-----|
| 1   | Eu acho que gostaria de usar este sistema com frequência                        | ☐   | ☐   | ☐   | ☐   | ☐   |
| 2   | Eu achei o sistema desnecessariamente complexo                                  | ☐   | ☐   | ☐   | ☐   | ☐   |
| 3   | Eu achei o sistema fácil de usar                                                | ☐   | ☐   | ☐   | ☐   | ☐   |
| 4   | Eu acho que precisaria do apoio de um técnico para conseguir usar este sistema  | ☐   | ☐   | ☐   | ☐   | ☐   |
| 5   | Eu achei que as várias funções do sistema estavam bem integradas                | ☐   | ☐   | ☐   | ☐   | ☐   |
| 6   | Eu achei que havia muita inconsistência neste sistema                           | ☐   | ☐   | ☐   | ☐   | ☐   |
| 7   | Eu imagino que a maioria das pessoas aprenderia a usar este sistema rapidamente | ☐   | ☐   | ☐   | ☐   | ☐   |
| 8   | Eu achei o sistema muito complicado de usar                                     | ☐   | ☐   | ☐   | ☐   | ☐   |
| 9   | Eu me senti muito confiante usando o sistema                                    | ☐   | ☐   | ☐   | ☐   | ☐   |
| 10  | Eu precisei aprender muitas coisas antes de conseguir usar o sistema            | ☐   | ☐   | ☐   | ☐   | ☐   |

Interpretação (Bangor, Kortum & Miller, 2009): \< 51 inaceitável · 51–68 marginal · 68 média · 68–80 bom · \> 80 excelente.

### 7.5 Termo de consentimento (resumo para assinatura)



Eu, , aceito participar voluntariamente do teste de usabilidade do sistema SIMSEP, projeto acadêmico da disciplina de Práticas Interdisciplinares (UEG Trindade). Entendo que: (1) o objetivo é avaliar o sistema, não o meu desempenho; (2) serão anotados tempos, ações e comentários, sem gravação de áudio/vídeo salvo autorização expressa; (3) meus dados pessoais não serão divulgados — os resultados usam apenas o código P1–P5; (4) posso interromper a qualquer momento sem justificativa.

Autorizo gravação de tela: ☐ sim ☐ não     Data: \_\_\_\_/\_\_\_\_/\_\_\_\_\_\_     Assinatura: 



### 7.6 Ficha de observação (uma por participante)

| Tarefa | Tempo (s) | Sucesso (1 / 0,5 / 0) | Erros | Falas e observações |
|--------|-----------|-----------------------|-------|---------------------|
| T1     |           |                       |       |                     |
| T2     |           |                       |       |                     |
| T3     |           |                       |       |                     |
| T4     |           |                       |       |                     |
| T5     |           |                       |       |                     |
| T6     |           |                       |       |                     |
| T7     |           |                       |       |                     |

A planilha `SIMSEP_Validacao_Usuarios_Planilha.xlsx` (abas Participantes, Tarefas, SUS, Achados) consolida as fichas e calcula taxa de sucesso, tempo médio, erros e SUS automaticamente.

### 7.7 Situação e próximos passos



**Status em 16/11/2026:** avaliação heurística concluída e 4 correções aplicadas; protocolo, instrumentos e planilha prontos. As sessões com os 5 participantes **ainda não foram realizadas** — serão aplicadas na próxima semana e os resultados (taxas, tempos, SUS e achados) serão anexados a este documento na seção 8. Nenhum resultado de usuário foi inventado para esta entrega.



| Quando          | O quê                                                                                                    | Saída                                       |
|-----------------|----------------------------------------------------------------------------------------------------------|---------------------------------------------|
| Semana de 17/11 | Recrutar P1–P5 e agendar 5 sessões de 20 min                                                             | Agenda                                      |
| Semana de 17/11 | Aplicar as sessões, preencher a planilha                                                                 | Planilha com dados; fichas assinadas        |
| Até 24/11       | Analisar: SUS médio, tarefas com sucesso \< 80 %, achados por severidade; converter achados em histórias | Seção 8 deste documento; backlog atualizado |
| Sprint seguinte | Corrigir achados de severidade ≥ 2; reaplicar as tarefas afetadas com 2 participantes                    | Comparação antes/depois                     |

## 8. Resultados do teste com usuários

*Seção reservada — será preenchida após as sessões com: tabela de sucesso/tempo/erros por tarefa, SUS por participante e médio, lista de achados priorizados e histórias derivadas.*

## 9. Rastreabilidade

| História         | Cenários | Unitários                              | Integração         | Defeitos relacionados | Achados heurísticos |
|------------------|----------|----------------------------------------|--------------------|-----------------------|---------------------|
| US01 Login       | TA-01–04 | —                                      | \#1, \#2, \#3, \#6 | DEF-04                | AH-01, AH-08        |
| US02 Pontos      | TA-05–08 | —                                      | \#8, \#20          | —                     | AH-07 (+)           |
| US03 Detonações  | TA-09–11 | —                                      | via \#14, \#23     | —                     | —                   |
| US04/05 Medições | TA-12–15 | validacao (5) · defeitos (5)           | \#9, \#10, \#12    | DEF-03                | AH-09               |
| US06 Alertas     | TA-16–20 | alertas (9) · defeitos (1)             | \#11, \#13, \#21   | DEF-05                | AH-04, AH-07        |
| US07 Boletins    | TA-21–24 | csv-boletim (3)                        | \#23               | —                     | —                   |
| US08 Público     | TA-25–27 | —                                      | \#24               | —                     | AH-03               |
| US09 Histórico   | TA-28–32 | validacao (4) · csv (2) · defeitos (5) | \#14–#19           | DEF-01, DEF-02        | AH-02, AH-10        |
| US10 Relatórios  | TA-33–35 | —                                      | \#5, \#22          | —                     | AH-02, AH-05        |
| US11 Usuários    | TA-36–39 | validacao (2) · defeitos (1)           | \#4, \#5           | DEF-04                | —                   |
| TD01 Qualidade   | TA-40–41 | 36                                     | 24                 | —                     | —                   |

## 10. Anexos e como reproduzir

    git clone https://github.com/7121895128/simsep && cd simsep && npm install
    psql -d simsep -f sql/schema.sql            # ou migracao_sprint1.sql + migracao_entrega4.sql em banco existente
    npm test                                     # 36 unitários
    npm start                                    # em outro terminal:
    API_URL=http://localhost:3000 npm run test:integracao   # 24 de integração

    git show 3eb53af   # commit com os testes falhando
    git show 6a31570   # commit com as correções DEF-01..05
    git show f10573a   # commit com as correções da avaliação heurística

Arquivos desta entrega no repositório: `tests/unit/defeitos.test.js`, `tests/integracao/api.test.js`, `sql/migracao_entrega4.sql`, `docs/testes-e-validacao.pdf`, `docs/validacao-usuarios-planilha.xlsx`, `sql/seed_exemplo.sql`.
