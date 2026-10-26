# Histórias de usuário — SIMSEP

| ID | História | Critérios de aceitação | Status |
|---|---|---|---|
| US01 | Como Administrador, quero realizar login para acessar o sistema com segurança | Token JWT 8 h; 401 "Credenciais invalidas" sem revelar o campo; 400 campos vazios | Concluída |
| US02 | Como Operador, quero cadastrar pontos de monitoramento | Nome/localização obrigatórios; nome único (409); editar/excluir; 409 com dependentes; 404 inexistente | Concluída |
| US03 | Como Operador, quero cadastrar detonações programadas | Identificador único; data válida; ponto existente; responsável do token; futuras no painel público | Concluída |
| US04/05 | Como Operador, quero registrar medições de vibração, ruído e ar | Tipo válido; valor ≥ 0; unidade pelo tipo; detonação opcional; Engenheiro 403 | Concluída |
| US06 | Como Operador, quero alertas automáticos ao ultrapassar limites | Mesma transação; mensagem com valor/limite/%; resolver uma vez com quem/quando; 404 | Concluída |
| US07 | Como Operador, quero emitir boletins periódicos para a comunidade | Período + prévia; resumo automático; retrato gravado; público e imprimível; Engenheiro 403 | Concluída (Sprint 1) |
| US08 | Como Morador, quero um canal público sem login | Sem token; somente GET; situação por ponto; sem dados de usuários | Concluída |
| US09 | Como Engenheiro de Minas, quero o histórico de medições por período | Filtros período/ponto/tipo; 400 data inválida; mín/média/máx; situação; CSV | Concluída (Sprint 1) |
| US10 | Como Administrador, quero relatórios gerenciais | Só admin; período (padrão 30 dias); totais, % resolvidos, tempo médio, por tipo/ponto/semana | Concluída (Sprint 1) |
| US11 | Como Administrador, quero cadastrar usuários pela interface | Registro público só 1º admin; validações; não exclui a si/último admin | Concluída |
| TD01 | Como equipe, queremos testes automatizados | `npm test` sem banco; integração cobre fluxos; cenários da Entrega 1 automatizados | Concluída (Sprint 1) |
| TD02 | Como equipe, queremos corrigir falhas da revisão da Entrega 1 | Ver registro da Sprint 1, seção 4 | Concluída (Sprint 1) |
| US12 | Como Administrador, quero editar limites de segurança pela interface | Só admin; valor > 0; auditoria; não altera alertas antigos | Pendente |
| US13 | Como Operador, quero notificação por e-mail de alerta | — | Pendente |
| US14 | Como Administrador, quero gráficos no relatório | — | Pendente |
| US15 | Como Morador, quero painel público adaptado ao celular | — | Pendente |
| US16 | Como usuário, quero recuperar senha por e-mail | — | Pendente |
