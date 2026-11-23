# SIMSEP — Roteiro de fala (≈ 12 min + demo 3 min)

**Antes de começar:** `npm start` rodando · logado como admin em uma aba · `publico.html` aberto no celular (mesma rede Wi-Fi, `http://IP-do-PC:3000/publico.html`) · PowerShell aberto na pasta do projeto.

| Slide | Tempo | O que falar |
|---|---|---|
| 1 Capa | 20 s | "SIMSEP: sistema de monitoramento de segurança em pedreiras. Vou mostrar o problema, o sistema, como ele é feito e como foi testado." |
| 2 Problema | 1 min | Detonação perto de bairro. Limites legais existem, mas medição fica em planilha, alerta depende de alguém olhar, morador não sabe de nada. Três dores: pedreira, comunidade, gestão. |
| 3 Solução | 1 min | Quatro perfis, um canal público. Destaque: **toda medição acima do limite gera alerta automático na mesma transação** — é a regra central. |
| 4 Números | 30 s | Ler rápido: 12 telas, 30 endpoints, 18 regras, 85 testes, 5 usuários, 18 commits. |
| 5–8 Telas | 3 min | Um ponto por tela: login/painel (atrasado e crítico) · histórico com gráfico e CSV · relatório e limites editáveis · boletim e painel no celular. **Avisar que vai mostrar ao vivo no final.** |
| 9 Arquitetura | 1 min | Três camadas. Frase-chave: "regra crítica vale em mais de uma camada: tela orienta, API valida, banco garante". |
| 10 Regras | 1 min | Não ler as 18. Citar 3: RN02 (alerta na transação), RN14 (crítico > 150% exige observação), RN15 (detonação só dia útil 8–17h com 24 h de aviso). Dizer que RN13–18 são da última versão. |
| 11 Testes | 1,5 min | 85 testes. **A parte mais forte:** 9 testes falharam de propósito e revelaram 5 bugs reais — citar CSV injection e data 30/02. Commits do antes/depois estão no GitHub. |
| 12 Usuários | 1,5 min | 5 pessoas, SUS 73,5. Moradora não achou o boletim no celular → virou prioridade 1 e foi corrigido. Os 6 problemas viraram 6 correções. |
| 13 Evolução | 40 s | Linha do tempo das entregas. Tudo rastreável no GitHub. |
| 14 Aprendizados | 40 s | Escolher dois: "testes acham o que a gente não vê" e "usuário real muda prioridade". |
| 15 Próximos passos | 30 s | Notificação de alerta, API para sensores, deploy. |
| 16 Perguntas | — | — |

## Demo ao vivo (3 min) — ordem

1. **Medições** → lançar vibração `7,4` (com vírgula) na Frente Norte → mensagem vermelha "Alerta gerado (+48%)".
2. Lançar `9` → alerta **crítico**. Ir em **Alertas**, clicar "Marcar como resolvido" → pede observação; cancelar.
3. Filtrar histórico da última semana → gráfico com linha do limite; clicar **Exportar CSV**.
4. **Limites** → mostrar histórico de alterações (não precisa alterar).
5. **Detonações** → tentar cadastrar para hoje às 20h → bloqueado com a mensagem da regra.
6. Celular: painel público → cartões, boletim.
7. PowerShell: `npm test` → `# pass 55`.

## Perguntas prováveis

- **"Por que não usou framework (React, etc.)?"** Projeto de uma pessoa, foco em regras e testes; HTML/JS puro reduziu dependência e deu controle total. Gráficos em SVG mostram que dá para fazer sem biblioteca.
- **"Como garante que o alerta nunca falta?"** Transação: BEGIN → medição → limite → alerta → COMMIT. Se o alerta falhar, a medição é desfeita (ROLLBACK). Testado em `api.test.js`.
- **"E se mudar o limite, os alertas antigos mudam?"** Não. O nível é calculado e gravado na hora da medição (RN13). O histórico de limites registra quem mudou e por quê.
- **"Os testes rodam onde?"** `npm test` roda sem banco em 0,3 s. Os de integração sobem a API com o PostgreSQL real.
- **"Segurança?"** Senha com bcrypt, JWT 8 h, perfil checado em toda rota, dado escapado contra XSS, SQL parametrizado, CSV protegido contra fórmula, painel público sem dado pessoal.
- **"O que faltou?"** Notificação ativa (e-mail/WhatsApp), recuperação de senha, deploy em nuvem.
