const https = require('https');

const TOKEN = (process.env.MONDAY_API_TOKEN || '').trim();

const BOARDS = [
  { id: 5094162683, name: 'Full Year' },
  { id: 5094574505, name: 'Technology' },
  { id: 5094576859, name: 'Resource Development - Israel' },
  { id: 5094580197, name: 'H.R' },
  { id: 5094581545, name: 'Pedagogy' },
  { id: 5094583693, name: 'Resources - USA' },
  { id: 5094585976, name: 'Finance' },
];

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

async function fetchBoardItems(board) {
  let allItems = [];
  let cursor = null;

  do {
    const cursorClause = cursor ? `cursor: "${cursor}"` : 'limit: 500';
    const res = await api(`{
      boards(ids: [${board.id}]) {
        columns { id title }
        items_page(${cursorClause}) {
          cursor
          items {
            id
            name
            column_values {
              id text
              ... on BoardRelationValue { display_value }
            }
          }
        }
      }
    }`);
    const b = res.data?.boards?.[0];
    if (!b) break;
    const titleById = {};
    b.columns.forEach((c) => { titleById[c.id] = c.title; });

    for (const item of b.items_page.items) {
      const cols = {};
      for (const cv of item.column_values) {
        const title = titleById[cv.id];
        cols[title] = cv.display_value || cv.text || '';
      }
      allItems.push({
        id: item.id,
        name: item.name,
        board: board.name,
        boardId: board.id,
        strategic: cols['TALMA Strategic Objective'] || '',
        status: cols['Status'] || '',
        timeline: cols['Timeline'] || '',
        focusAreas: (cols['Focus Areas'] || '').split(',').map((s) => s.trim()).filter(Boolean),
      });
    }
    cursor = b.items_page.cursor;
  } while (cursor);

  return allItems;
}

module.exports = async function handler(req, res) {
  try {
    const all = await Promise.all(BOARDS.map(fetchBoardItems));
    const items = all.flat();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ items, fetchedAt: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};