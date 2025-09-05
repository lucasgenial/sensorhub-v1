// charts-temporais.js - Adaptado para horta (solo umido, solo seco)

Chart.register({
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
});

const gerarLabelsHora = () => Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}h`);
const extrairValores = (arr) => arr.map(v => typeof v.valor === 'number' ? v.valor : 0);

function obterPeriodoSelecionado() {
  return document.getElementById('filtro-periodo')?.value || 'hoje';
}

function formatarDataLabel(d) {
  const [y, m, dia] = d.split('-');
  return `${dia}/${m}/${y.slice(-2)}`;
}

function criarGrafico(canvasId, titulo, labels, datasets, unidade, corMaximaY, tituloEixoX) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const chartExistente = Chart.getChart(ctx.canvas);
  if (chartExistente) chartExistente.destroy();

  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: titulo,
          font: { size: 18, weight: 'bold' },
          color: '#333'
        },
        legend: { position: 'bottom', labels: { color: '#333' } }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: tituloEixoX,
            font: { size: 14, weight: 'bold' },
            color: '#333'
          },
          ticks: { color: '#333' }
        },
        y: {
          title: {
            display: true,
            text: unidade,
            font: { size: 14, weight: 'bold' },
            color: '#333'
          },
          ticks: { color: '#333' },
          beginAtZero: true,
          suggestedMax: corMaximaY || undefined
        }
      }
    }
  });
}

function criarGraficoSensorHorta(canvasId, sensor, tituloBase, unidade) {
  const periodo = obterPeriodoSelecionado();
  let url = `https://sensorhub.lmsouza.com.br/api/mhe/leituras/horta/`;

  if (periodo === 'semana') {
    url += `por-semana?sensor=${sensor}`;
  } else if (periodo === 'personalizado') {
    const inicio = document.getElementById('data-inicio')?.value;
    const fim = document.getElementById('data-fim')?.value;
    url += `por-intervalo?sensor=${sensor}&data_inicio=${inicio}&data_fim=${fim}`;
  } else {
    url += `por-hora?sensor=${sensor}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      let datasets = [], labels = [], tituloEixoX = 'Hora do Dia';

      if (periodo === 'semana') {
        labels = data.semana_atual.map(v => v.dia);
        tituloEixoX = 'Dia da Semana';
        datasets = [
          { label: 'Semana Atual', data: extrairValores(data.semana_atual), borderColor: 'blue', fill: false, tension: 0.2 },
          { label: 'Semana Anterior', data: extrairValores(data.semana_anterior), borderColor: 'orange', fill: false, tension: 0.2 },
          { label: 'Média Geral', data: extrairValores(data.media_geral), borderColor: 'gray', borderDash: [5, 5], fill: false, tension: 0.2 }
        ];
      } else if (periodo === 'personalizado') {
        labels = Array.isArray(data.intervalo)
          ? data.intervalo.map(v => formatarDataLabel(v.data.replaceAll('/', '-')))
          : [];
        tituloEixoX = 'Data';
        datasets = [
          { label: 'Valor Médio Diário', data: extrairValores(data.intervalo || []), borderColor: 'blue', fill: false, tension: 0.2 },
          { label: 'Média no Intervalo', data: extrairValores(data.media_geral || []), borderColor: 'gray', borderDash: [5, 5], fill: false, tension: 0.2 }
        ];
      } else {
        labels = gerarLabelsHora();
        datasets = [
          { label: 'Dia Atual', data: extrairValores(data.dia_atual || []), borderColor: 'blue', fill: false, tension: 0.2 },
          { label: 'Dia Anterior', data: extrairValores(data.dia_anterior || []), borderColor: 'orange', fill: false, tension: 0.2 },
          { label: 'Média Geral', data: extrairValores(data.media_geral || []), borderColor: 'gray', borderDash: [5, 5], fill: false, tension: 0.2 }
        ];
      }

      criarGrafico(canvasId, tituloBase, labels, datasets, unidade, 100, tituloEixoX);
    })
    .catch(err => console.error(`Erro ao carregar gráfico de ${sensor}:`, err));
}

function criarGraficoSoloComparativo() {
  const periodo = obterPeriodoSelecionado();
  const sensores = ['solo_umido', 'solo_seco'];
  let urlBase = 'https://sensorhub.lmsouza.com.br/api/mhe/leituras/horta/';
  let urls = [];

  if (periodo === 'semana') {
    urls = sensores.map(s => `${urlBase}por-semana?sensor=${s}`);
  } else if (periodo === 'personalizado') {
    const inicio = document.getElementById('data-inicio')?.value;
    const fim = document.getElementById('data-fim')?.value;
    urls = sensores.map(s => `${urlBase}por-intervalo?sensor=${s}&data_inicio=${inicio}&data_fim=${fim}`);
  } else {
    urls = sensores.map(s => `${urlBase}por-hora?sensor=${s}`);
  }

  Promise.all(urls.map(url => fetch(url).then(r => r.json())))
    .then(([umido, seco]) => {
      let labels = [], tituloEixoX = 'Hora';
      let dataUmido = [], dataSeco = [], mediaUmido = [], mediaSeco = [];

      if (periodo === 'semana') {
        labels = Array.isArray(umido.semana_atual) ? umido.semana_atual.map(v => v.dia) : [];
        dataUmido = Array.isArray(umido.semana_atual) ? umido.semana_atual : [];
        dataSeco = Array.isArray(seco.semana_atual) ? seco.semana_atual : [];
        mediaUmido = Array.isArray(umido.media_geral) ? umido.media_geral : [];
        mediaSeco = Array.isArray(seco.media_geral) ? seco.media_geral : [];
        tituloEixoX = 'Dia da Semana';
      } else if (periodo === 'personalizado') {
        //labels = Array.isArray(umido.intervalo) ? umido.intervalo.map(v => v.data) : [];
        labels = Array.isArray(umido.intervalo)
          ? umido.intervalo.map(v => formatarDataLabel(v.data.replaceAll('/', '-')))
          : [];
        dataUmido = Array.isArray(umido.intervalo) ? umido.intervalo : [];
        dataSeco = Array.isArray(seco.intervalo) ? seco.intervalo : [];
        mediaUmido = Array.isArray(umido.media_geral) ? umido.media_geral : [];
        mediaSeco = Array.isArray(seco.media_geral) ? seco.media_geral : [];
        tituloEixoX = 'Data';
      } else {
        labels = gerarLabelsHora();
        dataUmido = Array.isArray(umido.dia_atual) ? umido.dia_atual : [];
        dataSeco = Array.isArray(seco.dia_atual) ? seco.dia_atual : [];
        mediaUmido = Array.isArray(umido.media_geral) ? umido.media_geral : [];
        mediaSeco = Array.isArray(seco.media_geral) ? seco.media_geral : [];
        tituloEixoX = 'Hora do Dia';
      }

      const datasets = [
        {
          label: 'Solo Irrigado',
          data: extrairValores(dataUmido),
          borderColor: 'green',
          fill: false,
          tension: 0.2
        },
        {
          label: 'Solo Não Irrigado',
          data: extrairValores(dataSeco),
          borderColor: 'red',
          fill: false,
          tension: 0.2
        },
        {
          label: 'Média Solo Irrigado',
          data: extrairValores(mediaUmido),
          borderColor: 'green',
          borderDash: [5, 5],
          fill: false,
          tension: 0.2
        },
        {
          label: 'Média Solo Não Irrigado',
          data: extrairValores(mediaSeco),
          borderColor: 'red',
          borderDash: [5, 5],
          fill: false,
          tension: 0.2
        }
      ];

      criarGrafico('graficoSoloComparativo', 'Comparativo: Solo Irrigado x Não Irrigado', labels, datasets, 'Umidade (%)', 100, tituloEixoX);
    });
}

function inicializarGraficosHorta() {
  criarGraficoSensorHorta('graficoSoloUmido', 'solo_umido', 'Umidade do Solo Irrigado', 'Umidade (%)');
  criarGraficoSensorHorta('graficoSoloSeco', 'solo_seco', 'Umidade do Solo Não Irrigado', 'Umidade (%)');
  criarGraficoSensorHorta('graficoTemperatura', 'temperatura', 'Temperatura do Ambiente da Horta', 'Temperatura (°C)');
  criarGraficoSensorHorta('graficoUmidadeAr', 'umidade_ar', 'Umidade do Ar Ambiente', 'Umidade (%)');
  criarGraficoSoloComparativo();
}

setInterval(inicializarGraficosHorta, 15000);

document.addEventListener('DOMContentLoaded', () => {
  inicializarGraficosHorta();

  document.getElementById('filtro-periodo')?.addEventListener('change', () => {
    const tipo = obterPeriodoSelecionado();
    const intervalo = document.querySelector('.range-personalizado');

    if (intervalo) {
      const mostrar = tipo === 'personalizado';
      intervalo.style.display = mostrar ? 'block' : 'none';
      if (mostrar) {
        setTimeout(() => M.updateTextFields(), 100);
      } else {
        document.getElementById('data-inicio').value = '';
        document.getElementById('data-fim').value = '';
      }
    }
    inicializarGraficosHorta();
  });

  document.getElementById('data-inicio')?.addEventListener('change', inicializarGraficosHorta);
  document.getElementById('data-fim')?.addEventListener('change', inicializarGraficosHorta);
});