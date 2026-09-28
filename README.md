# SIMSEP

Sistema de Monitoramento e Controle de Seguranca em Pedreiras.

## Como rodar

1. `npm install`
2. Criar o banco `simsep` no PostgreSQL e rodar `sql/schema.sql`
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
