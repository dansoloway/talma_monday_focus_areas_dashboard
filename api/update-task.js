const https = require('https');

const TOKEN = (process.env.MONDAY_API_TOKEN || '').trim();

function api(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.monday.com', path: '/v2', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': TOKEN, 'API-Version': '2024-10' },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) return resolve(req.body);
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = await readBody(req);
    const { boardId, itemId, status, startDate, endDate } = body;
    if (!boardId || !itemId) return res.status(400).json({ error: 'Missing boardId/itemId' });

    const colsRes = await api(`{ boards(ids: [${Number(boardId)}]) { columns { id title } } }`);
    const cols = colsRes.data?.boards?.[0]?.columns || [];
    const statusColId = cols.find((c) => c.title === 'Status')?.id;
    const timelineColId = cols.find((c) => c.title === 'Timeline')?.id;

    const colValues = {};
    if (status !== undefined && statusColId) colValues[statusColId] = status ? { label: status } : {};
    if (startDate && endDate && timelineColId) colValues[timelineColId] = { from: startDate, to: endDate };

    if (!Object.keys(colValues).length) return res.status(400).json({ error: 'Nothing to update' });

    const colVal = JSON.stringify(JSON.stringify(colValues));
    const mutRes = await api(`mutation { change_multiple_column_values(board_id: ${Number(boardId)}, item_id: ${Number(itemId)}, column_values: ${colVal}) { id } }`);

    if (mutRes.errors) return res.status(500).json({ error: 'Monday error', detail: mutRes.errors });
    if (mutRes.data?.change_multiple_column_values) return res.status(200).json({ ok: true });
    return res.status(500).json({ error: 'Update failed', detail: mutRes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};