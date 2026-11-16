



Práticas Interdisciplinares · Entrega 3



# SIMSEP — Integração e Regras de Negócio



Integração entre as camadas do sistema (interface web · API REST · banco de dados) e regras de negócio implementadas  
Sistema de Monitoramento e Controle de Segurança em Pedreiras





**Data:** 16 de novembro de 2026

**Versão do sistema:** 1.1.0 (branch main, commit 645e6e9)

**Aluno:** Gabriel Henrique Damaceno Alves

**Instituição:** Universidade Estadual de Goiás — UEG Trindade · Sistemas de Informação

**Repositório:** github.com/7121895128/simsep





## 1. Objetivo e resumo

Este documento descreve **como as partes do SIMSEP se integram** — a interface web no navegador, a API REST em Node.js/Express e o banco PostgreSQL — e **quais regras de negócio estão implementadas**, em que camada cada uma é garantida e qual teste comprova que ela funciona. Tudo o que está aqui é extraído do código em produção no repositório; os trechos citados são reais.





**3**camadas integradas (web · API · banco)





**27**endpoints REST em 10 módulos





**12**regras de negócio implementadas





**45**testes (25 unitários + 20 de integração)







**Princípio adotado:** toda regra crítica é aplicada em <u>mais de uma camada</u>. A interface orienta o usuário (ex.: campo `min=0`), a API valida e devolve erro claro (HTTP 400/403/409), e o banco é a última linha de defesa (`CHECK`, `FK`, `UNIQUE`, transações). Assim, uma regra continua valendo mesmo se alguém chamar a API diretamente, sem passar pela tela.



## 2. Arquitetura de integração



