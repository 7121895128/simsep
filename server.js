const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pontosRoutes = require('./routes/pontos');
const detonacoesRoutes = require('./routes/detonacoes');
const medicoesRoutes = require('./routes/medicoes');
const alertasRoutes = require('./routes/alertas');
const dashboardRoutes = require('./routes/dashboard');
const publicoRoutes = require('./routes/publico');
const usuariosRoutes = require('./routes/usuarios');
const relatoriosRoutes = require('./routes/relatorios');
const boletinsRoutes = require('./routes/boletins');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/pontos', pontosRoutes);
app.use('/api/detonacoes', detonacoesRoutes);
app.use('/api/medicoes', medicoesRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/publico', publicoRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/boletins', boletinsRoutes);

// Rota de saude usada pelos testes de integracao
app.get('/api/saude', (req, res) => res.json({ ok: true, versao: require('./package.json').version }));

// Qualquer /api desconhecida responde JSON (antes devolvia HTML do express)
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota nao encontrada' }));

const PORT = process.env.PORT || 3000;

// Exporta o app para os testes; so escuta a porta quando executado diretamente.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SIMSEP rodando na porta ${PORT}`);
  });
}

module.exports = app;
