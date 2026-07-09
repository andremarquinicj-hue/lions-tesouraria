// Backup diário do Firestore — Lions Clube Tesouraria
// Executado pelo GitHub Actions (.github/workflows/backup.yml)
// Gera arquivos em backups/ no MESMO formato do backup manual do app,
// então qualquer arquivo pode ser restaurado via "Configurações → Importar backup".

const PROJECT = 'lions-tesouraria';
const API_KEY = process.env.FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const fs = require('fs');
const path = require('path');

// Converte o formato tipado do Firestore REST para JSON puro
function converter(v) {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.mapValue !== undefined) return converterCampos(v.mapValue.fields || {});
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(converter);
  return null;
}
function converterCampos(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) obj[k] = converter(v);
  return obj;
}

async function buscarJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Erro ${r.status} ao acessar ${url}: ${await r.text()}`);
  return r.json();
}

async function main() {
  if (!API_KEY) throw new Error('Secret FIREBASE_API_KEY não configurado no repositório.');

  // 1. Config do clube (documento lions/config)
  const cfgDoc = await buscarJSON(`${BASE}/lions/config?key=${API_KEY}`);
  const config = converterCampos(cfgDoc.fields || {});

  // 2. Coleções (com paginação)
  async function baixarColecao(nome) {
    const itens = [];
    let pageToken = '';
    do {
      const url = `${BASE}/${nome}?pageSize=300&key=${API_KEY}` +
        (pageToken ? `&pageToken=${pageToken}` : '');
      const resp = await buscarJSON(url);
      for (const doc of resp.documents || []) {
        const id = doc.name.split('/').pop();
        itens.push({ id, ...converterCampos(doc.fields || {}) });
      }
      pageToken = resp.nextPageToken || '';
    } while (pageToken);
    return itens;
  }
  const lancamentos = await baixarColecao('lions_lancamentos');
  const compromissos = await baixarColecao('lions_compromissos');
  const mensalidades = await baixarColecao('lions_mensalidades');

  // 3. Grava o backup do dia + um "mais-recente" fixo
  const hoje = new Date().toISOString().slice(0, 10);
  const conteudo = JSON.stringify(
    { geradoEm: new Date().toISOString(), config, lancamentos, compromissos, mensalidades }, null, 2);
  fs.mkdirSync('backups', { recursive: true });
  fs.writeFileSync(path.join('backups', `backup-${hoje}.json`), conteudo);
  fs.writeFileSync(path.join('backups', 'mais-recente.json'), conteudo);

  // 4. Retenção: apaga backups diários com mais de 90 dias
  const limite = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  for (const arq of fs.readdirSync('backups')) {
    const m = arq.match(/^backup-(\d{4}-\d{2}-\d{2})\.json$/);
    if (m && m[1] < limite) fs.unlinkSync(path.join('backups', arq));
  }

  console.log(`✅ Backup concluído: ${lancamentos.length} lançamentos, ${compromissos.length} compromissos e ${mensalidades.length} mensalidades em backups/backup-${hoje}.json`);
}

main().catch(e => { console.error('❌ Falha no backup:', e.message); process.exit(1); });