![](data:image/svg+xml;base64,PHN2ZyB2aWV3Ym94PSIwIDAgMTAwMCAzMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZm9udC1mYW1pbHk9IklCTSBQbGV4IFNhbnMsIEFyaWFsIiBmb250LXNpemU9IjEyIj4KICA8ZGVmcz48bWFya2VyIGlkPSJhciIgbWFya2Vyd2lkdGg9IjEwIiBtYXJrZXJoZWlnaHQ9IjgiIHJlZng9IjkiIHJlZnk9IjQiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTTAsMCBMMTAsNCBMMCw4IiBmaWxsPSIjNWM2NjcyIj48L3BhdGg+PC9tYXJrZXI+PC9kZWZzPgogIDwhLS0gQnJvd3NlciAtLT4KICA8cmVjdCB4PSIyMCIgeT0iNDAiIHdpZHRoPSIyNzAiIGhlaWdodD0iMjUwIiByeD0iMTAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzFmNWZhOCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvcmVjdD4KICA8dGV4dCB4PSIxNTUiIHk9IjY0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMWY1ZmE4Ij5DQU1BREEgV0VCIChuYXZlZ2Fkb3IpPC90ZXh0PgogIDxyZWN0IHg9IjQwIiB5PSI4MCIgd2lkdGg9IjIzMCIgaGVpZ2h0PSI1MiIgcng9IjYiIGZpbGw9IiNmMWYzZjUiIHN0cm9rZT0iI2Q1ZGFlMCI+PC9yZWN0PgogIDx0ZXh0IHg9IjE1NSIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNjAwIj5Qw6FnaW5hcyBIVE1MICsgQ1NTPC90ZXh0PgogIDx0ZXh0IHg9IjE1NSIgeT0iMTE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNWM2NjcyIiBmb250LXNpemU9IjEwLjUiPmluZGV4IMK3IGRhc2hib2FyZCDCtyBtZWRpY29lcyDCtyByZWxhdG9yaW9zIMK3IGJvbGV0aW5zIMK3IHB1YmxpY28g4oCmPC90ZXh0PgogIDxyZWN0IHg9IjQwIiB5PSIxNDIiIHdpZHRoPSIyMzAiIGhlaWdodD0iNTIiIHJ4PSI2IiBmaWxsPSIjZjFmM2Y1IiBzdHJva2U9IiNkNWRhZTAiPjwvcmVjdD4KICA8dGV4dCB4PSIxNTUiIHk9IjE2MiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9IjYwMCI+bWVudS5qcyDigJQgYXBpRmV0Y2goKTwvdGV4dD4KICA8dGV4dCB4PSIxNTUiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzVjNjY3MiIgZm9udC1zaXplPSIxMC41Ij5pbmpldGEgQmVhcmVyIEpXVCDCtyB0cmF0YSA0MDEvNDAzIMK3IGVzYygpIGFudGktWFNTPC90ZXh0PgogIDxyZWN0IHg9IjQwIiB5PSIyMDQiIHdpZHRoPSIyMzAiIGhlaWdodD0iNTIiIHJ4PSI2IiBmaWxsPSIjZjFmM2Y1IiBzdHJva2U9IiNkNWRhZTAiPjwvcmVjdD4KICA8dGV4dCB4PSIxNTUiIHk9IjIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9IjYwMCI+bG9jYWxTdG9yYWdlPC90ZXh0PgogIDx0ZXh0IHg9IjE1NSIgeT0iMjQyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNWM2NjcyIiBmb250LXNpemU9IjEwLjUiPnRva2VuIMK3IG5vbWUgwrcgcGVyZmlsIChzZXNzw6NvIGRlIDggaCk8L3RleHQ+CiAgPHRleHQgeD0iMTU1IiB5PSIyNzgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM1YzY2NzIiIGZvbnQtc2l6ZT0iMTAuNSI+c2VydmlkbyBwb3IgZXhwcmVzcy5zdGF0aWMoJiMzOTtwdWJsaWMmIzM5Oyk8L3RleHQ+CiAgPCEtLSBBUEkgLS0+CiAgPHJlY3QgeD0iMzYwIiB5PSI0MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyNTAiIHJ4PSIxMCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjYjg3NDFmIiBzdHJva2Utd2lkdGg9IjEuNSI+PC9yZWN0PgogIDx0ZXh0IHg9IjUxMCIgeT0iNjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiNiODc0MWYiPkNBTUFEQSBBUEkgKE5vZGUuanMgKyBFeHByZXNzKTwvdGV4dD4KICA8cmVjdCB4PSIzODAiIHk9IjgwIiB3aWR0aD0iMjYwIiBoZWlnaHQ9IjQwIiByeD0iNiIgZmlsbD0iI2YxZjNmNSIgc3Ryb2tlPSIjZDVkYWUwIj48L3JlY3Q+CiAgPHRleHQgeD0iNTEwIiB5PSI5OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9IjYwMCI+c2VydmVyLmpzPC90ZXh0PgogIDx0ZXh0IHg9IjUxMCIgeT0iMTEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNWM2NjcyIiBmb250LXNpemU9IjEwLjUiPmNvcnMgwrcgZXhwcmVzcy5qc29uIMK3IG1vbnRhZ2VtIGRhcyByb3RhcyAvYXBpLyo8L3RleHQ+CiAgPHJlY3QgeD0iMzgwIiB5PSIxMjgiIHdpZHRoPSIyNjAiIGhlaWdodD0iNDAiIHJ4PSI2IiBmaWxsPSIjZmRmMWUwIiBzdHJva2U9IiNlOGM0OGEiPjwvcmVjdD4KICA8dGV4dCB4PSI1MTAiIHk9IjE0NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9IjYwMCI+bWlkZGxld2FyZS9hdXRoLmpzPC90ZXh0PgogIDx0ZXh0IHg9IjUxMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNWM2NjcyIiBmb250LXNpemU9IjEwLjUiPmF1dGVudGljYXIgKEpXVCkgwrcgYXV0b3JpemFyIChwZXJmaWwpPC90ZXh0PgogIDxyZWN0IHg9IjM4MCIgeT0iMTc2IiB3aWR0aD0iMTI1IiBoZWlnaHQ9IjUyIiByeD0iNiIgZmlsbD0iI2YxZjNmNSIgc3Ryb2tlPSIjZDVkYWUwIj48L3JlY3Q+CiAgPHRleHQgeD0iNDQyIiB5PSIxOTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSI2MDAiPnJvdXRlcy88L3RleHQ+CiAgPHRleHQgeD0iNDQyIiB5PSIyMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM1YzY2NzIiIGZvbnQtc2l6ZT0iMTAiPjEwIG3Ds2R1bG9zIMK3IFNRTDwvdGV4dD4KICA8cmVjdCB4PSI1MTUiIHk9IjE3NiIgd2lkdGg9IjEyNSIgaGVpZ2h0PSI1MiIgcng9IjYiIGZpbGw9IiNlM2YzZWEiIHN0cm9rZT0iIzllZDNiNCI+PC9yZWN0PgogIDx0ZXh0IHg9IjU3NyIgeT0iMTk2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNjAwIj5zZXJ2aWNlcy88L3RleHQ+CiAgPHRleHQgeD0iNTc3IiB5PSIyMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM1YzY2NzIiIGZvbnQtc2l6ZT0iMTAiPnJlZ3JhcyBwdXJhczwvdGV4dD4KICA8cmVjdCB4PSIzODAiIHk9IjIzNiIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI0MCIgcng9IjYiIGZpbGw9IiNmMWYzZjUiIHN0cm9rZT0iI2Q1ZGFlMCI+PC9yZWN0PgogIDx0ZXh0IHg9IjUxMCIgeT0iMjU0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNjAwIj5kYi5qcyDigJQgUG9vbCAocGcpPC90ZXh0PgogIDx0ZXh0IHg9IjUxMCIgeT0iMjY4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNWM2NjcyIiBmb250LXNpemU9IjEwLjUiPmNvbmV4w7VlcyByZXV0aWxpemFkYXMgwrcgdHJhbnNhw6fDtWVzIEJFR0lOL0NPTU1JVDwvdGV4dD4KICA8IS0tIERCIC0tPgogIDxyZWN0IHg9IjczMCIgeT0iNDAiIHdpZHRoPSIyNTAiIGhlaWdodD0iMjUwIiByeD0iMTAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzJlN2Q0ZiIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvcmVjdD4KICA8dGV4dCB4PSI4NTUiIHk9IjY0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMmU3ZDRmIj5DQU1BREEgREUgREFET1MgKFBvc3RncmVTUUwpPC90ZXh0PgogIDxnIGZvbnQtc2l6ZT0iMTEiPgogICAgPHJlY3QgeD0iNzUwIiB5PSI4MCIgd2lkdGg9IjIxMCIgaGVpZ2h0PSIxNTAiIHJ4PSI2IiBmaWxsPSIjZjFmM2Y1IiBzdHJva2U9IiNkNWRhZTAiPjwvcmVjdD4KICAgIDx0ZXh0IHg9Ijg1NSIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNjAwIj43IHRhYmVsYXM8L3RleHQ+CiAgICA8dGV4dCB4PSI3NjAiIHk9IjEyMCI+dXN1YXJpb3MgwrcgcG9udG9zX21vbml0b3JhbWVudG88L3RleHQ+CiAgICA8dGV4dCB4PSI3NjAiIHk9IjEzOCI+bGltaXRlc19zZWd1cmFuY2EgwrcgZGV0b25hY29lczwvdGV4dD4KICAgIDx0ZXh0IHg9Ijc2MCIgeT0iMTU2Ij5tZWRpY29lcyDCtyBhbGVydGFzIMK3IGJvbGV0aW5zPC90ZXh0PgogICAgPHRleHQgeD0iNzYwIiB5PSIxODQiIGZpbGw9IiMyZTdkNGYiIGZvbnQtd2VpZ2h0PSI2MDAiPlBLIMK3IEZLIMK3IFVOSVFVRSDCtyBDSEVDSzwvdGV4dD4KICAgIDx0ZXh0IHg9Ijc2MCIgeT0iMjAyIiBmaWxsPSIjNWM2NjcyIj7DrW5kaWNlcyBwb3IgZGF0YSwgcG9udG8gZSB0aXBvPC90ZXh0PgogICAgPHRleHQgeD0iNzYwIiB5PSIyMjAiIGZpbGw9IiM1YzY2NzIiPnNjaGVtYS5zcWwgwrcgbWlncmFjYW9fc3ByaW50MS5zcWw8L3RleHQ+CiAgPC9nPgogIDx0ZXh0IHg9Ijg1NSIgeT0iMjYyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNWM2NjcyIiBmb250LXNpemU9IjEwLjUiPmNyZWRlbmNpYWlzIHZpYSAuZW52IChEQl9IT1NULCBEQl9VU0VS4oCmKTwvdGV4dD4KICA8IS0tIGFycm93cyAtLT4KICA8bGluZSB4MT0iMjkwIiB5MT0iMTUwIiB4Mj0iMzU4IiB5Mj0iMTUwIiBzdHJva2U9IiM1YzY2NzIiIHN0cm9rZS13aWR0aD0iMS41IiBtYXJrZXItZW5kPSJ1cmwoI2FyKSI+PC9saW5lPgogIDx0ZXh0IHg9IjMyNCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNWM2NjcyIj5IVFRQL0pTT048L3RleHQ+CiAgPHRleHQgeD0iMzI0IiB5PSIxNjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM1YzY2NzIiPmZldGNoICsgQmVhcmVyPC90ZXh0PgogIDxsaW5lIHgxPSI2NjAiIHkxPSIyNTYiIHgyPSI3MjgiIHkyPSIyNTYiIHN0cm9rZT0iIzVjNjY3MiIgc3Ryb2tlLXdpZHRoPSIxLjUiIG1hcmtlci1lbmQ9InVybCgjYXIpIj48L2xpbmU+CiAgPHRleHQgeD0iNjk0IiB5PSIyNDYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM1YzY2NzIiPlNRTDwvdGV4dD4KICA8dGV4dCB4PSI2OTQiIHk9IjI3NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzVjNjY3MiI+cGFyYW1ldHJpemFkbyAoJDEpPC90ZXh0PgogIDx0ZXh0IHg9IjUwMCIgeT0iMzE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjExIiBmaWxsPSIjNWM2NjcyIj5UZXN0ZXM6IHVuaXTDoXJpb3MgY29icmVtIHNlcnZpY2VzLyAoc2VtIGJhbmNvKSDCtyB0ZXN0ZXMgZGUgaW50ZWdyYcOnw6NvIGNoYW1hbSBhIEFQSSBwb3IgSFRUUCBjb20gbyBiYW5jbyByZWFsPC90ZXh0Pgo8L3N2Zz4=)



