# Casos de uso — SIMSEP

Diagrama: `casos-de-uso.svg`.

| ID | Caso de uso | Atores | Relações |
|---|---|---|---|
| UC01 | Realizar login | Operador, Engenheiro, Administrador | — |
| UC02 | Gerenciar pontos de monitoramento | Operador (Admin herda) | — |
| UC03 | Cadastrar detonação programada | Operador | — |
| UC04 | Registrar medição | Operador | «include» UC05 |
| UC05 | Gerar alerta automático | (sistema) | — |
| UC06 | Resolver alerta | Operador | — |
| UC07 | Emitir boletim periódico | Operador | — |
| UC08 | Consultar painel público | Morador | «extend» UC13 |
| UC09 | Consultar histórico por período | Engenheiro | «extend» UC10 |
| UC10 | Exportar histórico (CSV) | Engenheiro | — |
| UC11 | Visualizar relatórios gerenciais | Administrador | — |
| UC12 | Gerenciar usuários | Administrador | — |
| UC13 | Consultar boletins publicados | Morador | — |

## Especificação — UC04 Registrar medição (inclui UC05)
- **Ator principal:** Operador de Segurança (Administrador herda).
- **Pré-condições:** autenticado como operador/admin; ponto cadastrado; limites configurados.
- **Pós-condições:** medição persistida; alerta aberto se acima do limite; painéis atualizados.
- **Fluxo principal:** 1) seleciona ponto, detonação (opcional) e tipo — unidade automática; 2) informa valor e confirma; 3) sistema valida (RN03) e abre transação; 4) grava medição e consulta limite (RN01); 5) se valor > limite cria alerta (RN02) — UC05; 6) COMMIT e 201 com medição e alerta; 7) tela confirma ou exibe alerta e atualiza histórico.
- **Alternativos/exceções:** A1 sem pontos → orienta a cadastrar; E1 valor/tipo inválido → 400; E2 ponto/detonação inexistente → 400; E3 Engenheiro → 403 (sessão mantida); E4 falha no alerta → ROLLBACK, 500.
- **Testes:** `tests/unit/alertas.test.js`, `tests/unit/validacao.test.js`, `tests/integracao/api.test.js` (medições).
