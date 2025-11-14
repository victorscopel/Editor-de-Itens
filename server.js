const express = require('express');
const cors = require('cors');
const path = require('path');

// Importa os parsers
const itemParser = require('./parser');
const pacoteParser = require('./parser-pacotes');
const missaoParser = require('./parser-missoes');
const traducaoParser = require('./parser-traducoes'); // NOVO

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API DE ITENS ---
app.get('/api/items', async (req, res) => {
    try {
        const items = await itemParser.parseItemsFile();
        res.json(items);
    } catch (error) { res.status(500).json({ success: false, message: `Erro em itens.js: ${error.message}` }); }
});
app.post('/api/save', async (req, res) => {
    try {
        await itemParser.generateItemsFile(req.body);
        res.json({ success: true, message: 'Arquivo itens.js salvo com sucesso!' });
    } catch (error) { res.status(500).json({ success: false, message: `Erro ao salvar itens.js: ${error.message}` }); }
});

// --- API DE PACOTES ---
app.get('/api/pacotes', async (req, res) => {
    try {
        const pacotes = await pacoteParser.parsePacotesFile();
        res.json(pacotes);
    } catch (error) { res.status(500).json({ success: false, message: `Erro em pacotes.js: ${error.message}` }); }
});
app.post('/api/save-pacotes', async (req, res) => {
    try {
        await pacoteParser.generatePacotesFile(req.body);
        res.json({ success: true, message: 'Arquivo pacotes.js salvo com sucesso!' });
    } catch (error) { res.status(500).json({ success: false, message: `Erro ao salvar pacotes.js: ${error.message}` }); }
});

// --- API DE MISSÕES ---
app.get('/api/missoes', async (req, res) => {
    try {
        const missoes = await missaoParser.parseMissoesFile();
        res.json(missoes);
    } catch (error) { res.status(500).json({ success: false, message: `Erro em missoes.js: ${error.message}` }); }
});
app.post('/api/save-missoes', async (req, res) => {
    try {
        await missaoParser.generateMissoesFile(req.body);
        res.json({ success: true, message: 'Arquivo missoes.js salvo com sucesso!' });
    } catch (error) { res.status(500).json({ success: false, message: `Erro ao salvar missoes.js: ${error.message}` }); }
});

// --- API DE TRADUÇÕES (NOVO) ---
app.get('/api/traducoes', async (req, res) => {
    try {
        const traducoes = await traducaoParser.parseTraducoesFile();
        res.json(traducoes);
    } catch (error) { res.status(500).json({ success: false, message: `Erro em traducao.js: ${error.message}` }); }
});
app.post('/api/save-traducoes', async (req, res) => {
    try {
        await traducaoParser.generateTraducoesFile(req.body);
        res.json({ success: true, message: 'Arquivo traducao.js salvo com sucesso!' });
    } catch (error) { res.status(500).json({ success: false, message: `Erro ao salvar traducao.js: ${error.message}` }); }
});

app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  Editor de Itens rodando!`);
    console.log(`  Acesse em seu navegador: http://localhost:${PORT}`);
    console.log(`=================================================`);
});