Figura 1 — As três camadas e os dois pontos de integração: HTTP/JSON entre navegador e API; SQL parametrizado entre API e PostgreSQL.





### 2.1 Como cada ponto de integração funciona

| Ponto                           | Mecanismo                                                                                                                                                                                                                                                                                                             | Onde está no código                                              |
|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| **Navegador → API**             | Toda chamada passa por `apiFetch()`, que anexa `Authorization: Bearer <token>`, converte a resposta em JSON e aplica a política de sessão: **401** (sem token) e **403 “Token invalido”** encerram a sessão; **403 “Perfil sem permissao”** apenas mostra a mensagem. O painel público usa `fetch` direto, sem token. | `public/js/menu.js` → `apiFetch`, `cabecalhoAutorizacao`, `sair` |
| **Sessão**                      | No login a API devolve `{ token, nome, perfil }`; o navegador guarda em `localStorage`. O JWT carrega `id`, `nome` e `perfil`, assinado com `JWT_SECRET` e expira em 8 h. O perfil guardado no navegador só decide *o que mostrar*; quem decide *o que pode* é a API, lendo o perfil de dentro do token.              | `routes/auth.js` (`jwt.sign`), `public/js/login.js`              |
| **API → regras**                | As rotas não contêm regra de negócio: chamam funções puras de `services/` (validar medição, avaliar limite, montar período, gerar CSV, montar boletim). Isso permite testar as regras sem banco e reaproveitá-las em várias rotas (ex.: `montarFiltros` é usado por listagem, estatísticas e CSV).                    | `services/validacao.js`, `alertas.js`, `csv.js`, `boletim.js`    |
| **API → banco**                 | Um único `Pool` do driver `pg`, configurado pelo `.env`. Todo SQL é parametrizado (`$1, $2…`) — nunca concatenado com dados do usuário (sem SQL injection). Operações que escrevem em mais de uma tabela usam transação explícita.                                                                                    | `db.js`; transação em `routes/medicoes.js` (POST)                |
| **Erros do banco → API → tela** | Os códigos SQLSTATE do PostgreSQL são traduzidos em respostas HTTP com mensagem: `23505` (UNIQUE) → 409, `23503` (FK) → 400/409, `23514` (CHECK) → 400. A tela lê `dados.erro` e exibe ao usuário.                                                                                                                    | blocos `catch` das rotas; `msgErro.textContent` nas telas        |
| **Contrato de erro**            | Toda resposta é JSON. Erros sempre têm a forma `{ "erro": "mensagem" }`, inclusive rotas inexistentes (`404 Rota nao encontrada`). A rota `/api/saude` permite verificar se a API e a versão estão no ar.                                                                                                             | `server.js` (handler 404 e `/api/saude`)                         |

## 3. Contrato da API REST

27 endpoints. **Auth**: 🔓 pública · 🔒 token obrigatório · **perfil** indica quem pode além do token. Todas as respostas são JSON.

