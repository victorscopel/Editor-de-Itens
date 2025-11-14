const fs = require('fs').promises;
const path = require('path');
const { js_beautify } = require('js-beautify');

const FILE_PATH = path.join(__dirname, '../pacotes/includes/pacotes.js');
const beautifyOptions = { indent_size: 2, space_in_empty_paren: true };

// --- PARSER (Não-Destrutivo com matchAll) ---
async function parsePacotesFile() {
    console.log(`[Parser-Pacotes] Lendo arquivo: ${FILE_PATH}`);
    let fileContent;
    try {
        fileContent = await fs.readFile(FILE_PATH, 'utf-8');
    } catch (err) {
        console.warn(`[Parser-Pacotes] Arquivo não encontrado, criando array vazio.`);
        return [];
    }

    const processedBlocks = [];
    const packageRegex = /(?:window\.)?Pacotes\.([a-zA-Z0-9_]+)\s*=\s*({[\s\S]*?});/g;
    let lastIndex = 0;

    for (const match of fileContent.matchAll(packageRegex)) {
        // 1. Adiciona qualquer texto ANTES deste match como um bloco de 'text'
        const precedingText = fileContent.substring(lastIndex, match.index).trim();
        if (precedingText) {
            processedBlocks.push({ type: 'text', content: precedingText });
        }

        // 2. Adiciona o bloco de pacote como 'pacote'
        const id = match[1];
        let content = match[2];
        content = js_beautify(content, beautifyOptions);
        processedBlocks.push({
            type: 'pacote',
            id: id,
            content: content
        });

        // 3. Atualiza o índice
        lastIndex = match.index + match[0].length;
    }

    // 4. Adiciona qualquer texto que sobrou NO FINAL do arquivo
    const remainingText = fileContent.substring(lastIndex).trim();
    if (remainingText) {
        processedBlocks.push({ type: 'text', content: remainingText });
    }
    
    console.log(`[Parser-Pacotes] Blocos processados: ${processedBlocks.length}`);
    return processedBlocks;
}

// --- GERADOR DE ARQUIVO (Não-Destrutivo) ---
async function generatePacotesFile(processedBlocks) {
    console.log(`Gerando novo pacotes.js com ${processedBlocks.length} blocos...`);
    let fileContent = '';

    for (const block of processedBlocks) {
        if (block.type === 'pacote') {
            const cleanContent = block.content.trim();
            // Recria a linha de atribuição
            fileContent += `Pacotes.${block.id} = ${cleanContent};\n\n`;
        } else if (block.type === 'text') {
            // Adiciona o texto puro de volta
            fileContent += block.content + '\n\n'; // Garante espaço
        }
    }
    
    await fs.writeFile(FILE_PATH, fileContent.trim(), 'utf-8');
    console.log('Novo arquivo pacotes.js salvo com sucesso!');
}

module.exports = { parsePacotesFile, generatePacotesFile };