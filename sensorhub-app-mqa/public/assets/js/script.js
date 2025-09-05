function carregarListaDeBoxesPara(idSelect) {
    fetch('https://sensorhub.lmsouza.com.br/api/mqa/listas/boxes')
        .then(res => res.json())
        .then(data => {
            const selectBox = document.getElementById(idSelect);
            if (!selectBox) return;

            // Limpa e adiciona a opção padrão
            selectBox.innerHTML = '<option value="">Todas as boxes</option>';
            
            data.forEach(box => {
                const opt = document.createElement('option');
                opt.value = box;
                opt.textContent = box;
                selectBox.appendChild(opt);
            });

            // Reativa o select do Materialize
            if (M.FormSelect) M.FormSelect.init(selectBox);
        }).catch(err => console.error(`Erro ao carregar boxes para #${idSelect}:`, err));
}