| Método e rota                                                                     | Auth · perfil      | O que faz                                                                | Respostas             |
|-----------------------------------------------------------------------------------|--------------------|--------------------------------------------------------------------------|-----------------------|
| **Autenticação** — `routes/auth.js`                                               |                    |                                                                          |                       |
| POST /api/auth/registrar                                                          | 🔓                 | Cria o **primeiro** administrador (depois fica desabilitado)             | 201 · 400 · 403 · 409 |
| POST /api/auth/login                                                              | 🔓                 | Autentica e devolve `{token, nome, perfil}`                              | 200 · 400 · 401       |
| **Pontos de monitoramento** — `routes/pontos.js`                                  |                    |                                                                          |                       |
| GET /api/pontos                                                                   | 🔒 todos           | Lista pontos                                                             | 200                   |
| POST /api/pontos                                                                  | 🔒 operador, admin | Cadastra (nome único)                                                    | 201 · 400 · 409       |
| PUT /api/pontos/:id                                                               | 🔒 operador, admin | Edita                                                                    | 200 · 400 · 404 · 409 |
| DELETE /api/pontos/:id                                                            | 🔒 operador, admin | Exclui se não houver dependentes                                         | 204 · 404 · 409       |
| **Detonações** — `routes/detonacoes.js`                                           |                    |                                                                          |                       |
| GET /api/detonacoes                                                               | 🔒 todos           | Lista com ponto e responsável                                            | 200                   |
| POST /api/detonacoes                                                              | 🔒 operador, admin | Cadastra; responsável vem do token                                       | 201 · 400 · 409       |
| **Medições** — `routes/medicoes.js`                                               |                    |                                                                          |                       |
| GET /api/medicoes                                                                 | 🔒 todos           | Histórico; filtros `inicio, fim, ponto_id, tipo`; traz limite e situação | 200 · 400             |
| GET /api/medicoes/estatisticas                                                    | 🔒 todos           | Mín/média/máx/qtde por ponto e tipo (mesmos filtros)                     | 200 · 400             |
| GET /api/medicoes/exportar                                                        | 🔒 todos           | CSV do histórico filtrado (`text/csv`, attachment)                       | 200 · 400             |
| POST /api/medicoes                                                                | 🔒 operador, admin | Registra medição e, se acima do limite, o alerta (transação)             | 201 · 400 · 403       |
| **Alertas** — `routes/alertas.js`                                                 |                    |                                                                          |                       |
| GET /api/alertas?status=                                                          | 🔒 todos           | Lista com ponto, medição e quem resolveu                                 | 200                   |
| PUT /api/alertas/:id/resolver                                                     | 🔒 operador, admin | Marca resolvido; grava `resolvido_em/por`                                | 200 · 400 · 404 · 409 |
| **Boletins** — `routes/boletins.js`                                               |                    |                                                                          |                       |
| GET /api/boletins/previa?inicio&fim                                               | 🔒 todos           | Monta o boletim do período sem gravar                                    | 200 · 400             |
| GET /api/boletins                                                                 | 🔒 todos           | Boletins emitidos                                                        | 200                   |
| POST /api/boletins                                                                | 🔒 operador, admin | Emite e publica (grava retrato JSONB)                                    | 201 · 400 · 403       |
| **Dashboard e relatórios**                                                        |                    |                                                                          |                       |
| GET /api/dashboard/resumo                                                         | 🔒 todos           | Totais e últimos alertas abertos                                         | 200                   |
| GET /api/relatorios/gerencial?inicio&fim                                          | 🔒 admin           | Indicadores consolidados (padrão: 30 dias)                               | 200 · 400 · 403       |
| **Usuários** — `routes/usuarios.js` (todas só admin)                              |                    |                                                                          |                       |
| GET /api/usuarios                                                                 | 🔒 admin           | Lista (sem hash de senha)                                                | 200 · 403             |
| POST /api/usuarios                                                                | 🔒 admin           | Cria com perfil                                                          | 201 · 400 · 409       |
| DELETE /api/usuarios/:id                                                          | 🔒 admin           | Exclui (não a si, não o último admin)                                    | 204 · 400 · 404       |
| **Painel público** — `routes/publico.js` (somente leitura, sem dados de usuários) |                    |                                                                          |                       |
| GET /api/publico/medicoes-atuais                                                  | 🔓                 | Última leitura por ponto e tipo, com situação                            | 200                   |
| GET /api/publico/detonacoes                                                       | 🔓                 | Detonações futuras                                                       | 200                   |
| GET /api/publico/alertas                                                          | 🔓                 | Últimos alertas                                                          | 200                   |
| GET /api/publico/boletins · /:id                                                  | 🔓                 | Boletins publicados / um boletim completo                                | 200 · 400 · 404       |
| **Infraestrutura**                                                                |                    |                                                                          |                       |
| GET /api/saude                                                                    | 🔓                 | `{ ok: true, versao }`                                                   | 200                   |
| \* /api/qualquer-outra                                                            | —                  | Rota desconhecida                                                        | 404 JSON              |

Convenção de códigos: 400 dado inválido · 401 não autenticado · 403 autenticado sem permissão (ou token inválido) · 404 não existe · 409 conflito com estado atual (duplicado, já resolvido, tem dependentes) · 500 erro interno (mensagem genérica, sem detalhes do banco).

## 4. Fluxos de integração ponta a ponta

### 4.1 Registrar medição → alerta automático → painel público

É o fluxo que atravessa as três camadas e envolve a regra de negócio central (RN02). A transação garante que nunca exista medição crítica sem o alerta correspondente.



