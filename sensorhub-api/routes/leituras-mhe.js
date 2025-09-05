const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const localeDataPlugin = require('dayjs/plugin/localeData');
const sensoresValidos = ['solo_umido', 'solo_seco', 'temperatura', 'umidade_ar'];
const tz = 'America/Sao_Paulo';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localeDataPlugin);
dayjs.locale('pt-br');

// POST /api/mhe/leituras/horta
// Esse endpoint deve receber as leituras dos sensores instalados na horta
// e registrar no banco de dados
router.post('/', async (req, res) => {
  try {
    const {
      data_leitura,
      solo_seco,
      solo_umido,
      temperatura,
      umidade_ar
    } = req.body;

    if (!data_leitura) {
      return res.status(400).json({ erro: 'data_leitura é obrigatória' });
    }

    await db.execute(
      `INSERT INTO horta_leituras (
        data_leitura, solo_seco, solo_umido, temperatura, umidade_ar
      ) VALUES (?, ?, ?, ?, ?)`,
      [data_leitura, solo_seco, solo_umido, temperatura, umidade_ar]
    );

    res.status(201).json({ mensagem: 'Leitura registrada com sucesso!' });
  } catch (erro) {
    console.error('Erro ao registrar leitura da horta:', erro);
    res.status(500).json({ erro: 'Erro ao registrar leitura' });
  }
});

// GET /api/mhe/leituras/horta
// Esse endpoint deve retornar as leituras da horta
router.get('/', async (req, res) => { });

// GET /api/mhe/leituras/horta/filtrado
router.get('/filtrado', async (req, res) => { });

// GET /api/mhe/leituras/horta/ultima-leitura
// Esse endpoint deve retornar a última leitura da horta
router.get('/ultima-leitura', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM horta_leituras ORDER BY data_leitura DESC LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Nenhuma leitura encontrada' });
    }

    res.json(rows[0]);
  } catch (erro) {
    console.error('Erro ao buscar última leitura da horta:', erro);
    res.status(500).json({ erro: 'Erro ao buscar última leitura' });
  }
});

// GET /api/mhe/leituras/horta/por-hora?sensor=solo_umido
router.get('/por-hora', async (req, res) => {
  const { sensor } = req.query;
  const sensoresValidos = ['temperatura', 'umidade_ar', 'solo_umido', 'solo_seco'];
  if (!sensor || !sensoresValidos.includes(sensor)) {
    return res.status(400).json({ error: 'Parâmetro "sensor" é obrigatório e válido.' });
  }

  const tz = 'America/Sao_Paulo';
  const dataHoje = dayjs().tz(tz).format('YYYY-MM-DD');
  const dataOntem = dayjs().tz(tz).subtract(1, 'day').format('YYYY-MM-DD');

  const inicioHoje = `${dataHoje} 00:00:00`;
  const fimHoje = `${dataHoje} 23:59:59`;

  const inicioOntem = `${dataOntem} 00:00:00`;
  const fimOntem = `${dataOntem} 23:59:59`;

  try {
    function preencher24Horas(dados) {
      const horas = Array.from({ length: 24 }, (_, h) => ({ hora: h, valor: 0 }));
      dados.forEach(({ hora, valor }) => {
        const h = parseInt(hora);
        const v = parseFloat(valor);
        if (!isNaN(h) && !isNaN(v)) horas[h].valor = parseFloat(v.toFixed(2));
      });
      return horas;
    }

    const [diaAtualRaw] = await db.execute(
      `SELECT HOUR(data_leitura) as hora, AVG(${sensor}) as valor
       FROM horta_leituras
       WHERE data_leitura BETWEEN ? AND ?
       GROUP BY HOUR(data_leitura)`, [inicioHoje, fimHoje]
    );

    const [diaAnteriorRaw] = await db.execute(
      `SELECT HOUR(data_leitura) as hora, AVG(${sensor}) as valor
       FROM horta_leituras
       WHERE data_leitura BETWEEN ? AND ?
       GROUP BY HOUR(data_leitura)`, [inicioOntem, fimOntem]
    );

    const diaAtual = preencher24Horas(diaAtualRaw);
    const diaAnterior = preencher24Horas(diaAnteriorRaw);

    // Calcular média geral com base apenas nas horas do diaAtual
    const soma = diaAtual.reduce((acc, cur) => acc + cur.valor, 0);
    const count = diaAtual.filter(d => d.valor > 0).length;
    const mediaValor = count > 0 ? soma / count : 0;

    const media_geral = Array.from({ length: 24 }, (_, h) => ({
      hora: h,
      valor: parseFloat(mediaValor.toFixed(2))
    }));

    res.json({ sensor, dia_atual: diaAtual, dia_anterior: diaAnterior, media_geral });

  } catch (err) {
    console.error('Erro ao gerar por-hora:', err.message);
    res.status(500).json({ error: 'Erro ao gerar dados por hora.' });
  }
});

