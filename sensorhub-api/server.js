// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

app.use(cors());
app.use(bodyParser.json());

// MODULO DE LEITURAS E LISTAS MQA

// Importar rotas de Leituras
const rotasLeiturasMQA = require('./routes/leituras-mqa.js'); // Rotas para os leituras
app.use('/api/mqa/leituras/', rotasLeiturasMQA); // Definindo a rota base para os leituras

// Importar rotas de Listas
const rotasListasMQA = require('./routes/listas-mqa.js'); // Rotas para os listas
app.use('/api/mqa/listas/', rotasListasMQA); // Definindo a rota base para os listas

// Importar rotas de Alertas
const rotasAlertasMQA = require('./routes/alertas'); // Rotas para os alertas
app.use('/api/mqa/alertas', rotasAlertasMQA); // Definindo a rota base para os alertas


// MODULO DE LEITURAS E LISTAS MHE

// Importar rotas de Leituras MHE
const rotasLeiturasMHE = require('./routes/leituras-mhe.js'); // Rotas para os leituras
app.use('/api/mhe/leituras/horta/', rotasLeiturasMHE); // Definindo a rota base para os leituras

// Importar rotas de Leituras MHE
const rotasBombaMHE = require('./routes/bomba-mhe.js'); // Rotas para os leituras
app.use('/api/mhe/bomba/', rotasBombaMHE); // Definindo a rota base para os leituras

// Importar rotas de Listas MHE
const rotasListasMHE = require('./routes/listas-mhe.js'); // Rotas para os listas
app.use('/api/mhe/listas/', rotasListasMHE); // Definindo a rota base para os listas

app.listen(process.env.PORT_APP, () => {
  console.log(`SensorHub rodando em http://localhost:${process.env.PORT_APP}`);
});
