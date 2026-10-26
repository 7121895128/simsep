# Documento de requisitos — SIMSEP

**Escopo.** Monitoramento de vibração, ruído e qualidade do ar em pedreiras, com alertas automáticos e canal de transparência para a comunidade.
**Atores.** Operador de Segurança, Engenheiro de Minas, Administrador, Morador/Comunidade.

## Requisitos funcionais
| ID | Requisito | Prioridade | História |
|---|---|---|---|
| RF01 | Autenticar usuário por e-mail e senha, emitindo token JWT (8 h) | Alta | US01 |
| RF02 | Manter pontos de monitoramento (cadastrar, editar, excluir, listar), nome único | Alta | US02 |
| RF03 | Registrar detonações programadas (identificador único, data/hora, ponto, responsável) | Alta | US03 |
| RF04 | Registrar medições de vibração, ruído e ar por ponto, com vínculo opcional a detonação | Alta | US04, US05 |
| RF05 | Gerar alerta automaticamente, na mesma transação, quando a medição ultrapassar o limite | Alta | US06 |
| RF06 | Marcar alerta como resolvido, registrando data e responsável | Alta | US06 |
| RF07 | Painel com indicadores e alertas em aberto | Média | US06 |
| RF08 | Painel público, sem login e somente leitura | Alta | US08 |
| RF09 | Emitir boletins periódicos publicados à comunidade | Média | US07 |
| RF10 | Histórico de medições por período, ponto e tipo, com estatísticas e CSV | Média | US09 |
| RF11 | Relatórios gerenciais por período | Média | US10 |
| RF12 | Gestão de usuários exclusiva do Administrador; cadastro público só no 1º acesso | Alta | US11 |

## Requisitos não funcionais
| ID | Requisito | Categoria |
|---|---|---|
| RNF01 | Senhas apenas com hash bcrypt | Segurança |
| RNF02 | Rotas internas exigem Bearer JWT; 401 sem token, 403 inválido/sem permissão | Segurança |
| RNF03 | Dados da API escapados antes de ir ao HTML (XSS) | Segurança |
| RNF04 | Painel público não expõe dados de usuários | Privacidade |
| RNF05 | Integridade no banco: PK/FK, UNIQUE, CHECK, transações | Confiabilidade |
| RNF06 | Histórico e relatório < 1 s até 100 mil medições (índices) | Desempenho |
| RNF07 | Toda resposta da API em JSON, inclusive erros e 404 | API |
| RNF08 | Regras de negócio cobertas por testes (`npm test`) | Manutenibilidade |
| RNF09 | Tecnologias livres (Node/Express, PostgreSQL, HTML/CSS/JS) | Portabilidade |

## Regras de negócio
| ID | Regra |
|---|---|
| RN01 | Limites: vibração 5 mm/s · ruído 85 dB · ar 50 µg/m³ (`limites_seguranca`) |
| RN02 | Valor **maior** que o limite gera exatamente um alerta aberto; igual não gera |
| RN03 | Valor ≥ 0; unidade definida pelo tipo |
| RN04 | Alerta resolvido uma única vez, com quem/quando |
| RN05 | Ponto com dependentes não pode ser excluído |
| RN06 | Admin não exclui a si nem o último admin; registro público só sem usuários |
| RN07 | Operador/Admin lançam e emitem; Engenheiro consulta; Admin gerencia usuários e relatórios |
| RN08 | Boletim emitido é imutável (retrato em JSONB) |

## Dicionário de dados
| Tabela | Propósito | Chaves | Restrições |
|---|---|---|---|
| usuarios | Contas e perfis | PK id | email UNIQUE; perfil CHECK |
| pontos_monitoramento | Locais medidos | PK id | nome UNIQUE; RESTRICT na exclusão |
| limites_seguranca | Limite por tipo | PK id | tipo UNIQUE CHECK |
| detonacoes | Detonações | PK id; FK ponto_id, responsavel_id | identificador UNIQUE |
| medicoes | Leituras | PK id; FK ponto_id, detonacao_id (opcional) | tipo CHECK; valor ≥ 0; índices |
| alertas | Ocorrências | PK id; FK medicao_id, resolvido_por | status CHECK; resolvido_em |
| boletins | Boletins emitidos | PK id; FK emitido_por | periodo_fim ≥ periodo_inicio; conteudo JSONB |

Diagrama: `modelo-de-dados.svg`.
