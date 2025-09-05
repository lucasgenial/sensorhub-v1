const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Middleware para servir arquivos estáticos
app.use('/mqa/', express.static(path.join(__dirname, 'public')));

// Rota para servir index.html

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Inicializa servidor
app.listen(PORT, () => {
  console.log(`SensorHub Dashboard rodando em http://localhost:${PORT}/mqa`);
});
