const express = require('express');
const router = express.Router();
const db = require('../db');
const dotenv = require('dotenv');

// GET /api/listas/boxes
// Retorna uma lista de IDs de boxes
// Exemplo de uso: GET /api/listas/boxes
// Resposta: [1, 2, 3, ...]
router.get('/boxes', async (req, res) => {
  try {
    const [result] = await db.execute('SELECT DISTINCT box_id FROM qualidade_ar ORDER BY box_id');
    res.json(result.map(r => r.box_id));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar boxes.' });
  }
});

// ✅ correto para CommonJS:
module.exports = router;
