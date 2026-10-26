# Plano de testes — SIMSEP

| Tipo | Objetivo | Cobertura | Execução | Qtde |
|---|---|---|---|---|
| Unitário | Regra isolada | validação, avaliação de limite, situação, CSV, boletim | `npm test` | 25 |
| Integração (API) | Rotas + banco | auth, RBAC, CRUD, transação de alerta, histórico, CSV, relatório, boletim, público | `npm run test:integracao` | 20 |
| Banco de dados | Integridade | schema/migração em banco limpo; CHECK/FK/UNIQUE; consultas agregadas | `psql` | 9 |
| Funcional/aceitação | Critérios nas telas | roteiro de 10 passos nos 4 perfis | manual | 10 |
| Segurança | Brechas | XSS, token ausente/adulterado, escalação de perfil, exposição pública, `npm audit` | integração + revisão | 6 |
| Regressão | Evitar quebra | cenários da Entrega 1 automatizados | suíte de integração | — |

**Definição de pronto:** critérios de aceitação verificados; `npm test` verde; `npm audit` sem vulnerabilidade alta; documentação e migração atualizadas.

## Matriz de rastreabilidade
| História | Requisitos | Regras | Unitários | Integração |
|---|---|---|---|---|
| US01 | RF01, RNF01-02 | — | — | 401 senha errada; 401 sem token; 403 adulterado |
| US02 | RF02, RNF05 | RN05 | — | 409 duplicado; 409 com medições; 404 |
| US04/05 | RF04 | RN03, RN07 | validarMedicao (5) | 400 negativa/tipo; 403 engenheiro |
| US06 | RF05-06 | RN01-02, RN04 | avaliarLimite (5), classificarSituacao (4) | gera/não gera alerta; resolver 200/409/404 |
| US07 | RF09, RNF04 | RN07-08 | montarBoletim (3) | prévia 400; 403 engenheiro; emissão pública |
| US08 | RF08, RNF04 | — | — | 200 sem token; sem senha/e-mail |
| US09 | RF10, RNF06 | RN07 | montarPeriodo (4), csv (2) | filtros; 400 data; estatísticas; CSV |
| US10 | RF11 | RN07 | — | 403 engenheiro; totais |
| US11 | RF12, RNF01 | RN06 | validarUsuario (2) | 403 registro público; criação; 403 listagem |
| Infra | RNF07-08 | — | — | 404 JSON; /api/saude |
