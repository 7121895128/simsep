-- SIMSEP - Migração 1.5 (US16): troca de senha obrigatória após redefinição pelo admin
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS trocar_senha BOOLEAN NOT NULL DEFAULT FALSE;