![](data:image/svg+xml;base64,PHN2ZyB2aWV3Ym94PSIwIDAgMTAwMCA0NzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZm9udC1mYW1pbHk9IklCTSBQbGV4IFNhbnMsIEFyaWFsIiBmb250LXNpemU9IjExLjUiPgogIDxkZWZzPjxtYXJrZXIgaWQ9ImEyIiBtYXJrZXJ3aWR0aD0iMTAiIG1hcmtlcmhlaWdodD0iOCIgcmVmeD0iOSIgcmVmeT0iNCIgb3JpZW50PSJhdXRvIj48cGF0aCBkPSJNMCwwIEwxMCw0IEwwLDgiIGZpbGw9IiMxYjIzMmMiPjwvcGF0aD48L21hcmtlcj48bWFya2VyIGlkPSJhMyIgbWFya2Vyd2lkdGg9IjEwIiBtYXJrZXJoZWlnaHQ9IjgiIHJlZng9IjkiIHJlZnk9IjQiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTTAsMCBMMTAsNCBMMCw4IiBmaWxsPSIjNWM2NjcyIj48L3BhdGg+PC9tYXJrZXI+PC9kZWZzPgogIDxnIGZvbnQtd2VpZ2h0PSI3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPgogICAgPHJlY3QgeD0iMzAiIHk9IjEwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjM0IiByeD0iNiIgZmlsbD0iI2U0ZWRmOCIgc3Ryb2tlPSIjMWY1ZmE4Ij48L3JlY3Q+PHRleHQgeD0iMTA1IiB5PSIzMSI+VGVsYSBtZWRpY29lcy5qczwvdGV4dD4KICAgIDxyZWN0IHg9IjI3MCIgeT0iMTAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMzQiIHJ4PSI2IiBmaWxsPSIjZmRmMWUwIiBzdHJva2U9IiNiODc0MWYiPjwvcmVjdD48dGV4dCB4PSIzNDUiIHk9IjMxIj5hdXRoLmpzPC90ZXh0PgogICAgPHJlY3QgeD0iNTAwIiB5PSIxMCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIzNCIgcng9IjYiIGZpbGw9IiNmZGYxZTAiIHN0cm9rZT0iI2I4NzQxZiI+PC9yZWN0Pjx0ZXh0IHg9IjU3NSIgeT0iMzEiPnJvdXRlcy9tZWRpY29lcy5qczwvdGV4dD4KICAgIDxyZWN0IHg9IjczMCIgeT0iMTAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMzQiIHJ4PSI2IiBmaWxsPSIjZTNmM2VhIiBzdHJva2U9IiMyZTdkNGYiPjwvcmVjdD48dGV4dCB4PSI4MDUiIHk9IjMxIj5Qb3N0Z3JlU1FMPC90ZXh0PgogIDwvZz4KICA8ZyBzdHJva2U9IiNjOWQwZDgiIHN0cm9rZS1kYXNoYXJyYXk9IjQgNCI+PGxpbmUgeDE9IjEwNSIgeTE9IjQ0IiB4Mj0iMTA1IiB5Mj0iNDU1Ij48L2xpbmU+PGxpbmUgeDE9IjM0NSIgeTE9IjQ0IiB4Mj0iMzQ1IiB5Mj0iNDU1Ij48L2xpbmU+PGxpbmUgeDE9IjU3NSIgeTE9IjQ0IiB4Mj0iNTc1IiB5Mj0iNDU1Ij48L2xpbmU+PGxpbmUgeDE9IjgwNSIgeTE9IjQ0IiB4Mj0iODA1IiB5Mj0iNDU1Ij48L2xpbmU+PC9nPgogIDxnIHN0cm9rZT0iIzFiMjMyYyIgc3Ryb2tlLXdpZHRoPSIxLjMiIG1hcmtlci1lbmQ9InVybCgjYTIpIj4KICAgIDxsaW5lIHgxPSIxMDUiIHkxPSI3MCIgeDI9IjM0MyIgeTI9IjcwIj48L2xpbmU+CiAgICA8bGluZSB4MT0iMzQ1IiB5MT0iMTEwIiB4Mj0iNTczIiB5Mj0iMTEwIj48L2xpbmU+CiAgICA8bGluZSB4MT0iNTc1IiB5MT0iMTc1IiB4Mj0iODAzIiB5Mj0iMTc1Ij48L2xpbmU+CiAgICA8bGluZSB4MT0iNTc1IiB5MT0iMjA1IiB4Mj0iODAzIiB5Mj0iMjA1Ij48L2xpbmU+CiAgICA8bGluZSB4MT0iNTc1IiB5MT0iMjM1IiB4Mj0iODAzIiB5Mj0iMjM1Ij48L2xpbmU+CiAgICA8bGluZSB4MT0iNTc1IiB5MT0iMzAwIiB4Mj0iODAzIiB5Mj0iMzAwIj48L2xpbmU+CiAgICA8bGluZSB4MT0iNTc1IiB5MT0iMzMwIiB4Mj0iODAzIiB5Mj0iMzMwIj48L2xpbmU+CiAgPC9nPgogIDxnIHN0cm9rZT0iIzVjNjY3MiIgc3Ryb2tlLXdpZHRoPSIxLjMiIHN0cm9rZS1kYXNoYXJyYXk9IjYgMyIgbWFya2VyLWVuZD0idXJsKCNhMykiPgogICAgPGxpbmUgeDE9IjU3MyIgeTE9IjM3MCIgeDI9IjEwNyIgeTI9IjM3MCI+PC9saW5lPgogIDwvZz4KICA8ZyBmb250LXNpemU9IjExIj4KICAgIDx0ZXh0IHg9IjExMiIgeT0iNjQiPlBPU1QgL2FwaS9tZWRpY29lcyB7cG9udG9faWQsIHRpcG8sIHZhbG9yfSDCtyBCZWFyZXIgdG9rZW48L3RleHQ+CiAgICA8dGV4dCB4PSIzNTIiIHk9IjkyIiBmaWxsPSIjNWM2NjcyIj5hdXRlbnRpY2FyKCk6IEpXVCB2w6FsaWRvPyDihpIgcmVxLnVzdWFyaW8gwrcgYXV0b3JpemFyKCYjMzk7b3BlcmFkb3ImIzM5OywmIzM5O2FkbWluJiMzOTspPC90ZXh0PgogICAgPHRleHQgeD0iMzUyIiB5PSIxMDQiPnNlZ3VlIHBhcmEgYSByb3RhPC90ZXh0PgogICAgPHRleHQgeD0iNTgyIiB5PSIxNDAiIGZpbGw9IiM1YzY2NzIiPnZhbGlkYXJNZWRpY2FvKCkg4oaSIHRpcG8g4oiIIHt2aWJyYWNhbywgcnVpZG8sIGFyfSwgdmFsb3Ig4omlIDAsIHVuaWRhZGUgcGFkcsOjbyAoUk4wMyk8L3RleHQ+CiAgICA8dGV4dCB4PSI1ODIiIHk9IjE1NSIgZmlsbD0iI2I0MzAyYiI+aW52w6FsaWRvIOKGkiA0MDAgeyBlcnJvIH0gZSBwYXJhIGFxdWk8L3RleHQ+CiAgICA8dGV4dCB4PSI1ODIiIHk9IjE2OSI+QkVHSU48L3RleHQ+CiAgICA8dGV4dCB4PSI1ODIiIHk9IjE5OSI+SU5TRVJUIElOVE8gbWVkaWNvZXMg4oCmIFJFVFVSTklORyAqICAoQ0hFQ0sgdmFsb3Ig4omlIDAsIEZLIHBvbnRvKTwvdGV4dD4KICAgIDx0ZXh0IHg9IjU4MiIgeT0iMjI5Ij5TRUxFQ1QgKiBGUk9NIGxpbWl0ZXNfc2VndXJhbmNhIFdIRVJFIHRpcG8gPSAkMSAgKFJOMDEpPC90ZXh0PgogICAgPHRleHQgeD0iNTgyIiB5PSIyNjIiIGZpbGw9IiM1YzY2NzIiPmF2YWxpYXJMaW1pdGUobWVkaWNhbywgbGltaXRlKSDihpIgdmFsb3IgJmd0OyBsaW1pdGU/IChSTjAyKTwvdGV4dD4KICAgIDx0ZXh0IHg9IjU4MiIgeT0iMjk0Ij5zZSB1bHRyYXBhc3NvdTogSU5TRVJUIElOVE8gYWxlcnRhcyAobWVkaWNhb19pZCwgbWVuc2FnZW0sICYjMzk7YWJlcnRvJiMzOTspPC90ZXh0PgogICAgPHRleHQgeD0iNTgyIiB5PSIzMjQiPkNPTU1JVCAgIChxdWFscXVlciBlcnJvIOKGkiBST0xMQkFDSywgNTAwKTwvdGV4dD4KICAgIDx0ZXh0IHg9IjExMiIgeT0iMzY0Ij4yMDEgeyBtZWRpY2FvLCBhbGVydGEgfCBudWxsIH08L3RleHQ+CiAgICA8dGV4dCB4PSIxMTIiIHk9IjM5NiIgZmlsbD0iIzVjNjY3MiI+dGVsYTogdmVyZGUg4oCcZGVudHJvIGRvIGxpbWl0ZeKAnSBvdSB2ZXJtZWxobyDigJxBbGVydGEgZ2VyYWRvOiDigKbigJ07IHJlY2FycmVnYSBoaXN0w7NyaWNvPC90ZXh0PgogICAgPHRleHQgeD0iMTEyIiB5PSI0MzAiIGZpbGw9IiMyZTdkNGYiIGZvbnQtd2VpZ2h0PSI2MDAiPlBhaW5lbCBww7pibGljbyAoc2VtIGxvZ2luKTogR0VUIC9hcGkvcHVibGljby9tZWRpY29lcy1hdHVhaXMgasOhIG1vc3RyYSBhIGxlaXR1cmEgY29tbyDigJxhY2ltYSBkbyBsaW1pdGXigJ08L3RleHQ+CiAgICA8dGV4dCB4PSIxMTIiIHk9IjQ0NiIgZmlsbD0iIzJlN2Q0ZiIgZm9udC13ZWlnaHQ9IjYwMCI+ZSBHRVQgL2FwaS9wdWJsaWNvL2FsZXJ0YXMgbGlzdGEgbyBhbGVydGEg4oCUIGludGVncmHDp8OjbyBjb21wbGV0YSwgc2VtIHBhc3NvIG1hbnVhbC48L3RleHQ+CiAgPC9nPgo8L3N2Zz4=)



