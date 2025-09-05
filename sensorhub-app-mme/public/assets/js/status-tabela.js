document.addEventListener('DOMContentLoaded', () => {
  const tabela = document.getElementById('status-table');
  const apiUrl = 'https://sensorhub.lmsouza.com.br/api/mqa/leituras/ultima-leitura';

  async function atualizarTabelaStatus() {
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();

      // Limpa a tabela
      tabela.innerHTML = '';

      // Verifica se o retorno é múltiplo (todas as boxes)
      const leituras = Array.isArray(data.leituras) ? data.leituras : [data];

      // Preenche a tabela com os dados
      leituras.forEach(l => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${l.box_id || '—'}</td>
          <td>${l.mq2 ?? '—'}</td>
          <td>${l.mq9 ?? '—'}</td>
          <td>${l.mq135 ?? '—'}</td>
          <td>${l.temperatura?.toFixed(2) ?? '—'}</td>
          <td>${l.umidade?.toFixed(2) ?? '—'}</td>
          <td>${l.pressao?.toFixed(2) ?? '—'}</td>
        `;
        tabela.appendChild(row);
      });

    } catch (err) {
      console.error('Erro ao atualizar status da tabela:', err);
    }
  }

  // Atualização automática a cada 15 segundos
  setInterval(atualizarTabelaStatus, 15000);

  // Primeira atualização ao carregar
  atualizarTabelaStatus();
});
