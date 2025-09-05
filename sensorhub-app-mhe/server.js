const express = require('express');
const path = require('path');

const app = express();
const PORT = 3004;

// Middleware para servir arquivos estáticos
app.use('/mhe/', express.static(path.join(__dirname, 'public')));

// Rota para servir index.html

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

/*
app.get('*', (req, res) => {
  console.log('Rota não encontrada:', req.originalUrl);
  res.status(404).send('Arquivo não encontrado');
});*/

// Inicializa servidor
app.listen(PORT, () => {
  console.log(`SensorHub Dashboard rodando em http://localhost:${PORT}/mqa`);
});
