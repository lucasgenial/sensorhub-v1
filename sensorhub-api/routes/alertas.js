const express = require('express');
const router = express.Router();
const db = require('../db');
const dotenv = require('dotenv');

// POST /api/alertas → registra um novo alerta
router.post('/', async (req, res) => {
  try {
    const { box_id, sensor, valor, nivel, mensagem } = req.body;

    await db.execute(
      'INSERT INTO alertas (box_id, sensor, valor, nivel, mensagem) VALUES (?, ?, ?, ?, ?)',
      [box_id, sensor, valor, nivel, mensagem]
    );

    res.status(201).json({ message: 'Alerta registrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar alerta:', err);
    res.status(500).json({ error: 'Erro interno ao salvar alerta' });
  }
});

// GET /api/alertas → retorna os últimos alertas
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM alertas ORDER BY timestamp DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar alertas:', err);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// GET /api/alertas/box/:box_id → retorna alertas por box_id
router.get('/box/:box_id', async (req, res) => {
  try {
    const { box_id } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM alertas WHERE box_id = ? ORDER BY timestamp DESC',
      [box_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar alertas por box:', err);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// GET /api/alertas/sensor/:sensor → retorna alertas por sensor
router.get('/sensor/:sensor', async (req, res) => {
  try {
    const { sensor } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM alertas WHERE sensor = ? ORDER BY timestamp DESC',
      [sensor]
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar alertas por sensor:', err);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// ✅ correto para CommonJS:
module.exports = router;