Figura 2 — Sequência do fluxo de medição. Validação na API (services), gravação transacional no banco e reflexo imediato no painel público.





### 4.2 Demais fluxos (resumo)

| Fluxo                   | Camada web                                                                                                    | API                                                                                                                      | Banco                                                                                  |
|-------------------------|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| **Login e sessão**      | `login.js` envia e-mail/senha; guarda token, nome e perfil; `protegerPagina()` redireciona quem não tem token | `bcrypt.compare`; `jwt.sign({id, nome, perfil}, 8h)`; mesma mensagem 401 para e-mail ou senha errados                    | `SELECT … FROM usuarios WHERE email=$1`; hash nunca sai da API                         |
| **Histórico e CSV**     | Formulário de filtros monta `?inicio&fim&ponto_id&tipo`; CSV baixado via `blob`                               | `montarFiltros()` valida datas (RN09) e gera o `WHERE` parametrizado reutilizado por listagem, estatísticas e exportação | `BETWEEN` + índices `(data_hora)` e `(ponto_id, tipo)`; agregações `COUNT/MIN/AVG/MAX` |
| **Boletim periódico**   | Pré-visualiza (`/previa`) e só então emite; `boletim-render.js` é compartilhado entre tela interna e pública  | 4 consultas em paralelo (`Promise.all`) → `montarBoletim()` → resumo automático                                          | `INSERT INTO boletins (…, conteudo JSONB)` — retrato imutável (RN08)                   |
| **Relatório gerencial** | Só o menu do admin mostra; `protegerPaginaAdmin()`                                                            | `autorizar('admin')` no módulo inteiro; 6 consultas em paralelo                                                          | agregações por tipo, ponto e semana; tempo de resolução via `resolvido_em − data_hora` |
| **Resolver alerta**     | Botão só para operador/admin (`podeLancar()`)                                                                 | Verifica existência (404) e estado (409); grava quem resolveu a partir de `req.usuario.id`                               | `UPDATE alertas SET status, resolvido_em=now(), resolvido_por=$2`                      |

## 5. Integração com o banco de dados

| Aspecto                     | Como está implementado                                                                                                                                                                                            |
|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Conexão**                 | Um `Pool` único (`db.js`) lido de `.env` (`DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD`). O `.env` não vai para o repositório; existe um `.env.example`.                                                      |
| **Consultas**               | Sempre parametrizadas (`pool.query(sql, [params])`). Dados do usuário nunca entram na string SQL.                                                                                                                 |
| **Transações**              | `pool.connect()` → `BEGIN` → operações → `COMMIT`/`ROLLBACK` → `release()`. Usada onde duas tabelas mudam juntas (medição + alerta).                                                                              |
| **Integridade declarativa** | `UNIQUE` (e-mail, nome do ponto, identificador da detonação, tipo do limite) · `CHECK` (perfil, tipo, status, `valor ≥ 0`, `periodo_fim ≥ periodo_inicio`) · `FK` com `RESTRICT` (não apaga ponto com histórico). |
| **Evolução**                | `sql/schema.sql` para instalação nova; `sql/migracao_sprint1.sql` idempotente (`IF NOT EXISTS`) para bancos já em uso.                                                                                            |
| **Desempenho**              | Índices `idx_medicoes_data_hora`, `idx_medicoes_ponto_tipo`, `idx_alertas_status`, `idx_detonacoes_data_hora`, `idx_boletins_emitido_em`; histórico limitado a 1.000 linhas por consulta.                         |
| **Tradução de erros**       | `23505` → 409 “já existe” · `23503` → 400 “não existe” / 409 “possui vinculados” · `23514` → 400 “fora das regras”.                                                                                               |

## 6. Testes de integração

Os testes de integração exercitam a API **por HTTP, com o banco real**, exatamente como o navegador faz — portanto validam as três camadas juntas. Executor nativo do Node.js (`node:test` + `fetch`), sem dependências extras.

    npm start                                   # API no ar (porta 3000)
    API_URL=http://localhost:3000 npm run test:integracao
    # banco que já tem usuários: ADMIN_EMAIL=... ADMIN_SENHA=... npm run test:integracao

