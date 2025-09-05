// Arquivo para conectar ao banco de dados MySQL
// Este arquivo é responsável por estabelecer a conexão com o banco de dados MySQL
// Importando o módulo mysql2
// O mysql2 é um driver para Node.js que permite conectar-se a bancos de dados MySQL e MariaDB

// Importando o módulo mysql2
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Importando o módulo dotenv para carregar variáveis de ambiente
// O dotenv é um módulo que carrega variáveis de ambiente a partir de um arquivo .env
// Isso é útil para manter informações sensíveis, como senhas, fora do código-fonte
// Importando o módulo dotenv
dotenv.config();

// Criando pool de conexões (mais recomendado que connection única)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// ✅ correto para CommonJS:
module.exports = pool;