// GET /api/mhe/leituras/horta/por-semana?sensor=solo_umido
router.get('/por-semana', async (req, res) => {
  const { sensor } = req.query;
  if (!sensor || !sensoresValidos.includes(sensor)) {
    return res.status(400).json({ error: 'Parâmetro "sensor" é obrigatório e deve ser válido.' });
  }

  const hoje = dayjs().tz(tz);
  const domingoAtual = hoje.startOf('week');
  const sabadoAtual = hoje.endOf('week');
  const domingoAnterior = domingoAtual.subtract(7, 'day');
  const sabadoAnterior = sabadoAtual.subtract(7, 'day');

  const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  function preencherSemana(dados) {
    const base = Array.from({ length: 7 }, (_, i) => ({ dia: diasSemana[i], valor: 0 }));
    dados.forEach(item => {
      const idx = parseInt(item.dia_semana) - 1;
      const v = parseFloat(item.valor);
      if (!isNaN(idx) && idx >= 0 && idx < 7 && !isNaN(v)) {
        base[idx].valor = parseFloat(v.toFixed(2));
      }
    });
    return base;
  }

  try {
    const query = `SELECT DAYOFWEEK(data_leitura) AS dia_semana, AVG(${sensor}) AS valor FROM horta_leituras WHERE data_leitura BETWEEN ? AND ? GROUP BY dia_semana`;

    const [resultAtual] = await db.execute(query, [
      domingoAtual.format('YYYY-MM-DD 00:00:00'),
      sabadoAtual.format('YYYY-MM-DD 23:59:59')
    ]);
    const semana_atual = preencherSemana(resultAtual);

    const [resultAnterior] = await db.execute(query, [
      domingoAnterior.format('YYYY-MM-DD 00:00:00'),
      sabadoAnterior.format('YYYY-MM-DD 23:59:59')
    ]);
    const semana_anterior = preencherSemana(resultAnterior);

    // 🔧 Correção robusta aqui:
    const mediaQuery = `SELECT AVG(${sensor}) AS valor FROM horta_leituras WHERE data_leitura BETWEEN ? AND ?`;
    const [media] = await db.execute(mediaQuery, [
      domingoAtual.format('YYYY-MM-DD 00:00:00'),
      sabadoAtual.format('YYYY-MM-DD 23:59:59')
    ]);

    let valorMedia = 0;
    if (media?.[0]?.valor !== null && !isNaN(media[0].valor)) {
      valorMedia = parseFloat(parseFloat(media[0].valor).toFixed(2));
    }

    const media_geral = Array.from({ length: 7 }, (_, i) => ({
      dia: diasSemana[i],
      valor: valorMedia
    }));

    res.json({ sensor, media_geral, semana_atual, semana_anterior });

  } catch (erro) {
    console.error('Erro /por-semana:', erro);
    res.status(500).json({ erro: 'Erro ao gerar agregações por semana.' });
  }
});

// GET /api/mhe/leituras/horta/por-intervalo?sensor=solo_umido&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
router.get('/por-intervalo', async (req, res) => {
  const { sensor, data_inicio, data_fim } = req.query;
  if (!sensor || !sensoresValidos.includes(sensor)) {
    return res.status(400).json({ error: 'Parâmetro "sensor" é obrigatório e deve ser válido.' });
  }
  if (!data_inicio || !data_fim) {
    return res.status(400).json({ error: 'Parâmetros "data_inicio" e "data_fim" são obrigatórios.' });
  }

  function gerarDatas(inicio, fim) {
    const datas = [];
    let atual = dayjs(inicio);
    const final = dayjs(fim);
    while (atual.isBefore(final) || atual.isSame(final, 'day')) {
      datas.push(atual.format('YYYY-MM-DD'));
      atual = atual.add(1, 'day');
    }
    return datas;
  }

  try {
    const query = `SELECT DATE(data_leitura) AS data, AVG(${sensor}) AS valor FROM horta_leituras WHERE data_leitura BETWEEN ? AND ? GROUP BY DATE(data_leitura) ORDER BY data`;
    const [rows] = await db.execute(query, [`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`]);

    const map = {};
    rows.forEach(row => {
      const dataISO = row.data instanceof Date ? row.data.toISOString().slice(0, 10) : row.data;
      map[dataISO] = parseFloat(row.valor);
    });

    const dias = gerarDatas(data_inicio, data_fim);
    const intervalo = dias.map(data => ({
      data: data, // usa YYYY-MM-DD direto
      valor: map[data] ? parseFloat(map[data].toFixed(2)) : 0
    }));

    const mediaValor = rows.length > 0 ? rows.reduce((acc, cur) => acc + (cur.valor || 0), 0) / rows.length : 0;
    const media_geral = dias.map(data => ({
      data: data,
      valor: parseFloat(mediaValor.toFixed(2))
    }));

    res.json({ sensor, media_geral, intervalo });
  } catch (erro) {
    console.error('Erro /por-intervalo:', erro);
    res.status(500).json({ erro: 'Erro ao gerar agregações por intervalo.' });
  }
});

