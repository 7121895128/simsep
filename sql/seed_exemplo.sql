-- SIMSEP - Massa de exemplo para demonstracao e teste de usabilidade
-- Pre-requisitos: schema.sql aplicado E o primeiro administrador ja criado
-- pela tela de login ("Primeiro acesso"). Depois crie, em Usuarios, um
-- operador e um engenheiro para as sessoes de teste.
-- Em banco ja usado, limpe antes: TRUNCATE alertas, medicoes, detonacoes, boletins, pontos_monitoramento RESTART IDENTITY CASCADE;

INSERT INTO pontos_monitoramento (nome,localizacao,descricao) VALUES ('Frente Norte','Bancada 3','lavra'),('Frente Sul','Bancada 1','acesso'),('Britador Primario','Area industrial','ruido'),('Limite da Comunidade','Divisa Sao Jose','referencia');
INSERT INTO detonacoes (identificador,data_hora,ponto_id,responsavel_id) VALUES ('DET-2026-041','2026-10-20 10:30',1,(SELECT min(id) FROM usuarios)),('DET-2026-042','2026-10-24 09:00',2,(SELECT min(id) FROM usuarios)),('DET-2026-043','2026-10-28 14:00',1,(SELECT min(id) FROM usuarios));
INSERT INTO medicoes (ponto_id,detonacao_id,tipo,valor,unidade,data_hora) VALUES
 (1,1,'vibracao',3.2,'mm/s','2026-10-20 11:00'),(1,1,'vibracao',7.4,'mm/s','2026-10-20 11:05'),
 (2,2,'vibracao',1.9,'mm/s','2026-10-24 09:30'),(2,NULL,'ruido',74,'dB','2026-10-22 08:00'),
 (3,NULL,'ruido',92.5,'dB','2026-10-22 19:23'),(3,NULL,'ar',38,'ug/m3','2026-10-23 10:00'),
 (4,NULL,'ar',55.4,'ug/m3','2026-10-22 19:23'),(4,NULL,'vibracao',6.8,'mm/s','2026-10-21 15:00'),
 (1,NULL,'vibracao',4.1,'mm/s','2026-10-13 10:00');
INSERT INTO alertas (medicao_id,mensagem,status,data_hora,resolvido_em,resolvido_por) VALUES
 (2,'Medicao de vibracao (7.4 mm/s) ultrapassou o limite de 5.00 mm/s','aberto','2026-10-20 11:05',NULL,NULL),
 (5,'Medicao de ruido (92.5 dB) ultrapassou o limite de 85.00 dB','aberto','2026-10-22 19:23',NULL,NULL),
 (7,'Medicao de ar (55.4 ug/m3) ultrapassou o limite de 50.00 ug/m3','resolvido','2026-10-22 19:23','2026-10-23 08:00',(SELECT min(id) FROM usuarios)),
 (8,'Medicao de vibracao (6.8 mm/s) ultrapassou o limite de 5.00 mm/s','resolvido','2026-10-21 15:00','2026-10-21 18:30',(SELECT min(id) FROM usuarios));
