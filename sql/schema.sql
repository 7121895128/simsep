CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(30) NOT NULL CHECK (perfil IN ('operador','engenheiro','admin')),
  criado_em TIMESTAMP DEFAULT now()
);

CREATE TABLE pontos_monitoramento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL UNIQUE,
  localizacao VARCHAR(200) NOT NULL,
  descricao TEXT
);

CREATE TABLE detonacoes (
  id SERIAL PRIMARY KEY,
  identificador VARCHAR(50) UNIQUE NOT NULL,
  data_hora TIMESTAMP NOT NULL,
  ponto_id INTEGER NOT NULL REFERENCES pontos_monitoramento(id),
  responsavel_id INTEGER NOT NULL REFERENCES usuarios(id),
  descricao TEXT
);

CREATE TABLE limites_seguranca (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(30) UNIQUE NOT NULL CHECK (tipo IN ('vibracao','ruido','ar')),
  valor_limite NUMERIC(10,2) NOT NULL,
  unidade VARCHAR(15) NOT NULL
);

CREATE TABLE medicoes (
  id SERIAL PRIMARY KEY,
  ponto_id INTEGER NOT NULL REFERENCES pontos_monitoramento(id),
  detonacao_id INTEGER REFERENCES detonacoes(id),
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('vibracao','ruido','ar')),
  valor NUMERIC(10,2) NOT NULL,
  unidade VARCHAR(15) NOT NULL,
  data_hora TIMESTAMP DEFAULT now(),
  CONSTRAINT medicoes_valor_positivo CHECK (valor >= 0)
);

CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes(id),
  mensagem TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','resolvido')),
  data_hora TIMESTAMP DEFAULT now(),
  resolvido_em TIMESTAMP,
  resolvido_por INTEGER REFERENCES usuarios(id)
);

-- Boletins periodicos emitidos para a comunidade (US07)
CREATE TABLE boletins (
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

CREATE INDEX idx_medicoes_data_hora ON medicoes (data_hora DESC);
CREATE INDEX idx_medicoes_ponto_tipo ON medicoes (ponto_id, tipo);
CREATE INDEX idx_alertas_status ON alertas (status);
CREATE INDEX idx_detonacoes_data_hora ON detonacoes (data_hora);
CREATE INDEX idx_boletins_emitido_em ON boletins (emitido_em DESC);

INSERT INTO limites_seguranca (tipo, valor_limite, unidade) VALUES
('vibracao', 5.00, 'mm/s'),
('ruido', 85.00, 'dB'),
('ar', 50.00, 'ug/m3');