| \#                                 | Caso de teste (`tests/integracao/api.test.js`)                                                | Camadas / regras verificadas |
|------------------------------------|-----------------------------------------------------------------------------------------------|------------------------------|
| **Autenticação e autorização**     |                                                                                               |                              |
| 1                                  | Login com senha errada responde 401 sem revelar o e-mail                                      | auth → bcrypt → banco · RN10 |
| 2                                  | Rota protegida sem token responde 401                                                         | middleware `autenticar`      |
| 3                                  | Token adulterado responde 403                                                                 | `jwt.verify`                 |
| 4                                  | Registro público bloqueado após o primeiro usuário (403)                                      | RN06                         |
| 5                                  | Admin cria engenheiro; engenheiro não acessa /usuarios nem /relatorios (403)                  | `autorizar` · RN07           |
| 6                                  | Rota /api inexistente responde JSON 404                                                       | contrato de erro             |
| **Pontos e medições**              |                                                                                               |                              |
| 7                                  | Cadastra ponto e rejeita duplicado com 409                                                    | UNIQUE → 23505 → 409         |
| 8                                  | Engenheiro não lança medição (403), mas consulta histórico (200)                              | RN07                         |
| 9                                  | Medição negativa e tipo inválido respondem 400                                                | RN03 (services)              |
| 10                                 | Medição acima do limite gera alerta na mesma transação                                        | RN01, RN02, transação        |
| 11                                 | Medição dentro do limite não gera alerta                                                      | RN02                         |
| 12                                 | Histórico filtra por ponto e tipo e traz situação                                             | filtros → SQL parametrizado  |
| 13                                 | Filtro com data inválida responde 400                                                         | RN09                         |
| 14                                 | Estatísticas calculam mín/média/máx por ponto e tipo                                          | agregações no banco          |
| 15                                 | Exportação CSV responde text/csv com cabeçalho                                                | services/csv                 |
| 16                                 | Excluir ponto com medições responde 409; inexistente 404                                      | RN05 (FK RESTRICT → 23503)   |
| **Alertas, relatórios e boletins** |                                                                                               |                              |
| 17                                 | Resolver alerta grava resolvido_por e impede resolver duas vezes (409/404)                    | RN04                         |
| 18                                 | Relatório gerencial consolida totais e percentual de resolução                                | 6 consultas em paralelo      |
| 19                                 | Boletim: prévia exige período (400); engenheiro não emite (403); emissão grava e fica pública | RN07, RN08                   |
| 20                                 | Painel público não exige token e não expõe dados de usuários                                  | RN11                         |

Complementam a suíte 25 testes unitários (`npm test`) que cobrem as funções de `services/` sem banco — 25/25 aprovados na versão atual.

## 7. Regras de negócio implementadas

Para cada regra: o que ela garante, **em que camada é aplicada** (Web orienta · API valida · Banco garante), o trecho de código e o teste que a comprova.





RN01 Limites de segurança por tipo de medição





Vibração 5,00 mm/s · Ruído 85,00 dB · Qualidade do ar 50,00 µg/m³. Os limites ficam na tabela `limites_seguranca` (um por tipo, `UNIQUE`), não no código — podem ser ajustados sem redeploy.

| Camada                                                          | Implementação                                                                                           | Teste                 |
|-----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|-----------------------|
| Banco API | `sql/schema.sql` (INSERT inicial) · `routes/medicoes.js` consulta `WHERE tipo = $1` dentro da transação | Integração \#10, \#11 |









RN02 Medição acima do limite gera exatamente um alerta aberto





Compara **maior que** (valor igual ao limite não gera). A mensagem inclui valor, unidade, limite e percentual excedido. Medição e alerta nascem na mesma transação.

    // services/alertas.js
    if (valor > valorLimite) {
      const excedente = (((valor - valorLimite) / valorLimite) * 100).toFixed(1);
      return { ultrapassou: true, mensagem: `Medicao de ${medicao.tipo} (${valor} ${medicao.unidade}) ultrapassou o limite de ${valorLimite.toFixed(2)} ${limite.unidade} (+${excedente}%)` };
    }

| Camada                          | Implementação                                                                            | Teste                                                   |
|---------------------------------|------------------------------------------------------------------------------------------|---------------------------------------------------------|
| API | `services/alertas.js → avaliarLimite()`; `routes/medicoes.js` BEGIN/INSERT/INSERT/COMMIT | Unitários `alertas.test.js` (5) · Integração \#10, \#11 |









RN03 Medição válida: tipo conhecido, valor numérico ≥ 0, unidade padronizada pelo tipo





    // services/validacao.js
    const UNIDADE_PADRAO = { vibracao: 'mm/s', ruido: 'dB', ar: 'ug/m3' };
    if (!TIPOS_MEDICAO.includes(tipo)) erros.push('Tipo deve ser vibracao, ruido ou ar');
    if (Number.isNaN(numero)) erros.push('Valor deve ser numerico');
    else if (numero < 0) erros.push('Valor nao pode ser negativo');
    -- sql: CONSTRAINT medicoes_valor_positivo CHECK (valor >= 0)

| Camada                                                                                          | Implementação                                                                                | Teste                                              |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|----------------------------------------------------|
| Web API Banco | campo `min="0"` e unidade somente leitura · `validarMedicao()` → 400 · `CHECK` → 23514 → 400 | Unitários `validacao.test.js` (5) · Integração \#9 |









RN04 Alerta é resolvido uma única vez, registrando quem e quando





    // routes/alertas.js
    if (atual.rows.length === 0) return res.status(404).json({ erro: 'Alerta nao encontrado' });
    if (atual.rows[0].status === 'resolvido') return res.status(409).json({ erro: 'Alerta ja estava resolvido' });
    UPDATE alertas SET status='resolvido', resolvido_em=now(), resolvido_por=$2 WHERE id=$1

| Camada                                                                                          | Implementação                                                                                        | Teste           |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|-----------------|
| Web API Banco | botão some após resolver · verificação 404/409 · colunas `resolvido_em`, `resolvido_por FK usuarios` | Integração \#17 |









RN05 Ponto com medições ou detonações vinculadas não pode ser excluído





| Camada                                                          | Implementação                                                                                                                          | Teste           |
|-----------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| Banco API | `FK … ON DELETE RESTRICT` · `routes/pontos.js` traduz `23503` → 409 “possui medicoes ou detonacoes vinculadas”; `rowCount === 0` → 404 | Integração \#16 |









