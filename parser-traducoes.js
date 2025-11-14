const fs = require('fs').promises;
const path = require('path');
const { js_beautify } = require('js-beautify');

const FILE_PATH = path.join(__dirname, '../includes/traducao.js');
const beautifyOptions = { indent_size: 2, space_in_empty_paren: true };

// --- PARSER (Não-Destrutivo com matchAll) ---
async function parseTraducoesFile() {
    console.log(`[Parser-Traducoes] Lendo arquivo: ${FILE_PATH}`);
    let fileContent;
    try {
        fileContent = await fs.readFile(FILE_PATH, 'utf-8');
    } catch (err) {
        console.warn(`[Parser-Traducoes] Arquivo não encontrado, criando array vazio.`);
        return [];
    }

    const processedBlocks = [];
    // Regex para encontrar "const NOME = { ... };"
    const traducaoRegex = /const ([a-zA-Z0-9_]+)\s*=\s*({[\s\S]*?});/g;
    let lastIndex = 0;
    
    for (const match of fileContent.matchAll(traducaoRegex)) {
        // 1. Adiciona texto 'text' (comentários, etc.)
        const precedingText = fileContent.substring(lastIndex, match.index).trim();
        if (precedingText) {
            processedBlocks.push({ type: 'text', content: precedingText });
        }

        // 2. Adiciona bloco 'traducao'
        const id = match[1]; // Ex: "TraducaoGeral"
        let content = match[2]; // O bloco { ... }
        content = js_beautify(content, beautifyOptions);
        
        processedBlocks.push({
            type: 'traducao',
            id: id,
            content: content
        });
        
        lastIndex = match.index + match[0].length;
    }

    // 3. Adiciona texto restante (ex: addTranslations())
    const remainingText = fileContent.substring(lastIndex).trim();
    if (remainingText) {
        processedBlocks.push({ type: 'text', content: remainingText });
    }
    
    console.log(`[Parser-Traducoes] Blocos processados: ${processedBlocks.length}`);
    return processedBlocks;
}

// --- GERADOR DE ARQUIVO (Não-Destrutivo) ---
async function generateTraducoesFile(processedBlocks) {
    console.log(`Gerando novo traducao.js com ${processedBlocks.length} blocos...`);
    let fileContent = '';

    for (const block of processedBlocks) {
        if (block.type === 'traducao') {
            const cleanContent = block.content.trim();
            // Salva no formato original 'const NOME = { ... };'
            fileContent += `const ${block.id} = ${cleanContent};\n\n`;
        } else if (block.type === 'text') {
            // Adiciona o texto puro de volta (comentários, addTranslations)
            fileContent += block.content + '\n\n';
        }
    }
    
    await fs.writeFile(FILE_PATH, fileContent.trim(), 'utf-8');
    console.log('Novo arquivo traducao.js salvo com sucesso!');
}

module.exports = { parseTraducoesFile, generateTraducoesFile };