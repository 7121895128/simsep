-- SIMSEP - Migração da Entrega 4 (Testes e validação)
-- DEF-04: e-mails passam a ser normalizados (minúsculas, sem espaços) no cadastro e no login.
-- Normaliza os já existentes para que continuem conseguindo entrar.
UPDATE usuarios SET email = lower(trim(email)) WHERE email <> lower(trim(email));
