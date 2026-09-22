# SIMSEP

Sistema de Monitoramento e Controle de Seguranca em Pedreiras.

## Como rodar

1. `npm install`
2. Criar o banco `simsep` no PostgreSQL e rodar `sql/schema.sql`
3. Copiar `.env.example` para `.env` e preencher com os dados do seu banco
4. `npm start`
5. Acessar `http://localhost:3000`

Crie o primeiro usuario pelo endpoint `POST /api/auth/registrar` (email, senha, nome, perfil: operador, engenheiro ou admin).
