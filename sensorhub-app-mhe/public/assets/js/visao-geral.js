document.addEventListener('DOMContentLoaded', async () => {
    const apiUrl = 'https://sensorhub.lmsouza.com.br/api/mhe/leituras/horta/ultima-leitura';

    M.AutoInit(); // Inicializa Materialize

    async function atualizarCards() {
        try {
            const res = await fetch(apiUrl);
            const data = await res.json();

            // Atualiza valores dos cards
            document.querySelector('#card-temperatura h4').textContent = `${data.temperatura?.toFixed(1) || 0}°C`;
            document.querySelector('#card-umidade h5').textContent = `${data.umidade_ar?.toFixed(1) || 0}%`;
            document.querySelector('#card-umidade-solo-irrigado h5').textContent = `${data.solo_umido || 0}%`;
            document.querySelector('#card-umidade-nao-irrigado h5').textContent = `${data.solo_seco || 0}%`;
        } catch (error) {
            console.error('Erro ao atualizar os cards da horta:', error);
        }
    }

    // Caminhos locais das imagens da bomba
    const imgAtiva = './assets/img/horta-irrigando.png';   // imagem com irrigação
    const imgDesligada = './assets/img/horta-seca.png';    // imagem sem irrigação

    function formatarHora(isoString) {
        const data = new Date(isoString);
        return data.toLocaleTimeString('pt-BR');
    }

    function atualizarCardBomba(status, dataEvento) {
        const card = document.getElementById('card-bomba');
        const texto = document.getElementById('status-texto');
        const horario = document.getElementById('status-horario');

        if (!card || !texto || !horario) return;

        if (status === 'ligada') {
            card.style.backgroundImage = `url('${imgAtiva}')`;
            texto.textContent = 'Irrigação Ativada';
        } else {
            card.style.backgroundImage = `url('${imgDesligada}')`;
            texto.textContent = 'Irrigação Desativada';
        }

        horario.textContent = formatarHora(dataEvento);
    }

    async function buscarStatusDaBomba() {
        try {
            const res = await fetch('https://sensorhub.lmsouza.com.br/api/mhe/bomba/status');
            const dados = await res.json();
            atualizarCardBomba(dados.status, dados.data_evento);
        } catch (error) {
            console.error('Erro ao buscar status da bomba:', error);
        }
    }

    await atualizarCards();
    await buscarStatusDaBomba();              // ✅ Atualiza ao iniciar
    setInterval(atualizarCards, 15000);       // ✅ Atualiza a cada 15s
    setInterval(buscarStatusDaBomba, 15000);  // ✅ Atualiza a cada 15s
});
