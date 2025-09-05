// charts-sensores.js - Script completo com todos os gráficos por sensor
// Cada função é independente e pode ser chamada separadamente

// 🧩 Plugin global para fundo branco no canvas
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

const gerarLabelsHora = () => Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const extrairValores = (arr) => arr.map(v => typeof v.valor === 'number' ? v.valor : 0);

function obterPeriodoSelecionado() {
    return document.getElementById('filtro-periodo')?.value || 'hoje';
}

function obterBoxSelecionada() {
    const valor = document.getElementById('filtro-box-graficos')?.value;
    return valor === '' ? null : valor;
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

function criaGraficoSensor(canvasId, sensor, tituloBase, unidade, corMaximaY = null, boxId = null) {
    const periodo = obterPeriodoSelecionado();
    const boxSelecionada = obterBoxSelecionada();
    const titulo = boxSelecionada ? `${tituloBase} - ${boxSelecionada}` : tituloBase;
    let url = `https://sensorhub.lmsouza.com.br/api/mqa/leituras/`;

    if (periodo === 'semana') {
        url += `por-semana?sensor=${sensor}`;
    } else if (periodo === 'personalizado') {
        const inicio = document.getElementById('data-inicio')?.value;
        const fim = document.getElementById('data-fim')?.value;
        url += `por-intervalo?sensor=${sensor}&data_inicio=${inicio}&data_fim=${fim}`;
    } else {
        url += `por-hora?sensor=${sensor}`;
    }

    if (boxSelecionada) url += `&box_id=${boxSelecionada}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            let datasets = [], labels = [], tituloEixoX = 'Hora do Dia';

            if (periodo === 'semana') {
                labels = data.semana.map(v => v.dia);
                tituloEixoX = 'Dia da Semana';
                datasets = [
                    {
                        label: 'Semana Atual',
                        data: extrairValores(data.semana),
                        borderColor: 'blue',
                        fill: false,
                        tension: 0.2
                    }
                ];

                if (data.semana_anterior) {
                    datasets.push({
                        label: 'Semana Anterior',
                        data: extrairValores(data.semana_anterior),
                        borderColor: 'orange',
                        fill: false,
                        tension: 0.2
                    });
                }

                if (data.media_geral) {
                    datasets.push({
                        label: 'Média Geral',
                        data: extrairValores(data.media_geral),
                        borderColor: 'gray',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.2
                    });
                }

            } else if (periodo === 'personalizado') {
                const intervalo = Array.isArray(data.intervalo) ? data.intervalo : [];
                labels = data.intervalo.map(v => {
                    const [d, m, y] = v.data.split('/');
                    return `${d}/${m}/${y.slice(-2)}`;
                  });
                tituloEixoX = 'Data';
                datasets = [{
                    label: 'Valor Médio Diário',
                    data: extrairValores(intervalo),
                    borderColor: 'blue',
                    fill: false,
                    tension: 0.2
                }];
                if (data.media_geral) {
                    datasets.push({
                      label: 'Média no Intervalo',
                      data: extrairValores(data.media_geral),
                      borderColor: 'gray',
                      borderDash: [5, 5],
                      fill: false,
                      tension: 0.2
                    });
                }	
            } else {
                labels = gerarLabelsHora();
                tituloEixoX = 'Hora do Dia';
                datasets = [
                    {
                        label: 'Dia Anterior',
                        data: extrairValores(data.dia_anterior),
                        borderColor: 'orange',
                        fill: false,
                        tension: 0.2
                    },
                    {
                        label: 'Dia Atual',
                        data: extrairValores(data.dia_atual),
                        borderColor: 'blue',
                        fill: false,
                        tension: 0.2
                    },
                    {
                        label: 'Média Geral',
                        data: extrairValores(data.media_geral),
                        borderColor: 'gray',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.2
                    }
                ];
            }

            criarGrafico(canvasId, titulo, labels, datasets, unidade, corMaximaY, tituloEixoX);
        })
        .catch(err => console.error(`Erro ao carregar grafico de ${sensor}:`, err));
}

function criaGraficoTemperatura() {
    criaGraficoSensor('graficoTemperatura', 'temperatura',
        'Temperatura nos Ambientes', 'Temperatura (°C)', 40);
}
function criaGraficoUmidade() {
    criaGraficoSensor('graficoUmidade', 'umidade',
        'Umidade Relativa do Ar', 'Umidade (%)', 100);
}
function criaGraficoMQ2() {
    criaGraficoSensor('graficoInflamaveis', 'mq2',
        'Gases Inflamáveis - MQ2', 'PPM MQ2');
}
function criaGraficoMQ9() {
    criaGraficoSensor('graficoMonoxido', 'mq9',
        'Monóxido de Carbono - MQ9', 'PPM MQ9');
}
function criaGraficoMQ135() {
    criaGraficoSensor('graficoToxicos', 'mq135',
        'Gases Tóxicos - MQ135', 'PPM MQ135');
}

function inicializarTodosGraficos() {
    criaGraficoTemperatura();
    criaGraficoUmidade();
    criaGraficoMQ2();
    criaGraficoMQ9();
    criaGraficoMQ135();
}

setInterval(inicializarTodosGraficos, 15000);

document.addEventListener('DOMContentLoaded', () => {
    carregarListaDeBoxesPara('filtro-box-graficos');
    inicializarTodosGraficos();

    document.getElementById('filtro-box-graficos')?.addEventListener('change', inicializarTodosGraficos);

    document.getElementById('filtro-periodo')?.addEventListener('change', () => {
        const tipo = obterPeriodoSelecionado();
        const intervalo = document.querySelector('.range-personalizado');

        if (intervalo) {
            const mostrar = tipo === 'personalizado';
            intervalo.style.display = mostrar ? 'block' : 'none';

            if (mostrar) {
                setTimeout(() => {
                    M.updateTextFields(); // atualiza os labels do Materialize
                }, 100);
            } else {
                document.getElementById('data-inicio').value = '';
                document.getElementById('data-fim').value = '';
            }
        }
        inicializarTodosGraficos();
    });

    document.getElementById('data-inicio')?.addEventListener('change', inicializarTodosGraficos);
    document.getElementById('data-fim')?.addEventListener('change', inicializarTodosGraficos);
});