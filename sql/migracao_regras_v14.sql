-- SIMSEP - Migração 1.4: regras de negócio do domínio (RN13 a RN18)

-- RN13: limites editáveis com histórico de alterações
ALTER TABLE limites_seguranca ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP;
ALTER TABLE limites_seguranca ADD COLUMN IF NOT EXISTS atualizado_por INTEGER REFERENCES usuarios(id);
ALTER TABLE limites_seguranca DROP CONSTRAINT IF EXISTS limites_valor_positivo;
ALTER TABLE limites_seguranca ADD CONSTRAINT limites_valor_positivo CHECK (valor_limite > 0);

CREATE TABLE IF NOT EXISTS limites_historico (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  valor_anterior NUMERIC(10,2),
  valor_novo NUMERIC(10,2) NOT NULL,
  alterado_por INTEGER NOT NULL REFERENCES usuarios(id),
  alterado_em TIMESTAMP NOT NULL DEFAULT now(),
  motivo TEXT
);

-- RN14: nível do alerta e observação da resolução
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS nivel VARCHAR(10) NOT NULL DEFAULT 'alto';
ALTER TABLE alertas DROP CONSTRAINT IF EXISTS alertas_nivel_valido;
ALTER TABLE alertas ADD CONSTRAINT alertas_nivel_valido CHECK (nivel IN ('alto','critico'));
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS resolucao_obs TEXT;

-- Reclassifica alertas já existentes (crítico = valor > 150% do limite)
UPDATE alertas a SET nivel = 'critico'
FROM medicoes m JOIN limites_seguranca l ON l.tipo = m.tipo
WHERE a.medicao_id = m.id AND m.valor > l.valor_limite * 1.5 AND a.nivel <> 'critico';

-- RN17: um boletim por período
CREATE UNIQUE INDEX IF NOT EXISTS uq_boletins_periodo ON boletins (periodo_inicio, periodo_fim);
