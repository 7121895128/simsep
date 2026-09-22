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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SIMSEP rodando na porta ${PORT}`);
});
