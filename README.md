# SIMSEP

Sistema de Monitoramento e Controle de Seguranca em Pedreiras.

## Como rodar

1. `npm install`
2. Criar o banco `simsep` no PostgreSQL e rodar `sql/schema.sql` (banco já existente de versões anteriores: rodar apenas `sql/migracao_sprint1.sql`)
3. Copiar `.env.example` para `.env` e preencher com os dados do seu banco
4. `npm start`
5. Acessar `http://localhost:3000`

## Primeiro acesso

O endpoint `POST /api/auth/registrar` só funciona **uma vez**, enquanto o banco não tiver nenhum usuário — ele cria automaticamente o primeiro administrador. Depois disso, esse endpoint fica bloqueado e novos usuários só podem ser criados pela tela **Usuários** (menu visível somente para quem está logado como admin).

Exemplo do primeiro cadastro (PowerShell):

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/auth/registrar -Method Post -ContentType "application/json" -Body '{"nome":"Seu Nome","email":"admin@simsep.com","senha":"123456"}'
```

## Painel público

`http://localhost:3000/publico.html` não exige login e mostra, para a comunidade, as próximas detonações e as leituras atuais de vibração, ruído e qualidade do ar.

## Perfis e permissões

| Ação | Operador | Engenheiro | Admin |
|---|---|---|---|
| Consultar painel, pontos, detonações, histórico e alertas | ✔ | ✔ | ✔ |
| Cadastrar pontos, detonações e medições; resolver alertas | ✔ | — | ✔ |
| Emitir boletins periódicos | ✔ | — | ✔ |
| Relatórios gerenciais | — | — | ✔ |
| Gerenciar usuários | — | — | ✔ |

## Testes

```bash
npm test                 # testes unitários (regras de negócio, sem banco)
npm run test:integracao  # testes de API — exige servidor rodando (npm start) e banco com o schema aplicado
```

Os testes de integração criam o primeiro admin automaticamente em um banco vazio. Em um banco que já tem usuários, informe um admin existente: `ADMIN_EMAIL=... ADMIN_SENHA=... npm run test:integracao`.

## Documentação

Os artefatos do projeto (requisitos, modelo de dados, casos de uso, plano de testes e registros das Sprints) ficam na pasta `docs/`.
