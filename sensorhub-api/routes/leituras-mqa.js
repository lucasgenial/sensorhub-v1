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

// POST /api/mqa/leituras/qualidade-ar
router.post('/qualidade-ar', async (req, res) => {
  try {
    const {
      box_id,
      data_leitura,
      temperatura,
      umidade,
      fogo,
      MQ135_Amonia,
      MQ135_Benzeno,
      MQ135_Fumaca,
      MQ2_GLP,
      MQ2_H_2,
      MQ2_CO_2,
      MQ2_Alcool,
      MQ2_Propano,
      MQ9_CO,
      MQ9_Metano
    } = req.body;

    await db.execute(
      `INSERT INTO qualidade_ar (
        box_id, data_leitura, temperatura, umidade, fogo,
        MQ135_Amonia, MQ135_Benzeno, MQ135_Fumaca, MQ2_GLP, MQ2_H_2,
        MQ2_CO_2, MQ2_Alcool, MQ2_Propano, MQ9_CO
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [box_id, data_leitura, temperatura, umidade, fogo, MQ135_Amonia,
        MQ135_Benzeno, MQ135_Fumaca, MQ2_GLP, MQ2_H_2, MQ2_CO_2,
        MQ2_Alcool, MQ2_Propano, MQ9_CO, MQ9_Metano]
    );

    res.status(201).json({ message: 'Leitura registrada com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar leitura:', err);
    res.status(500).json({ error: 'Erro interno ao salvar leitura' });
  }
});

// GET /api/mqa/leituras/qualidade-ar
// Esse endpoint deve retornar as leituras por um filtro de data e ou box_id
// de qualidade do ar, ordenadas pela data de leitura
router.get('/qualidade-ar', async (req, res) => {
  try {
    const {
      box_id,
      sensor,
      inicio,
      fim
    } = req.query;

    let baseQuery = 'SELECT * FROM qualidade_ar WHERE 1=1';
    const params = [];

    if (box_id) {
      baseQuery += ' AND box_id = ?';
      params.push(box_id);
    }

    if (inicio && fim) {
      baseQuery += ' AND data_leitura BETWEEN ? AND ?';
      params.push(inicio, fim);
    }

    baseQuery += ' ORDER BY data_leitura DESC';

    const [rows] = await db.execute(baseQuery, params);

    // Se for solicitado um sensor específico, filtra os dados:
    if (sensor && [
      'MQ135_Amonia',
      'MQ135_Benzeno',
      'MQ135_Fumaca',
      'MQ2_GLP',
      'MQ2_H_2',
      'MQ2_CO_2',
      'MQ2_Alcool',
      'MQ2_Propano',
      'MQ9_CO',
      'MQ9_Metano'
    ].includes(sensor)) {
      const result = rows.map(r => ({
        box_id: r.box_id,
        data_leitura: r.data_leitura,
        [sensor]: r[sensor]
      }));
      return res.json(result);
    }

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar leituras:', err);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/mqa/leituras/qualidade-ar
// Esse endpoint deve retornar as leituras por um filtro de data e ou box_id
// de qualidade do ar, ordenadas pela data de leitura, e com paginação
router.get('/qualidade-ar/filtrado', async (req, res) => {
  try {
    const {
      box_id,
      sensor,
      inicio,
      fim,
      page = 1,     // Padrão de 1 para a primeira página
      limit = 100   // Padrão de 100 leituras por página
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];

    let query = 'SELECT * FROM qualidade_ar WHERE 1=1';

    if (box_id) {
      query += ' AND box_id = ?';
      params.push(box_id);
    }

    if (inicio && fim) {
      query += ' AND data_leitura BETWEEN ? AND ?';
      params.push(inicio, fim);
    }

    query += ' ORDER BY data_leitura DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.execute(query, params);

    // Filtrar apenas um sensor, se solicitado
    if (
      sensor && [
        'MQ135_Amonia',
        'MQ135_Benzeno',
        'MQ135_Fumaca',
        'MQ2_GLP',
        'MQ2_H_2',
        'MQ2_CO_2',
        'MQ2_Alcool',
        'MQ2_Propano',
        'MQ9_CO',
        'MQ9_Metano'
      ].includes(sensor)
    ) {
      const result = rows.map(r => ({
        box_id: r.box_id,
        data_leitura: r.data_leitura,
        [sensor]: r[sensor]
      }));
      return res.json({
        page: parseInt(page),
        limit: parseInt(limit),
        results: result
      });
    }

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      results: rows
    });

  } catch (err) {
    console.error('Erro ao buscar leituras filtradas com paginação:', err);
    res.status(500).json({ error: 'Erro ao buscar dados filtrados' });
  }
});

// GET /api/mqa/leituras/ultima-leitura
// Esse endpoint deve retornar a média das últimas leituras de qualidade do ar
// de todas as boxes, ou de uma box específica, se o box_id for passado como parâmetro
// e a média dos gases tóxicos (mq2, mq9, mq135) e a média de temperatura e umidade
// GET /api/leituras/ultima-leitura
router.get('/ultima-leitura', async (req, res) => {
  try {
    const { box_id } = req.query;

    // Consulta base para última(s) leitura(s)
    let query = `
      SELECT q.*
      FROM qualidade_ar q
      INNER JOIN (
        SELECT box_id, MAX(data_leitura) AS ultima
        FROM qualidade_ar
        ${box_id ? 'WHERE box_id = ?' : ''}
        GROUP BY box_id
      ) ultimas ON q.box_id = ultimas.box_id AND q.data_leitura = ultimas.ultima
    `;

    const [rows] = await db.execute(query, box_id ? [box_id] : []);

    // Se for uma box específica, retorna o dado cru
    if (box_id) {
      return res.json(rows[0] || {});
    }

    // Caso contrário, calcular as médias das últimas leituras de cada box
    const total = rows.length;
    if (total === 0) {
      return res.json({
        total_boxes: 0,
        temperatura_media: 0,
        umidade_media: 0,
        gases_toxicos_media: 0,
        leituras: []
      });
    }

    let somaTemp = 0, somaUmi = 0, somaPres = 0, somaGases = 0;

    rows.forEach(row => {
      somaTemp += row.temperatura;
      somaUmi += row.umidade;
      somaGases += (row.MQ135_Amonia 
                    + row.MQ135_Benzeno 
                    + row.MQ135_Fumaca
                    + row.MQ2_GLP
                    + row.MQ2_H_2
                    + row.MQ2_CO_2
                    + row.MQ2_Alcool
                    + row.MQ2_Propano
                    + row.MQ9_CO
                    + row.MQ9_Metano
                    ) / 10;
    });

    const resultado = {
      total_boxes: total,
      temperatura_media: somaTemp / total,
      umidade_media: somaUmi / total,
      gases_toxicos_media: somaGases / total,
      leituras: rows
    };

    res.json(resultado);

  } catch (err) {
    console.error('Erro ao buscar última leitura:', err);
    res.status(500).json({ error: 'Erro ao buscar última leitura' });
  }
});

// GET /api/mqa/leituras/por-hora?sensor=temperatura&box_id=BOX_01
// Esse endpoint deve retornar a média das leituras de qualidade do ar
// de todas as boxes, ou de uma box específica, se o box_id for passado como parâmetro
// e a média dos gases tóxicos (mq2, mq9, mq135) e a média de temperatura e umidade
// Retornar:
// 📈 media_geral do dia atual (média entre todas as boxes, por hora)
// 📅 dia_atual (valores por hora da box, se box_id for passado)
// 📆 dia_anterior (valores por hora da box, se box_id for passado)
// GET /api/leituras/por-hora?sensor=temperatura&box_id=BOX_01
// GET /api/leituras/por-hora?sensor=temperatura&box_id=BOX_01
router.get('/por-hora', async (req, res) => {
  const { sensor, box_id } = req.query;

  const sensoresValidos = [
    'temperatua',
    'umidade',
    'fogo',
    'MQ135_Amonia',
    'MQ135_Benzeno',
    'MQ135_Fumaca',
    'MQ2_GLP',
    'MQ2_H_2',
    'MQ2_CO_2',
    'MQ2_Alcool',
    'MQ2_Propano',
    'MQ9_CO',
    'MQ9_Metano'
  ];
  if (!sensor || !sensoresValidos.includes(sensor)) {
    return res.status(400).json({ error: 'Parâmetro "sensor" é obrigatório e deve ser válido.' });
  }

  // ⏰ Usa timezone America/Sao_Paulo
  const tz = 'America/Sao_Paulo';

  // Datas formatadas com timezone correto
  const dataHoje = dayjs().tz(tz).format('YYYY-MM-DD');
  const dataOntem = dayjs().tz(tz).subtract(1, 'day').format('YYYY-MM-DD');

  const dataInicioHoje = `${dataHoje} 00:00:00`;
  const dataFimHoje = `${dataHoje} 23:59:59`;

  const dataInicioOntem = `${dataOntem} 00:00:00`;
  const dataFimOntem = `${dataOntem} 23:59:59`;

  try {
    // 🔍 Média geral
    let mediaGeralValor = 0;

    // Se box_id for passado, filtra pela box_id
    let queryMedia = `SELECT AVG(${sensor}) AS valor FROM qualidade_ar WHERE data_leitura BETWEEN ? AND ?`;
    const parametros = [dataInicioHoje, dataFimHoje];

    if (box_id) {
      queryMedia += ' AND box_id = ?';
      parametros.push(box_id);
    }

    // Se box_id for passado, adiciona ao array de parâmetros
    const [mediaGeralResult] = await db.execute(queryMedia, parametros);

    // Se box_id não for passado, calcula a média geral
    if (Array.isArray(mediaGeralResult) && mediaGeralResult.length > 0) {
      const bruto = mediaGeralResult[0].valor;
      if (bruto !== null && !isNaN(bruto)) {
        mediaGeralValor = parseFloat(parseFloat(bruto).toFixed(2));
      } else {
        mediaGeralValor = 0;
      }
    }

    // 🕒 Consultar por hora
    async function consultarPorHora(inicio, fim, sensor, box = null) {
      const query = `
        SELECT HOUR(data_leitura) as hora, AVG(${sensor}) as valor
        FROM qualidade_ar
        WHERE data_leitura BETWEEN ? AND ? ${box ? 'AND box_id = ?' : ''}
        GROUP BY hora
      `;
      const params = box ? [inicio, fim, box] : [inicio, fim];
      const [result] = await db.execute(query, params);
      return result;
    }

    function preencher24Horas(dados) {
      const horas = Array.from({ length: 24 }, (_, h) => ({ hora: h, valor: 0 }));
      dados.forEach(item => {
        const h = parseInt(item.hora);
        const v = parseFloat(item.valor);
        if (!isNaN(h) && h >= 0 && h <= 23 && !isNaN(v)) {
          horas[h].valor = parseFloat(v.toFixed(2));
        }
      });
      return horas;
    }

    const diaAtual = await consultarPorHora(dataInicioHoje, dataFimHoje, sensor, box_id);
    const diaAnterior = await consultarPorHora(dataInicioOntem, dataFimOntem, sensor, box_id);
    const mediaGeral = Array.from({ length: 24 }, (_, h) => ({
      hora: h,
      valor: mediaGeralValor
    }));

    res.json({
      sensor,
      box_id: box_id || null,
      media_geral: mediaGeral,
      dia_atual: preencher24Horas(diaAtual),
      dia_anterior: preencher24Horas(diaAnterior)
    });

  } catch (err) {
    console.error('❌ Erro ao gerar agregações por hora:', err.message);
    res.status(500).json({ error: 'Erro ao gerar agregações por hora.' });
  }
});

// GET /api/mqa/leituras/por-semana?sensor=temperatura&box_id=BOX_01
// Esse endpoint deve retornar a média das leituras de qualidade do ar
// de todas as boxes, ou de uma box específica, se o box_id for passado como parâmetro
// e a média dos gases tóxicos (mq2, mq9, mq135) e a média de temperatura e umidade
// Retornar:
// 📈 media_geral da semana atual (média entre todas as boxes, por dia
// 📅 semana_atual (valores por dia da box, se box_id for passado
// 📆 semana_anterior (valores por dia da box, se box_id for passado)
router.get('/por-semana', async (req, res) => {
  const { sensor, box_id } = req.query;

  const sensoresValidos = [
    'temperatua',
    'umidade',
    'fogo',
    'MQ135_Amonia',
    'MQ135_Benzeno',
    'MQ135_Fumaca',
    'MQ2_GLP',
    'MQ2_H_2',
    'MQ2_CO_2',
    'MQ2_Alcool',
    'MQ2_Propano',
    'MQ9_CO',
    'MQ9_Metano'
  ];
  if (!sensor || !sensoresValidos.includes(sensor)) {
    return res.status(400).json({ error: 'Parâmetro "sensor" é obrigatório e deve ser válido.' });
  }

  const tz = 'America/Sao_Paulo';
  const hoje = dayjs().tz(tz);

  const domingoAtual = hoje.startOf('week');
  const sabadoAtual = hoje.endOf('week');

  const domingoAnterior = domingoAtual.subtract(7, 'day');
  const sabadoAnterior = sabadoAtual.subtract(7, 'day');

  const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  function preencherSemana(dados) {
    const semana = Array.from({ length: 7 }, (_, i) => ({
      dia: diasSemana[i],
      valor: 0
    }));
    dados.forEach(item => {
      const index = parseInt(item.dia_semana) - 1; // 1 = domingo no MySQL
      const valorNum = parseFloat(item.valor);
      if (index >= 0 && index < 7 && !isNaN(valorNum)) {
        semana[index].valor = parseFloat(valorNum.toFixed(2));
      }
    });
    return semana;
  }

  try {
    const baseQuery = `
      SELECT DAYOFWEEK(data_leitura) AS dia_semana, AVG(${sensor}) AS valor
      FROM qualidade_ar
      WHERE data_leitura BETWEEN ? AND ? ${box_id ? 'AND box_id = ?' : ''}
      GROUP BY dia_semana
    `;

    const paramsAtual = box_id ? [domingoAtual.format('YYYY-MM-DD 00:00:00'), sabadoAtual.format('YYYY-MM-DD 23:59:59'), box_id]
      : [domingoAtual.format('YYYY-MM-DD 00:00:00'), sabadoAtual.format('YYYY-MM-DD 23:59:59')];
    const [resultadoAtual] = await db.execute(baseQuery, paramsAtual);
    const semana = preencherSemana(resultadoAtual);

    const paramsAnterior = box_id ? [domingoAnterior.format('YYYY-MM-DD 00:00:00'), sabadoAnterior.format('YYYY-MM-DD 23:59:59'), box_id]
      : [domingoAnterior.format('YYYY-MM-DD 00:00:00'), sabadoAnterior.format('YYYY-MM-DD 23:59:59')];
    const [resultadoAnterior] = await db.execute(baseQuery, paramsAnterior);
    const semanaAnterior = preencherSemana(resultadoAnterior);

    // 🔍 Média geral da semana atual
    const queryMedia = `SELECT AVG(${sensor}) AS valor FROM qualidade_ar WHERE data_leitura BETWEEN ? AND ? ${box_id ? 'AND box_id = ?' : ''}`;
    const mediaParams = paramsAtual;
    const [mediaResult] = await db.execute(queryMedia, mediaParams);

    let mediaGeral = 0;
    if (mediaResult?.[0]?.valor !== null && !isNaN(mediaResult[0].valor)) {
      mediaGeral = parseFloat(parseFloat(mediaResult[0].valor).toFixed(2));
    }
    const media_geral = Array.from({ length: 7 }, (_, i) => ({
      dia: diasSemana[i],
      valor: mediaGeral
    }));

    res.json({
      sensor,
      box_id: box_id || null,
      semana,
      semana_anterior: semanaAnterior,
      media_geral
    });

  } catch (err) {
    console.error('❌ Erro ao gerar dados da semana:', err.message);
    res.status(500).json({ error: 'Erro ao gerar dados da semana.' });
  }
});


// GET /api/mqa/leituras/por-intervalo?sensor=temperatura&box_id=BOX_01&data_inicio=2023-10-01&data_fim=2023-10-07
// Esse endpoint deve retornar a média das leituras de qualidade do ar
// de todas as boxes, ou de uma box específica, se o box_id for passado como parâmetro
// e a média dos gases tóxicos (mq2, mq9, mq135) e a média de temperatura e umidade
// Retornar:
// 📈 media_geral do intervalo (média entre todas as boxes, por dia
// 📅 intervalo (valores por dia da box, se box_id for passado)
// 📆 intervalo_anterior (valores por dia da box, se box_id for passado)
router.get('/por-intervalo', async (req, res) => {
  const { sensor, box_id, data_inicio, data_fim } = req.query;

  const sensoresValidos = [
    'temperatua',
    'umidade',
    'fogo',
    'MQ135_Amonia',
    'MQ135_Benzeno',
    'MQ135_Fumaca',
    'MQ2_GLP',
    'MQ2_H_2',
    'MQ2_CO_2',
    'MQ2_Alcool',
    'MQ2_Propano',
    'MQ9_CO',
    'MQ9_Metano'
  ];
  if (!sensor || !sensoresValidos.includes(sensor)) {
    return res.status(400).json({ error: 'Parâmetro "sensor" é obrigatório e deve ser válido.' });
  }

  if (!data_inicio || !data_fim) {
    return res.status(400).json({ error: 'Parâmetros "data_inicio" e "data_fim" são obrigatórios.' });
  }

  try {
    const query = `
      SELECT DATE(data_leitura) as data, AVG(${sensor}) as valor
      FROM qualidade_ar
      WHERE data_leitura BETWEEN ? AND ?
      ${box_id ? 'AND box_id = ?' : ''}
      GROUP BY DATE(data_leitura)
      ORDER BY DATE(data_leitura)
    `;

    const params = box_id
      ? [`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`, box_id]
      : [`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`];

    const [result] = await db.execute(query, params);

    const dias = gerarDatasNoIntervalo(data_inicio, data_fim);

    // Criar mapa das datas válidas vindas da consulta
    const map = {};
    result.forEach(r => {
      const dataISO = r.data instanceof Date ? r.data.toISOString().slice(0, 10) : r.data;
      map[dataISO] = parseFloat(r.valor);
    });

    const intervalo = dias.map(dia => ({
      data: formatarDataBR(dia),
      valor: map[dia] ? parseFloat(map[dia].toFixed(2)) : 0
    }));

    // Calcular média geral (apenas dos valores não nulos)
    const soma = result.reduce((acc, cur) => acc + (cur.valor || 0), 0);
    const mediaValor = result.length > 0 ? soma / result.length : 0;

    // Criar linha da média geral como reta
    const media_geral = dias.map(dia => ({
      data: formatarDataBR(dia),
      valor: parseFloat(mediaValor.toFixed(2))
    }));

    res.json({
      sensor,
      box_id: box_id || null,
      intervalo,
      media_geral
    });

  } catch (err) {
    console.error('❌ Erro ao gerar dados por intervalo:', err.message);
    res.status(500).json({ error: 'Erro ao gerar dados por intervalo.' });
  }
});

// Utilitários

function gerarDatasNoIntervalo(inicio, fim) {
  const lista = [];
  let atual = new Date(inicio);
  const final = new Date(fim);
  while (atual <= final) {
    lista.push(atual.toISOString().slice(0, 10));
    atual.setDate(atual.getDate() + 1);
  }
  return lista;
}

function formatarDataBR(dataISO) {
  const [y, m, d] = dataISO.split('-');
  return `${d}/${m}/${y}`;
}

// ✅ correto para CommonJS:
module.exports = router;