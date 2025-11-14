document.addEventListener('DOMContentLoaded', () => {
    // --- Variáveis Globais de Cache ---
    let allBlocks = []; // Itens
    let allPacotes = []; // Pacotes (misto)
    let allMissoes = []; // Missoes (misto)
    let allTraducoes = []; // Traducoes (misto)
    let activeItemIndex = -1, activePacoteIndex = -1, activeMissaoIndex = -1, activeTraducaoIndex = -1;
    
    // NOVO: Mapa para guardar nomes de itens para consulta rápida (ID -> Nome)
    let itemLookup = new Map();
    
    const API_URL = 'http://localhost:3000';

    // --- Seletores de ABA ---
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- Seletores da Aba ITENS ---
    const itemListEl = document.getElementById('item-list');
    const itemSearchEl = document.getElementById('search-bar');
    const itemFormEl = document.getElementById('edit-form');
    const itemSaveAllButton = document.getElementById('save-all-button');
    const itemAddNewButton = document.getElementById('add-new-item-button');
    const itemIndexEl = document.getElementById('item-index');
    const itemCommentEl = document.getElementById('item-comment');
    const itemIdEl = document.getElementById('item-id');

    // --- Seletores da Aba PACOTES ---
    const pacotesListEl = document.getElementById('pacotes-list');
    const pacotesSearchEl = document.getElementById('search-pacotes');
    const pacotesFormEl = document.getElementById('pacotes-form');
    const pacotesSaveAllButton = document.getElementById('save-pacotes-button');
    const pacotesAddNewButton = document.getElementById('add-new-pacote-button');
    const pacoteIndexEl = document.getElementById('pacote-index');
    const pacoteIdEl = document.getElementById('pacote-id');

    // --- Seletores da Aba MISSÕES ---
    const missoesListEl = document.getElementById('missoes-list');
    const missoesSearchEl = document.getElementById('search-missoes');
    const missoesFormEl = document.getElementById('missoes-form');
    const missoesSaveAllButton = document.getElementById('save-missoes-button');
    const missoesAddNewButton = document.getElementById('add-new-missao-button');
    const missaoIndexEl = document.getElementById('missao-index');
    const missaoIdEl = document.getElementById('missao-id');
    
    // --- Seletores da Aba TRADUÇÕES ---
    const traducoesListEl = document.getElementById('traducoes-list');
    const traducoesSearchEl = document.getElementById('search-traducoes');
    const traducoesFormEl = document.getElementById('traducoes-form');
    const traducoesSaveAllButton = document.getElementById('save-traducoes-button');
    const traducoesAddNewButton = document.getElementById('add-new-traducao-button');
    const traducaoIndexEl = document.getElementById('traducao-index');
    const traducaoIdEl = document.getElementById('traducao-id');

    // --- Configuração dos Editores CodeMirror ---
    const commonOptions = { theme: 'dracula', lineNumbers: true, tabSize: 2 };
    const jsBeautifyOptions = { indent_size: 2, space_in_empty_paren: true };
    const htmlBeautifyOptions = { indent_size: 2, wrap_line_length: 0, preserve_newlines: true, max_preserve_newlines: 2, unformatted: ['span', 'p', 'a', 'em', 'strong', 'b', 'i'], wrap_attributes: 'auto' };
    
    // Editores da Aba Itens
    const htmlEditor = CodeMirror(document.getElementById('html-editor-placeholder'), { ...commonOptions, mode: 'htmlmixed' });
    const tradEditor = CodeMirror(document.getElementById('trad-editor-placeholder'), { ...commonOptions, mode: { name: 'javascript', json: true } });
    const bauEditor = CodeMirror(document.getElementById('bau-editor-placeholder'), { ...commonOptions, mode: { name: 'javascript', json: true } });
    const tpcEditor = CodeMirror(document.getElementById('tpc-editor-placeholder'), { ...commonOptions, mode: { name: 'javascript', json: true } });

    // Editores das Abas Pacotes, Missões e Traduções
    const editorJSFullOptions = { ...commonOptions, mode: { name: 'javascript', json: true } };
    const pacoteContentEditor = CodeMirror(document.getElementById('pacote-content-editor'), editorJSFullOptions);
    const missaoContentEditor = CodeMirror(document.getElementById('missao-content-editor'), editorJSFullOptions);
    const traducaoContentEditor = CodeMirror(document.getElementById('traducao-content-editor'), editorJSFullOptions);
    // --- Fim da Configuração ---


    // --- LÓGICA DAS ABAS ---
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;

            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'tab-itens' && allBlocks.length === 0) loadItems();
            if (tabId === 'tab-pacotes' && allPacotes.length === 0) loadPacotes();
            if (tabId === 'tab-missoes' && allMissoes.length === 0) loadMissoes();
            if (tabId === 'tab-traducoes' && allTraducoes.length === 0) loadTraducoes();

            // Refresca os editores da aba clicada
            if (tabId === 'tab-itens') {
                htmlEditor.refresh(); tradEditor.refresh(); bauEditor.refresh(); tpcEditor.refresh();
            } else if (tabId === 'tab-pacotes') {
                pacoteContentEditor.refresh();
                decoratePacotesEditor(pacoteContentEditor); // Decora o editor
            } else if (tabId === 'tab-missoes') {
                missaoContentEditor.refresh();
                decorateMissoesEditor(missaoContentEditor); // Decora o editor
            } else if (tabId === 'tab-traducoes') {
                traducaoContentEditor.refresh();
            }
        });
    });

    // =================================================================
    // FUNÇÕES DE DECORAÇÃO (Com a sintaxe corrigida)
    // =================================================================

    // Limpa widgets antigos para evitar duplicação
    function clearItemNameWidgets(editor) {
        editor.getAllMarks().forEach(mark => {
            if (mark.className === 'item-name-widget') {
                mark.clear();
            }
        });
    }

    // Procura por 'itemid(itemXXXX...)' e adiciona o nome
    function decoratePacotesEditor(editor) {
        if (itemLookup.size === 0) return; // Mapa de itens não está pronto
        
        clearItemNameWidgets(editor);
        const itemRegex = /itemid\(item([0-9a-zA-Z]+)/;

        for (let i = 0; i < editor.lineCount(); i++) {
            const lineText = editor.getLine(i);
            const match = lineText.match(itemRegex);
            
            if (match) {
                const itemId = match[1]; // O ID (ex: 1720690)
                const itemName = itemLookup.get(itemId); // O Nome (ex: DIAMANTE)
                
                if (itemName) {
                    const widget = document.createElement('span');
                    widget.className = 'item-name-comment';
                    widget.textContent = `${itemName}`;
                    
                    editor.setBookmark({ line: i, ch: lineText.length }, { 
                        widget: widget, 
                        className: 'item-name-widget'
                    });
                }
            }
        }
    }

    // Procura por 'addMissao('itemXXXX...' e adiciona o nome
    function decorateMissoesEditor(editor) {
        if (itemLookup.size === 0) return; // Mapa de itens não está pronto
        
        clearItemNameWidgets(editor);
        const itemRegex = /itemid\(item([0-9a-zA-Z]+)/; // Regex diferente

        for (let i = 0; i < editor.lineCount(); i++) {
            const lineText = editor.getLine(i);
            const match = lineText.match(itemRegex);
            
            if (match) {
                const itemId = match[1]; // O ID
                const itemName = itemLookup.get(itemId); // O Nome                
                if (itemName) {
                    const widget = document.createElement('span');
                    widget.className = 'item-name-comment';
                    widget.textContent = `${itemName}`;

                    
                    editor.setBookmark({ line: i, ch: lineText.length }, { 
                        widget: widget, 
                        className: 'item-name-widget'
                    });
                }
            }
        }
    }

    // =================================================================
    // GERENCIAMENTO DA ABA "ITENS"
    // =================================================================
    async function loadItems() {
        try {
            const response = await fetch(`${API_URL}/api/items`);
            if (!response.ok) throw new Error((await response.json()).message);
            allBlocks = await response.json();
            
            // Preenche o mapa de lookup
            itemLookup.clear();
            allBlocks.forEach(block => {
                if (block.type === 'item') {
                    itemLookup.set(block.id, block.comment);
                }
            });
            console.log(`[App] Mapa de lookup de itens criado com ${itemLookup.size} itens.`);

            renderItemList();
        } catch (error) { itemListEl.innerHTML = `<p style="color: red; padding: 10px;"><b>Erro:</b> ${error.message}</p>`; }
    }
    function renderItemList(filter = '') {
        itemListEl.innerHTML = '';
        const filterLower = filter.toLowerCase();
        allBlocks.forEach((block, index) => {
            if (block.type !== 'item') return; // Filtra blocos de texto
            const item = block;
            const itemName = item.comment || `Item ${item.id}`;
            if (filter && !itemName.toLowerCase().includes(filterLower) && item.id !== filter) return;
            const button = document.createElement('button');
            button.textContent = itemName;
            button.title = itemName;
            button.dataset.index = index;
            if (index === activeItemIndex) button.classList.add('active');
            button.addEventListener('click', () => populateItemForm(index));
            itemListEl.appendChild(button);
        });
    }
    function populateItemForm(index) {
        if (index < 0 || index >= allBlocks.length || allBlocks[index].type !== 'item') return;
        activeItemIndex = index;
        const item = allBlocks[index];
        itemIndexEl.value = index;
        itemCommentEl.value = item.comment || '';
        itemIdEl.value = item.id || '';
        htmlEditor.setValue(item.html ? html_beautify(item.html, htmlBeautifyOptions) : '');
        tradEditor.setValue(item.traducao ? js_beautify(item.traducao, jsBeautifyOptions) : '');
        bauEditor.setValue(item.bau ? js_beautify(item.bau, jsBeautifyOptions) : '');
        tpcEditor.setValue(item.tpc ? js_beautify(item.tpc, jsBeautifyOptions) : '');
        document.querySelectorAll('#item-list button').forEach(btn => btn.classList.toggle('active', btn.dataset.index == index));
        setTimeout(() => { htmlEditor.refresh(); tradEditor.refresh(); bauEditor.refresh(); tpcEditor.refresh(); }, 10);
    }
    function saveItemFormToLocalCache(e) {
        e.preventDefault();
        const index = parseInt(itemIndexEl.value, 10);
        if (index < 0 || index >= allBlocks.length || allBlocks[index].type !== 'item') { alert('Nenhum item selecionado.'); return; }
        allBlocks[index] = {
            type: 'item', comment: itemCommentEl.value, id: itemIdEl.value,
            html: htmlEditor.getValue(), traducao: tradEditor.getValue() || null,
            bau: bauEditor.getValue() || null, tpc: tpcEditor.getValue() || null
        };
        const button = itemListEl.querySelector(`button[data-index="${index}"]`);
        if (button) { button.textContent = allBlocks[index].comment; button.title = allBlocks[index].comment; }
        alert('Item atualizado na memória.');
    }
    function addNewItem() {
        const newItem = {
            type: 'item', comment: "NOVO ITEM", id: "000000",
            html: "\n<div class=\"item comum\">\n</div>",
            traducao: "{\n  en: {\n    item000000_nomedoitem: \"New Item\"\n  },\n  pt: {\n    item000000_nomedoitem: \"Novo Item\"\n  }\n}",
            bau: null, tpc: null
        };
        allBlocks.push(newItem);
        const newIndex = allBlocks.length - 1;
        renderItemList(itemSearchEl.value);
        populateItemForm(newIndex);
        itemListEl.querySelector(`button[data-index="${newIndex}"]`).scrollIntoView();
    }
    async function saveAllItemsToFile() {
        if (!confirm('Salvar o arquivo itens.js?')) return;
        itemSaveAllButton.disabled = true; itemSaveAllButton.textContent = 'Salvando...';
        try {
            const currentIndex = parseInt(itemIndexEl.value, 10);
            if (currentIndex >= 0 && currentIndex < allBlocks.length && allBlocks[currentIndex].type === 'item') {
                allBlocks[currentIndex] = {
                    type: 'item', comment: itemCommentEl.value, id: itemIdEl.value,
                    html: htmlEditor.getValue(), traducao: tradEditor.getValue() || null,
                    bau: bauEditor.getValue() || null, tpc: tpcEditor.getValue() || null
                };
            }
            const response = await fetch(`${API_URL}/api/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allBlocks) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            alert(result.message);
        } catch (error) { alert(`Erro: ${error.message}`); } 
        finally { itemSaveAllButton.disabled = false; itemSaveAllButton.textContent = '💾 Salvar Itens'; }
    }
    itemSearchEl.addEventListener('input', (e) => renderItemList(e.target.value));
    itemFormEl.addEventListener('submit', saveItemFormToLocalCache);
    itemSaveAllButton.addEventListener('click', saveAllItemsToFile);
    itemAddNewButton.addEventListener('click', addNewItem);

    // =================================================================
    // GERENCIAMENTO DA ABA "PACOTES"
    // =================================================================
    async function loadPacotes() {
        try {
            const response = await fetch(`${API_URL}/api/pacotes`);
            if (!response.ok) throw new Error((await response.json()).message);
            allPacotes = await response.json();
            renderPacoteList();
        } catch (error) { pacotesListEl.innerHTML = `<p style="color: red; padding: 10px;"><b>Erro:</b> ${error.message}</p>`; }
    }
    function renderPacoteList(filter = '') {
        pacotesListEl.innerHTML = '';
        const filterLower = filter.toLowerCase();
        allPacotes.forEach((block, index) => {
            // CORREÇÃO AQUI: Adiciona o filtro de 'type'
            if (block.type !== 'pacote') return;
            const pacoteName = block.id;
            if (filter && !pacoteName.toLowerCase().includes(filterLower)) return;
            const button = document.createElement('button');
            button.textContent = pacoteName;
            button.title = pacoteName;
            button.dataset.index = index;
            if (index === activePacoteIndex) button.classList.add('active');
            button.addEventListener('click', () => populatePacoteForm(index));
            pacotesListEl.appendChild(button);
        });
    }
    function populatePacoteForm(index) {
        if (index < 0 || index >= allPacotes.length || allPacotes[index].type !== 'pacote') return;
        activePacoteIndex = index;
        const pacote = allPacotes[index];
        pacoteIndexEl.value = index;
        pacoteIdEl.value = pacote.id || '';
        pacoteContentEditor.setValue(pacote.content || '');
        document.querySelectorAll('#pacotes-list button').forEach(btn => btn.classList.toggle('active', btn.dataset.index == index));
        setTimeout(() => { 
            pacoteContentEditor.refresh(); 
            decoratePacotesEditor(pacoteContentEditor);
        }, 10);
    }
    function savePacoteFormToLocalCache(e) {
        e.preventDefault();
        const index = parseInt(pacoteIndexEl.value, 10);
        if (index < 0 || index >= allPacotes.length || allPacotes[index].type !== 'pacote') { alert('Nenhum pacote selecionado.'); return; }
        allPacotes[index].id = pacoteIdEl.value;
        allPacotes[index].content = pacoteContentEditor.getValue();
        const button = pacotesListEl.querySelector(`button[data-index="${index}"]`);
        if (button) { button.textContent = allPacotes[index].id; button.title = allPacotes[index].id; }
        alert('Pacote atualizado na memória.');
    }
    function addNewPacote() {
        const newPacote = { type: 'pacote', id: "NovoPacote", content: "{\n    // Adicione seu novo pacote aqui\n}" };
        allPacotes.push(newPacote);
        const newIndex = allPacotes.length - 1;
        renderPacoteList(pacotesSearchEl.value);
        populatePacoteForm(newIndex);
        pacotesListEl.querySelector(`button[data-index="${newIndex}"]`).scrollIntoView();
    }
    async function saveAllPacotesToFile() {
        if (!confirm('Salvar o arquivo pacotes.js?')) return;
        pacotesSaveAllButton.disabled = true; pacotesSaveAllButton.textContent = 'Salvando...';
        try {
            const currentIndex = parseInt(pacoteIndexEl.value, 10);
            if (currentIndex >= 0 && currentIndex < allPacotes.length && allPacotes[currentIndex].type === 'pacote') {
                allPacotes[currentIndex].id = pacoteIdEl.value;
                allPacotes[currentIndex].content = pacoteContentEditor.getValue();
            }
            const response = await fetch(`${API_URL}/api/save-pacotes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allPacotes) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            alert(result.message);
        } catch (error) { alert(`Erro: ${error.message}`); } 
        finally { pacotesSaveAllButton.disabled = false; pacotesSaveAllButton.textContent = '💾 Salvar Pacotes'; }
    }
    pacotesSearchEl.addEventListener('input', (e) => renderPacoteList(e.target.value));
    pacotesFormEl.addEventListener('submit', savePacoteFormToLocalCache);
    pacotesSaveAllButton.addEventListener('click', saveAllPacotesToFile);
    pacotesAddNewButton.addEventListener('click', addNewPacote);

    // =================================================================
    // GERENCIAMENTO DA ABA "MISSÕES"
    // =================================================================
    async function loadMissoes() {
        try {
            const response = await fetch(`${API_URL}/api/missoes`);
            if (!response.ok) throw new Error((await response.json()).message);
            allMissoes = await response.json();
            renderMissaoList();
        } catch (error) { missoesListEl.innerHTML = `<p style="color: red; padding: 10px;"><b>Erro:</b> ${error.message}</p>`; }
    }
    function renderMissaoList(filter = '') {
        missoesListEl.innerHTML = '';
        const filterLower = filter.toLowerCase();
        allMissoes.forEach((block, index) => {
            // CORREÇÃO AQUI: Adiciona o filtro de 'type'
            if (block.type !== 'missao') return;
            const missaoName = block.id;
            if (filter && !missaoName.toLowerCase().includes(filterLower)) return;
            const button = document.createElement('button');
            button.textContent = missaoName;
            button.title = missaoName;
            button.dataset.index = index;
            if (index === activeMissaoIndex) button.classList.add('active');
            button.addEventListener('click', () => populateMissaoForm(index));
            missoesListEl.appendChild(button);
        });
    }
    function populateMissaoForm(index) {
        if (index < 0 || index >= allMissoes.length || allMissoes[index].type !== 'missao') return;
        activeMissaoIndex = index;
        const missao = allMissoes[index];
        missaoIndexEl.value = index;
        missaoIdEl.value = missao.id || '';
        missaoContentEditor.setValue(missao.content || '');
        document.querySelectorAll('#missoes-list button').forEach(btn => btn.classList.toggle('active', btn.dataset.index == index));
        setTimeout(() => { 
            missaoContentEditor.refresh();
            decorateMissoesEditor(missaoContentEditor);
        }, 10);
    }
    function saveMissaoFormToLocalCache(e) {
        e.preventDefault();
        const index = parseInt(missaoIndexEl.value, 10);
        if (index < 0 || index >= allMissoes.length || allMissoes[index].type !== 'missao') { alert('Nenhuma missão selecionada.'); return; }
        allMissoes[index].id = missaoIdEl.value;
        allMissoes[index].content = missaoContentEditor.getValue();
        const button = missoesListEl.querySelector(`button[data-index="${index}"]`);
        if (button) { button.textContent = allMissoes[index].id; button.title = allMissoes[index].id; }
        alert('Missão atualizada na memória.');
    }
    function addNewMissao() {
        const newMissao = { type: 'missao', id: "NovaMissao", content: "{\n    // Adicione sua nova missão aqui\n}" };
        allMissoes.push(newMissao);
        const newIndex = allMissoes.length - 1;
        renderMissaoList(missoesSearchEl.value);
        populateMissaoForm(newIndex);
        missoesListEl.querySelector(`button[data-index="${newIndex}"]`).scrollIntoView();
    }
    async function saveAllMissoesToFile() {
        if (!confirm('Salvar o arquivo missoes.js?')) return;
        missoesSaveAllButton.disabled = true; missoesSaveAllButton.textContent = 'Salvando...';
        try {
            const currentIndex = parseInt(missaoIndexEl.value, 10);
            if (currentIndex >= 0 && currentIndex < allMissoes.length && allMissoes[currentIndex].type === 'missao') {
                allMissoes[currentIndex].id = missaoIdEl.value;
                allMissoes[currentIndex].content = missaoContentEditor.getValue();
            }
            const response = await fetch(`${API_URL}/api/save-missoes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allMissoes) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            alert(result.message);
        } catch (error) { alert(`Erro: ${error.message}`); } 
        finally { missoesSaveAllButton.disabled = false; missoesSaveAllButton.textContent = '💾 Salvar Missões'; }
    }
    missoesSearchEl.addEventListener('input', (e) => renderMissaoList(e.target.value));
    missoesFormEl.addEventListener('submit', saveMissaoFormToLocalCache);
    missoesSaveAllButton.addEventListener('click', saveAllMissoesToFile);
    missoesAddNewButton.addEventListener('click', addNewMissao);

    // =================================================================
    // GERENCIAMENTO DA ABA "TRADUÇÕES"
    // =================================================================
    async function loadTraducoes() {
        try {
            const response = await fetch(`${API_URL}/api/traducoes`);
            if (!response.ok) throw new Error((await response.json()).message);
            allTraducoes = await response.json();
            renderTraducaoList();
        } catch (error) { traducoesListEl.innerHTML = `<p style="color: red; padding: 10px;"><b>Erro:</b> ${error.message}</p>`; }
    }
    function renderTraducaoList(filter = '') {
        traducoesListEl.innerHTML = '';
        const filterLower = filter.toLowerCase();
        allTraducoes.forEach((block, index) => {
            if (block.type !== 'traducao') return; // Filtra blocos de texto
            const traducaoName = block.id;
            if (filter && !traducaoName.toLowerCase().includes(filterLower)) return;
            const button = document.createElement('button');
            button.textContent = traducaoName;
            button.title = traducaoName;
            button.dataset.index = index;
            if (index === activeTraducaoIndex) button.classList.add('active');
            button.addEventListener('click', () => populateTraducaoForm(index));
            traducoesListEl.appendChild(button);
        });
    }
    function populateTraducaoForm(index) {
        if (index < 0 || index >= allTraducoes.length || allTraducoes[index].type !== 'traducao') return;
        activeTraducaoIndex = index;
        const traducao = allTraducoes[index];
        traducaoIndexEl.value = index;
        traducaoIdEl.value = traducao.id || '';
        traducaoContentEditor.setValue(traducao.content || '');
        document.querySelectorAll('#traducoes-list button').forEach(btn => btn.classList.toggle('active', btn.dataset.index == index));
        setTimeout(() => { traducaoContentEditor.refresh(); }, 10);
    }
    function saveTraducaoFormToLocalCache(e) {
        e.preventDefault();
        const index = parseInt(traducaoIndexEl.value, 10);
        if (index < 0 || index >= allTraducoes.length || allTraducoes[index].type !== 'traducao') { alert('Nenhuma tradução selecionada.'); return; }
        allTraducoes[index].id = traducaoIdEl.value;
        allTraducoes[index].content = traducaoContentEditor.getValue();
        const button = traducoesListEl.querySelector(`button[data-index="${index}"]`);
        if (button) { button.textContent = allTraducoes[index].id; button.title = allTraducoes[index].id; }
        alert('Tradução atualizada na memória.');
    }
    function addNewTraducao() {
        const newTraducao = { type: 'traducao', id: "NovaTraducao", content: "{\n    // Adicione sua nova tradução aqui\n}" };
        allTraducoes.push(newTraducao);
        const newIndex = allTraducoes.length - 1;
        renderTraducaoList(traducoesSearchEl.value);
        populateTraducaoForm(newIndex);
        traducoesListEl.querySelector(`button[data-index="${newIndex}"]`).scrollIntoView();
    }
    async function saveAllTraducoesToFile() {
        if (!confirm('Salvar o arquivo traducao.js?')) return;
        traducoesSaveAllButton.disabled = true; traducoesSaveAllButton.textContent = 'Salvando...';
        try {
            const currentIndex = parseInt(traducaoIndexEl.value, 10);
            if (currentIndex >= 0 && currentIndex < allTraducoes.length && allTraducoes[currentIndex].type === 'traducao') {
                allTraducoes[currentIndex].id = traducaoIdEl.value;
                allTraducoes[currentIndex].content = traducaoContentEditor.getValue();
            }
            const response = await fetch(`${API_URL}/api/save-traducoes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allTraducoes) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            alert(result.message);
        } catch (error) { alert(`Erro: ${error.message}`); } 
        finally { traducoesSaveAllButton.disabled = false; traducoesSaveAllButton.textContent = '💾 Salvar Traduções'; }
    }
    traducoesSearchEl.addEventListener('input', (e) => renderTraducaoList(e.target.value));
    traducoesFormEl.addEventListener('submit', saveTraducaoFormToLocalCache);
    traducoesSaveAllButton.addEventListener('click', saveAllTraducoesToFile);
    traducoesAddNewButton.addEventListener('click', addNewTraducao);

    // --- Carregamento Inicial ---
    loadItems(); // Carrega os itens (e o mapa de lookup) imediatamente
    populateItemForm(-1);
    itemIndexEl.value = -1; 
    itemCommentEl.value = 'Selecione um item na lista ou clique em "Novo Item"';
});