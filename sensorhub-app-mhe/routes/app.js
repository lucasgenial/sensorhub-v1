const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// GET - Dados por sensor
router.get('/dados', (req, res) => {
  res.json(dados);
});

module.exports = router;