// GET /api/mhe/leituras/horta/comparativo?periodo=hoje|semana|personalizado&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
// Esse endpoint deve retornar um comparativo entre os sensores
// de solo irrigado e não irrigado, além de temperatura e umidade do ar
// para o período especificado
router.get('/comparativo', async (req, res) => {
  const { periodo, data_inicio, data_fim } = req.query;
  const sensores = ['solo_umido', 'solo_seco'];
  const hoje = dayjs().tz(tz);

  try {
    let resposta = {};

    for (const sensor of sensores) {
      if (periodo === 'hoje') {
        const hojeInicio = hoje.startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const hojeFim = hoje.endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const ontem = hoje.subtract(1, 'day');
        const ontemInicio = ontem.startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const ontemFim = ontem.endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const [hojeData] = await db.execute(`
          SELECT HOUR(data_leitura) as hora, AVG(${sensor}) as valor
          FROM horta_leituras
          WHERE data_leitura BETWEEN ? AND ?
          GROUP BY hora
        `, [hojeInicio, hojeFim]);

        const [mediaRes] = await db.execute(`
          SELECT AVG(${sensor}) as valor
          FROM horta_leituras
          WHERE data_leitura BETWEEN ? AND ?
        `, [hojeInicio, hojeFim]);

        resposta[sensor] = Array.from({ length: 24 }, (_, h) => ({ hora: `${h.toString().padStart(2, '0')}h`, valor: 0 }));
        hojeData.forEach(row => {
          const h = parseInt(row.hora);
          if (!isNaN(h)) resposta[sensor][h].valor = parseFloat(row.valor.toFixed(2));
        });

        const mediaValor = parseFloat(mediaRes?.[0]?.valor || 0);
        resposta[`media_${sensor}`] = Array.from({ length: 24 }, (_, h) => ({ hora: `${h.toString().padStart(2, '0')}h`, valor: parseFloat(mediaValor.toFixed(2)) }));

      } else if (periodo === 'semana') {
        const dom = hoje.startOf('week');
        const sab = hoje.endOf('week');

        const [semanaData] = await db.execute(`
          SELECT DAYOFWEEK(data_leitura) as dia_semana, AVG(${sensor}) as valor
          FROM horta_leituras
          WHERE data_leitura BETWEEN ? AND ?
          GROUP BY dia_semana
        `, [dom.format('YYYY-MM-DD 00:00:00'), sab.format('YYYY-MM-DD 23:59:59')]);

        resposta[sensor] = Array.from({ length: 7 }, (_, i) => ({ dia: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i], valor: 0 }));
        semanaData.forEach(r => {
          const i = parseInt(r.dia_semana) - 1;
          if (i >= 0 && i <= 6) resposta[sensor][i].valor = parseFloat(r.valor.toFixed(2));
        });

        const [mediaRes] = await db.execute(`
          SELECT AVG(${sensor}) as valor
          FROM horta_leituras
          WHERE data_leitura BETWEEN ? AND ?
        `, [dom.format('YYYY-MM-DD 00:00:00'), sab.format('YYYY-MM-DD 23:59:59')]);

        const media = parseFloat(mediaRes?.[0]?.valor || 0);
        resposta[`media_${sensor}`] = Array.from({ length: 7 }, (_, i) => ({ dia: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i], valor: parseFloat(media.toFixed(2)) }));

      } else if (periodo === 'personalizado') {
        if (!data_inicio || !data_fim) return res.status(400).json({ error: 'Intervalo inválido.' });

        const [intervaloData] = await db.execute(`
          SELECT DATE(data_leitura) as data, AVG(${sensor}) as valor
          FROM horta_leituras
          WHERE data_leitura BETWEEN ? AND ?
          GROUP BY DATE(data_leitura)
        `, [`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`]);

        const dias = gerarDatasNoIntervalo(data_inicio, data_fim);
        const mapa = Object.fromEntries(intervaloData.map(r => [r.data.toISOString().slice(0, 10), parseFloat(r.valor)]));

        resposta[sensor] = dias.map(d => ({ data: formatarDataBR(d), valor: mapa[d] ? parseFloat(mapa[d].toFixed(2)) : 0 }));

        const mediaValor = intervaloData.length ? intervaloData.reduce((s, v) => s + (v.valor || 0), 0) / intervaloData.length : 0;
        resposta[`media_${sensor}`] = dias.map(d => ({ data: formatarDataBR(d), valor: parseFloat(mediaValor.toFixed(2)) }));
      }
    }

    res.json(resposta);

  } catch (err) {
    console.error('Erro no comparativo:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

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