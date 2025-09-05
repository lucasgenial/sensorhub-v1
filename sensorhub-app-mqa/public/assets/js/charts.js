document.addEventListener('DOMContentLoaded', () => {
    const selectBox = document.getElementById('filtro-box');

    // IDs dos gráficos e sensores correspondentes
    const sensores = [
        { id: 'graficoTemperatura', campo: 'temperatura', label: 'Temperatura (°C)', cor: 'rgba(255, 159, 64, 0.7)' },
        { id: 'graficoUmidade', campo: 'umidade', label: 'Umidade (%)', cor: 'rgba(54, 162, 235, 0.7)' },
        { id: 'graficoInflamaveis', campo: 'mq2', label: 'Inflamáveis (MQ2)', cor: 'rgba(255, 99, 132, 0.7)' },
        { id: 'graficoMonoxido', campo: 'mq9', label: 'Monóxido (MQ9)', cor: 'rgba(255, 206, 86, 0.7)' },
        { id: 'graficoToxicos', campo: 'mq135', label: 'Tóxicos (MQ135)', cor: 'rgba(153, 102, 255, 0.7)' },
    ];

    // Guardará os gráficos para poder atualizar
    const graficos = {};

    // Função para criar um gráfico
    function criarGrafico(canvasId, label, cor) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    backgroundColor: cor,
                    borderColor: cor,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: { autoSkip: true, maxTicksLimit: 15 }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Atualiza os dados de todos os gráficos com base na box selecionada
    async function atualizarGraficos(boxId) {
        if (!boxId) return; // Evita chamada sem box

        const urlBase = 'https://sensorhub.lmsouza.com.br/api/mqa/leituras/qualidade-ar';
        try {
            const res = await fetch(`${urlBase}?box_id=${boxId}&limit=50`);
            const data = await res.json();

            sensores.forEach(({ id, campo }) => {
                const grafico = graficos[id];
                grafico.data.labels = data.map(d => new Date(d.data_leitura).toLocaleString('pt-BR'));
                grafico.data.datasets[0].data = data.map(d => d[campo]);
                grafico.update();
            });
        } catch (err) {
            console.error('Erro ao carregar dados dos gráficos:', err);
        }
    }

    // Inicializa todos os gráficos
    function inicializarGraficos() {
        sensores.forEach(({ id, label, cor }) => {
            graficos[id] = criarGrafico(id, label, cor);
        });
    }

    // Aguarda mudança no seletor
    selectBox.addEventListener('change', () => {
        const boxId = selectBox.value;
        if (boxId) {
            atualizarGraficos(boxId);
        }
    });

    // Inicialização
    inicializarGraficos();
});
