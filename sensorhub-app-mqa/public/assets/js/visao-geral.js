// Funçao para carregar os cards com os dados da API
// e preencher o seletor com as boxes disponíveis
// e atualizar os cards com os dados filtrados
// e adicionar evento ao mudar o seletor
// e carregar os dados com todas as boxes inicialmente
// e atualizar os cards com os dados filtrados
document.addEventListener('DOMContentLoaded', async () => {
    carregarListaDeBoxesPara('filtro-box-visao'); // Carrega as boxes
    const selectBox = document.getElementById('filtro-box-visao'); // ✅ AQUI

    const apiUrl = 'https://sensorhub.lmsouza.com.br/api/mqa/leituras/ultima-leitura';

    M.AutoInit(); // Inicializa Materialize

    async function atualizarCards(boxId) {
        try {
            const url = boxId ? `${apiUrl}?box_id=${boxId}` : apiUrl;
            const res = await fetch(url);
            const data = await res.json();

            if (boxId) {
                document.querySelector('#card-ambientes h4').textContent = 1;
                document.querySelector('#card-umidade h5').textContent = `${data.umidade?.toFixed(1) || 0}%`;
                document.querySelector('#card-temperatura h5').textContent = `${data.temperatura?.toFixed(1) || 0}°C`;
                const mediaGases = ((data.mq2 + data.mq9 + data.mq135) / 3).toFixed(1);
                document.querySelector('#card-gases h5').textContent = `${mediaGases}`;
            } else {
                document.querySelector('#card-ambientes h4').textContent = data.total_boxes;
                document.querySelector('#card-umidade h5').textContent = `${data.umidade_media?.toFixed(1) || 0}%`;
                document.querySelector('#card-temperatura h5').textContent = `${data.temperatura_media?.toFixed(1) || 0}°C`;
                document.querySelector('#card-gases h5').textContent = `${data.gases_toxicos_media?.toFixed(1) || 0}`;
            }

        } catch (error) {
            console.error('Erro ao atualizar os cards:', error);
        }
    }

    // Evento de mudança
    selectBox.addEventListener('change', () => {
        atualizarCards(selectBox.value);
    });

    await carregarListaDeBoxesPara('filtro-box-visao');
    await atualizarCards('');

    setInterval(() => {
        atualizarCards(selectBox.value);
    }, 15000);
});  