RN06 Cadastro público só para o primeiro administrador; admin não exclui a própria conta nem o último admin





    // routes/auth.js
    if (Number(totalUsuarios.rows[0].count) > 0) return res.status(403).json({ erro: 'Cadastro público desabilitado…' });
    // routes/usuarios.js
    if (idAlvo === req.usuario.id) return res.status(400).json({ erro: 'Você não pode excluir a própria conta' });
    … 'Não é possível excluir o único administrador do sistema'

| Camada                                                          | Implementação                                                              | Teste               |
|-----------------------------------------------------------------|----------------------------------------------------------------------------|---------------------|
| Web API | tela de login oculta “registrar” quando já há usuário · verificações acima | Integração \#4, \#5 |









RN07 Perfis: Operador e Admin lançam dados e emitem boletins; Engenheiro apenas consulta; Admin gerencia usuários e relatórios





    // middleware/auth.js
    function autorizar(...perfisPermitidos) { return (req, res, next) => {
      if (!perfisPermitidos.includes(req.usuario.perfil)) return res.status(403).json({ erro: 'Perfil sem permissao para essa acao' });
      next(); }; }
    // uso: router.post('/', autorizar('operador', 'admin'), …)   router.use(autenticar, autorizar('admin'))

| Camada                                                          | Implementação                                                                                                                                            | Teste                     |
|-----------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| Web API | menu e formulários conforme `perfil` (`podeLancar()`, `protegerPaginaAdmin()`) · `autorizar()` em toda rota de escrita e nos módulos usuários/relatórios | Integração \#5, \#8, \#19 |









RN08 Boletim emitido é um retrato imutável do período





Na emissão, os dados consolidados são gravados em `boletins.conteudo` (JSONB). O que a comunidade leu não muda se medições forem corrigidas depois. A prévia (`/previa`) nunca grava; `periodo_fim ≥ periodo_inicio` é `CHECK` no banco.

| Camada                                                          | Implementação                                                                           | Teste                                                 |
|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------|-------------------------------------------------------|
| API Banco | `services/boletim.js → montarBoletim()` · `routes/boletins.js` POST · tabela `boletins` | Unitários `csv-boletim.test.js` (3) · Integração \#19 |









RN09 Períodos de consulta: formato `aaaa-mm-dd`, início ≤ fim, intervalo fechado do dia





    // services/validacao.js → montarPeriodo()
    if (inicio && fim && inicio > fim) return { ok: false, erro: 'Data inicial maior que a data final' };
    periodo: { inicio: `${inicio} 00:00:00`, fim: `${fim} 23:59:59` }

| Camada                                                          | Implementação                                                                                       | Teste                                               |
|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Web API | `input type="date"` · `montarPeriodo()` usado por histórico, estatísticas, CSV, relatório e boletim | Unitários `validacao.test.js` (4) · Integração \#13 |









RN10 Credenciais: senha só como hash; login não revela se o e-mail existe





| Camada                                                          | Implementação                                                                                                                                                 | Teste          |
|-----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------|
| API Banco | `bcrypt.hash(senha, 10)` / `bcrypt.compare`; mesma resposta 401 “Credenciais invalidas” nos dois casos; coluna `senha_hash` nunca é selecionada para listagem | Integração \#1 |









RN11 Painel público é somente leitura e não expõe dados pessoais





| Camada                          | Implementação                                                                                                                      | Teste           |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| API | `routes/publico.js` só tem `GET`; consultas selecionam apenas ponto, tipo, valor, situação, detonação e boletim — nunca `usuarios` | Integração \#20 |









RN12 Identificadores únicos: e-mail, nome do ponto, identificador da detonação





| Camada                                                          | Implementação                                                                    | Teste          |
|-----------------------------------------------------------------|----------------------------------------------------------------------------------|----------------|
| Banco API | `UNIQUE` nas três colunas · rotas traduzem `23505` → 409 com mensagem específica | Integração \#7 |





### 7.1 Matriz regra × camada × teste

| Regra                              | Web | API | Banco     | Unitário | Integração     |
|------------------------------------|-----|-----|-----------|----------|----------------|
| RN01 Limites por tipo              | —   | ✔   | ✔         | —        | \#10, \#11     |
| RN02 Alerta automático             | —   | ✔   | transação | 5        | \#10, \#11     |
| RN03 Medição válida                | ✔   | ✔   | ✔         | 5        | \#9            |
| RN04 Resolver uma vez              | ✔   | ✔   | ✔         | —        | \#17           |
| RN05 Ponto com dependentes         | —   | ✔   | ✔         | —        | \#16           |
| RN06 Primeiro admin / último admin | ✔   | ✔   | —         | —        | \#4, \#5       |
| RN07 Perfis                        | ✔   | ✔   | —         | —        | \#5, \#8, \#19 |
| RN08 Boletim imutável              | —   | ✔   | ✔         | 3        | \#19           |
| RN09 Períodos                      | ✔   | ✔   | —         | 4        | \#13           |
| RN10 Credenciais                   | —   | ✔   | ✔         | —        | \#1            |
| RN11 Público somente leitura       | —   | ✔   | —         | —        | \#20           |
| RN12 Unicidade                     | —   | ✔   | ✔         | —        | \#7            |

## 8. Como demonstrar

| \#  | Ação                                                                                                                             | O que evidencia                          |
|-----|----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| 1   | Abrir `http://localhost:3000/api/saude` no navegador                                                                             | API no ar; contrato JSON                 |
| 2   | Abrir `/api/pontos` sem login → `{"erro":"Token nao informado"}` (401)                                                           | integração protegida por JWT             |
| 3   | Logar; F12 → aba Rede; lançar vibração 7,4 → ver o `POST /api/medicoes` com header `Authorization` e a resposta 201 com `alerta` | Web → API → banco; RN01, RN02, RN03      |
| 4   | Lançar −1 → 400 na aba Rede; no pgAdmin, tentar `INSERT` com valor −1 → erro de CHECK                                            | regra em duas camadas                    |
| 5   | Abrir `publico.html` em janela anônima → leitura aparece “acima do limite”                                                       | integração ponta a ponta sem login; RN11 |
| 6   | Logar como engenheiro; tentar `POST /api/medicoes` → 403, sessão continua                                                        | RN07 e política de sessão                |
| 7   | No pgAdmin: `SELECT * FROM alertas` → `resolvido_em`, `resolvido_por` preenchidos após resolver                                  | RN04                                     |
| 8   | `npm test` e `npm run test:integracao`                                                                                           | 25 + 20 testes verdes                    |
