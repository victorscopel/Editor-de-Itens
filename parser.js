const fs = require('fs').promises;
const path = require('path');

const FILE_PATH = path.join(__dirname, '../includes/itens.js');

// --- FUNÇÕES DE MINIFICAÇÃO (sem alteração) ---
function minifyHtml(html) {
    if (!html) return '';
    return html.replace(/(\r\n|\n|\r|\t)/g, "").replace(/>\s+</g, '><').replace(/'/g, "\\'").replace(/\s{2,}/g, ' ').trim();
}
function minifyJsObject(js) {
    if (!js) return null;
    return js.replace(/(\r\n|\n|\r|\t)/g, "").replace(/\s{2,}/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/:\s/g, ':').replace(/,\s/g, ',').replace(/{\s/g, '{').replace(/\s}/g, '}').trim();
}

// --- PARSER ATUALIZADO (MODO NÃO-DESTRUTIVO) ---
async function parseItemsFile() {
    console.log('\n[Parser] Iniciando parseItemsFile (Modo Não-Destrutivo)...');
    let fileContent;
    try {
        fileContent = await fs.readFile(FILE_PATH, 'utf-8');
    } catch (err) {
        throw new Error(`Não foi possível encontrar o arquivo em ${FILE_PATH}. Verifique se o editor está na pasta correta.`);
    }

    const processedBlocks = []; // Array misto (objetos 'item' e strings 'bloco de texto')
    
    // Regex de split: "divida ANTES de um \n seguido de // e qualquer texto"
    const blocks = fileContent.split(/\n(?=\/\/.+)/);
    
    console.log(`[Parser] Encontrados ${blocks.length} blocos.`);

    for (const [index, block] of blocks.entries()) {
        if (block.trim() === '') continue;

        const fullBlock = (block.startsWith('//') ? '' : '//') + block.trimStart();
        
        const commentMatch = fullBlock.match(/\/\/(.*?)\n/);
        const comment = commentMatch ? commentMatch[1].trim() : `Bloco ${index}`;

        // Tenta encontrar um item válido
        const htmlMatch = fullBlock.match(/var item([0-9a-zA-Z]+)\s*=\s*([`'])([\s\S]*?)\2;/s);

        if (htmlMatch) {
            // --- É UM ITEM VÁLIDO ---
            // Processa e adiciona como objeto
            const item = { 
                type: 'item', // Identificador para o frontend/backend
                comment: comment, 
                id: htmlMatch[1], 
                html: htmlMatch[3], 
                traducao: null, 
                bau: null, 
                tpc: null 
            };
            
            const tradRegex = new RegExp(`const item${item.id}_traducao\\s*=\\s*({[\\s\\S]*?});addTranslations\\(item${item.id}_traducao\\);`, 's');
            const bauRegex = new RegExp(`var item${item.id}_bau\\s*=\\s*({[\\s\\S]*?});`, 's');
            const tpcRegex = new RegExp(`var item${item.id}_tpc\\s*=\\s*({[\\s\\S]*?});`, 's');
            
            const tradMatch = fullBlock.match(tradRegex);
            const bauMatch = fullBlock.match(bauRegex);
            const tpcMatch = fullBlock.match(tpcRegex);

            if (tradMatch) item.traducao = tradMatch[1];
            if (bauMatch) item.bau = bauMatch[1];
            if (tpcMatch) item.tpc = tpcMatch[1];

            processedBlocks.push(item); // Adiciona o objeto do item

        } else {
            // --- NÃO É UM ITEM ---
            // (Ex: "//RECOMPENSAS QUEBRA CABEÇA...")
            // Adiciona o bloco de texto original para ser preservado
            console.log(`[Parser] Bloco "${comment}" MANTIDO COMO TEXTO.`);
            processedBlocks.push({
                type: 'comment', // Identificador
                fulltext: fullBlock 
            });
        }
    }
    
    console.log(`[Parser] Total de blocos processados: ${processedBlocks.length}`);
    return processedBlocks; // Retorna o array misto
}

// --- GERADOR DE ARQUIVO ATUALIZADO (MODO NÃO-DESTRUTIVO) ---
async function generateItemsFile(processedBlocks) {
    console.log(`Gerando novo itens.js com ${processedBlocks.length} blocos...`);
    let newFileContent = '';

    for (const block of processedBlocks) {
        
        if (block.type === 'item') {
            // É um objeto de item, formata e minifica
            const item = block;
            if (!item.id) continue;

            newFileContent += `//${item.comment}\n`;
            
            const minifiedHtml = minifyHtml(item.html);
            newFileContent += `var item${item.id} = '${minifiedHtml}';\n`;

            if (item.traducao && item.traducao.trim() !== 'null' && item.traducao.trim() !== '') {
                const minifiedTrad = minifyJsObject(item.traducao);
                newFileContent += `const item${item.id}_traducao=${minifiedTrad};addTranslations(item${item.id}_traducao);\n`;
            }

            if (item.bau && item.bau.trim() !== 'null' && item.bau.trim() !== '') {
                const minifiedBau = minifyJsObject(item.bau);
                newFileContent += `var item${item.id}_bau=${minifiedBau};\n`;
            }

            if (item.tpc && item.tpc.trim() !== 'null' && item.tpc.trim() !== '') {
                const minifiedTpc = minifyJsObject(item.tpc);
                newFileContent += `var item${item.id}_tpc=${minifiedTpc};\n`;
            }
            
            newFileContent += '\n'; // Adiciona uma linha em branco entre os blocos

        } else if (block.type === 'comment') {
            // É um bloco de texto puro (comentário, etc), só adiciona de volta
            newFileContent += block.fulltext + '\n\n'; // Adiciona o bloco e quebras de linha
        }
    }
    
    try {
        await fs.copyFile(FILE_PATH, `${FILE_PATH}.bak.${Date.now()}`);
        console.log('Backup do arquivo original criado (.bak.timestamp)');
    } catch (err) {
        console.warn('Não foi possível criar o backup.');
    }

    await fs.writeFile(FILE_PATH, newFileContent.trim(), 'utf-8');
    console.log('Novo arquivo itens.js salvo com sucesso (Modo Não-Destrutivo)!');
}

module.exports = { parseItemsFile, generateItemsFile };