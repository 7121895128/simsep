-- SIMSEP - Migração da Sprint 1 (19 a 25/10/2026)
-- Execute depois de sql/schema.sql em bancos já existentes.

-- US06/US10: rastreabilidade da resolução de alertas (quem resolveu e quando)
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP;
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS resolvido_por INTEGER REFERENCES usuarios(id);

-- Correção: medições negativas eram aceitas pelo banco
ALTER TABLE medicoes DROP CONSTRAINT IF EXISTS medicoes_valor_positivo;
ALTER TABLE medicoes ADD CONSTRAINT medicoes_valor_positivo CHECK (valor >= 0);

-- Correção: excluir um ponto com medições/detonações gerava erro 500.
-- Mantém a integridade (RESTRICT) mas com nome explícito para tratamento na API.
ALTER TABLE medicoes DROP CONSTRAINT IF EXISTS medicoes_ponto_id_fkey;
ALTER TABLE medicoes ADD CONSTRAINT medicoes_ponto_id_fkey
  FOREIGN KEY (ponto_id) REFERENCES pontos_monitoramento(id) ON DELETE RESTRICT;

-- US09: índices para consulta de histórico por período e ponto
CREATE INDEX IF NOT EXISTS idx_medicoes_data_hora ON medicoes (data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_medicoes_ponto_tipo ON medicoes (ponto_id, tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas (status);
CREATE INDEX IF NOT EXISTS idx_detonacoes_data_hora ON detonacoes (data_hora);

-- US07: boletins periódicos emitidos (histórico do que foi publicado para a comunidade)
CREATE TABLE IF NOT EXISTS boletins (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  resumo TEXT NOT NULL,
  conteudo JSONB NOT NULL,
  emitido_por INTEGER NOT NULL REFERENCES usuarios(id),
  emitido_em TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT boletins_periodo_valido CHECK (periodo_fim >= periodo_inicio)
);
CREATE INDEX IF NOT EXISTS idx_boletins_emitido_em ON boletins (emitido_em DESC);
