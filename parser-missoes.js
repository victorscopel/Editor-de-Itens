const fs = require('fs').promises;
const path = require('path');
const { js_beautify } = require('js-beautify');

const FILE_PATH = path.join(__dirname, '../guias/includes/missoes.js');
const beautifyOptions = { indent_size: 2, space_in_empty_paren: true };

// --- PARSER (Não-Destrutivo com matchAll) ---
async function parseMissoesFile() {
    console.log(`[Parser-Missoes] Lendo arquivo: ${FILE_PATH}`);
    let fileContent;
    try {
        fileContent = await fs.readFile(FILE_PATH, 'utf-8');
    } catch (err) {
        console.warn(`[Parser-Missoes] Arquivo não encontrado, criando array vazio.`);
        return [];
    }

    const processedBlocks = [];
    const missaoRegex = /(?:window\.)?Missoes\.([a-zA-Z0-9_]+)\s*=\s*({[\s\S]*?});/g;
    let lastIndex = 0;

    for (const match of fileContent.matchAll(missaoRegex)) {
        // 1. Adiciona texto 'text'
        const precedingText = fileContent.substring(lastIndex, match.index).trim();
        if (precedingText) {
            processedBlocks.push({ type: 'text', content: precedingText });
        }

        // 2. Adiciona bloco 'missao'
        const id = match[1];
        let content = match[2];
        content = js_beautify(content, beautifyOptions);
        processedBlocks.push({
            type: 'missao',
            id: id,
            content: content
        });
        
        lastIndex = match.index + match[0].length;
    }

    // 3. Adiciona texto restante
    const remainingText = fileContent.substring(lastIndex).trim();
    if (remainingText) {
        processedBlocks.push({ type: 'text', content: remainingText });
    }
    
    console.log(`[Parser-Missoes] Blocos processados: ${processedBlocks.length}`);
    return processedBlocks;
}

// --- GERADOR DE ARQUIVO (Não-Destrutivo) ---
async function generateMissoesFile(processedBlocks) {
    console.log(`Gerando novo missoes.js com ${processedBlocks.length} blocos...`);
    let fileContent = '';

    for (const block of processedBlocks) {
        if (block.type === 'missao') {
            const cleanContent = block.content.trim();
            fileContent += `Missoes.${block.id} = ${cleanContent};\n\n`;
        } else if (block.type === 'text') {
            fileContent += block.content + '\n\n';
        }
    }
    
    await fs.writeFile(FILE_PATH, fileContent.trim(), 'utf-8');
    console.log('Novo arquivo missoes.js salvo com sucesso!');
}

module.exports = { parseMissoesFile, generateMissoesFile };