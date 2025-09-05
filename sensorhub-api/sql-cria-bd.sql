-- Recriar o banco de dados (cuidado: isso apagará tudo)
DROP DATABASE IF EXISTS sensorhub;
CREATE DATABASE sensorhub;
USE sensorhub;

-- Criar tabela atualizada para leitura da qualidade do ar
CREATE TABLE qualidade_ar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  box_id VARCHAR(50) NOT NULL,
  data_leitura DATETIME NOT NULL,
  temperatura FLOAT,
  umidade FLOAT,
  fogo BOOLEAN,  -- 0 ou 1, para sensor de chama digital

  MQ135_Amonia FLOAT,
  MQ135_Benzeno FLOAT,
  MQ135_Fumaca FLOAT,

  MQ2_GLP FLOAT,
  MQ2_H_2 FLOAT,
  MQ2_CO_2 FLOAT,
  MQ2_Alcool FLOAT,
  MQ2_Propano FLOAT,

  MQ9_CO FLOAT,
  MQ9_Metano FLOAT,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 2: horta_leituras (para projeto MHE - solo irrigado)
CREATE TABLE IF NOT EXISTS horta_leituras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  box_id VARCHAR(50) NOT NULL,
  data_leitura DATETIME NOT NULL,
  temperatura FLOAT,
  umidade_ar FLOAT,
  umidade_solo_irrigado FLOAT,
  umidade_solo_nao_irrigado FLOAT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 3: bomba_eventos (registro dos acionamentos da bomba)
CREATE TABLE IF NOT EXISTS bomba_eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  box_id VARCHAR(50) NOT NULL,
  status ENUM('LIGADA', 'DESLIGADA') NOT NULL,
  data_evento DATETIME NOT NULL,
  origem ENUM('automático', 'manual') DEFAULT 'automático',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Para tabela qualidade_ar
CREATE INDEX idx_qualidade_ar_box_data ON qualidade_ar(box_id, data_leitura);

-- Para horta_leituras
CREATE INDEX idx_horta_leituras_box_data ON horta_leituras(box_id, data_leitura);

-- Para eventos da bomba
CREATE INDEX idx_bomba_eventos_box_data ON bomba_eventos(box_id, data_evento);