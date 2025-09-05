const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const localeDataPlugin = require('dayjs/plugin/localeData');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localeDataPlugin);
dayjs.locale('pt-br');

// GET /api/mhe/leituras/bomba/
// Esse endpoint deve receber as leituras dos sensores instalados na bomba
// e registrar no banco de dados
// Esse endpoint deve registrar os eventos da bomba
router.post('/', async (req, res) => {
    try {
        const { data_evento, status, origem } = req.body;

        if (!data_evento || !status) {
            return res.status(400).json({ erro: 'Campos obrigatórios: data_evento e status' });
        }

        await db.execute(
            `INSERT INTO bomba_eventos (data_evento, status, origem)
         VALUES (?, ?, ?)`,
            [data_evento, status, origem || null]
        );

        res.status(201).json({ mensagem: 'Evento da bomba registrado com sucesso!' });
    } catch (erro) {
        console.error('Erro ao registrar evento da bomba:', erro);
        res.status(500).json({ erro: 'Erro ao registrar evento da bomba' });
    }
});

// GET /api/mhe/leituras/bomba/
// Esse endpoint deve retornar as leituras da bomba
// e deve ser utilizado para verificar o status atual da bomba
// e se a bomba está ligada ou desligada
// Esse endpoint deve retornar as leituras da bomba
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT * FROM bomba_eventos`;
        const params = [];

        if (status) {
            query += ` WHERE status = ? ORDER BY data_evento DESC`;
            params.push(status);
        } else {
            query += ` ORDER BY data_evento DESC`;
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (erro) {
        console.error('Erro ao buscar leituras da bomba:', erro);
        res.status(500).json({ erro: 'Erro ao buscar leituras da bomba' });
    }
});

// GET /api/mhe/leituras/bomba/ultima
// Esse endpoint deve retornar a última leitura da bomba
// e deve ser utilizado para verificar o status atual da bomba
// e se a bomba está ligada ou desligada
router.get('/ultima', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM bomba_eventos ORDER BY data_evento DESC LIMIT 1`
        );

        if (rows.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhuma leitura encontrada' });
        }

        res.json(rows[0]);
    } catch (erro) {
        console.error('Erro ao buscar última leitura da bomba:', erro);
        res.status(500).json({ erro: 'Erro ao buscar última leitura' });
    }
});

// GET /api/mhe/bomba/status
// Esse endpoint deve retornar o status atual da bomba
// e deve ser utilizado para verificar o status atual da bomba
// e se a bomba está ligada ou desligada
router.get('/status', async (req, res) => {
    try {
        const [resultado] = await db.execute(`
        SELECT status, data_evento, origem
        FROM bomba_eventos
        ORDER BY data_evento DESC
        LIMIT 1
      `);

        if (resultado.length === 0) {
            return res.status(404).json({ error: 'Nenhum status de bomba registrado ainda.' });
        }

        res.json({
            status: resultado[0].status,
            data_evento: new Date(resultado[0].data_evento).toISOString(),
            origem: resultado[0].origem
        });

    } catch (err) {
        console.error('Erro ao buscar status da bomba:', err);
        res.status(500).json({ error: 'Erro interno ao buscar status da bomba.' });
    }
});

// ✅ correto para CommonJS:
module.exports = router;