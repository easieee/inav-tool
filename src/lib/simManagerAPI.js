/**
 * Google Sheets API v4 helpers for the iNAV SIM Manager.
 * Reads/writes the "SIM Cards", "Promos", and "Load Requests" tabs on a
 * dedicated spreadsheet. Supports both authenticated (OAuth token) and
 * public (GViz) reads, mirroring lib/devicesAPI.js.
 */

// Dedicated Google Sheet used to store SIM Manager data.
export const SIM_MANAGER_SPREADSHEET_ID = '1llAxoNekFzbUgROcC8iy5RD0HeGbUxevlZFI7eNMsFQ';

const TAB_NAMES = ['SIM Cards', 'Promos', 'Load Requests', 'Audit Logs'];

const SIM_HEADERS = [
  'ICCID', 'COMPANY', 'PLATE', 'IMEI', 'MODEL', 'BRAND', 'SIM',
  'REGULAR_BALANCE', 'LOAD_DATE', 'PROMO', 'PROMO_EXP',
  'DATE_OF_SUBS', 'EXPIRATION_OF_SUBS', 'LAST_UPDATED'
];
const PROMO_HEADERS = ['NAME', 'DURATION_DAYS', 'DESCRIPTION'];
const REQUEST_HEADERS = [
  'ID', 'TIMESTAMP', 'ICCID', 'SIM', 'COMPANY', 'PLATE',
  'TYPE', 'AMOUNT_OR_PROMO', 'STATUS', 'NOTES'
];
const AUDIT_LOG_HEADERS = [
  'ID', 'TIMESTAMP', 'TYPE', 'TITLE', 'DESCRIPTION', 'USER', 'USER_EMAIL'
];

// ─── GViz public-read helpers ─────────────────────────────────────────────

function parseGvizPayload(text) {
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('Invalid GViz response');
  return JSON.parse(text.slice(start, end + 1));
}

function gvizTableToRows(table) {
  const headers = (table.cols || []).map(col => String(col.label || col.id || '').trim());
  const rows = (table.rows || []).map(r =>
    (r.c || []).map(cell => {
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null) return String(cell.f);
      if (cell.v !== undefined && cell.v !== null) return String(cell.v);
      return '';
    })
  );
  return [headers, ...rows];
}

async function fetchPublicSheetValues(spreadsheetId, sheetName, expectedFirstHeader) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;
  const res  = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'This Google Sheet is not shared publicly. Sign in with a Google account that has access to it, ' +
        'or share the sheet with "Anyone with the link" to enable read-only viewing.'
      );
    }
    throw new Error(`Public sheet read failed (${res.status})`);
  }
  const payload = parseGvizPayload(text);
  if (payload.status !== 'ok' || !payload.table) {
    return [[]];
  }
  const rows = gvizTableToRows(payload.table);
  // Google's GViz endpoint silently falls back to the spreadsheet's default/first
  // sheet when the requested tab name doesn't exist, instead of returning an error.
  // Guard against that by checking the header row actually matches what we expect.
  if (expectedFirstHeader && String(rows[0]?.[0] || '').trim().toUpperCase() !== expectedFirstHeader) {
    return [[]];
  }
  return rows;
}

/**
 * Fetches the titles of all tabs currently on the spreadsheet.
 * Throws on real auth/permission errors so callers can surface them.
 */
async function fetchSheetTitles(accessToken, spreadsheetId) {
  let res;
  try {
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (err) {
    throw new Error(`Failed to connect to Google Sheets API: ${err.message || String(err)}`);
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expired — please sign in again.');
    if (res.status === 403) {
      throw new Error(
        `You don't have access to this spreadsheet. Ask the sheet owner to share it with your signed-in Google account as an Editor.`
      );
    }
    throw new Error(`Google Sheets API error (${res.status})`);
  }
  const data = await res.json();
  return new Set((data.sheets || []).map(s => s.properties?.title));
}

async function fetchAuthenticatedValues(accessToken, spreadsheetId, ranges) {
  const query = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${query}`;

  let res;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch (err) {
    throw new Error(`Failed to connect to Google Sheets API: ${err.message || String(err)}`);
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expired — please sign in again.');
    const errText = await res.text();
    let message = `Google Sheets API error (${res.status})`;
    try { const j = JSON.parse(errText); if (j.error?.message) message = j.error.message; } catch {}
    if (res.status === 403) {
      throw new Error(
        `You don't have access to this spreadsheet. Ask the sheet owner to share it with your signed-in ` +
        `Google account as an Editor. (${message})`
      );
    }
    if (res.status === 400 && /unable to parse range/i.test(message)) {
      // The SIM Cards / Promos / Load Requests tabs haven't been created on this
      // spreadsheet yet — treat as "no data yet" instead of a hard failure.
      return [];
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data.valueRanges || [];
}

// ─── Row <-> object parsing ────────────────────────────────────────────────

function rowsToSims(rows) {
  const sims = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;
    sims.push({
      iccid: row[0] || '',
      company: row[1] || '',
      plate: row[2] || '',
      imei: row[3] || '',
      model: row[4] || '',
      brand: row[5] || '',
      sim: row[6] || '',
      regularBalance: parseFloat(row[7]) || 0,
      loadDate: row[8] || '',
      promo: row[9] || '',
      promoExp: row[10] || '',
      dateOfSubs: row[11] || '',
      expirationOfSubs: row[12] || '',
      lastUpdated: row[13] || new Date().toISOString(),
    });
  }
  return sims;
}

function rowsToPromos(rows) {
  const promos = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;
    promos.push({
      name: row[0] || '',
      durationDays: parseInt(row[1], 10) || 0,
      description: row[2] || '',
    });
  }
  return promos;
}

function rowsToRequests(rows) {
  const requests = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;
    requests.push({
      id: row[0] || '',
      timestamp: row[1] || '',
      iccid: row[2] || '',
      sim: row[3] || '',
      company: row[4] || '',
      plate: row[5] || '',
      type: row[6] || 'Regular',
      amountOrPromo: row[7] || '',
      status: row[8] || 'Pending',
      notes: row[9] || '',
    });
  }
  return requests;
}

function rowsToAuditLogs(rows) {
  const logs = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;
    logs.push({
      id: row[0] || '',
      timestamp: row[1] || '',
      type: row[2] || '',
      title: row[3] || '',
      description: row[4] || '',
      user: row[5] || '',
      userEmail: row[6] || '',
    });
  }
  return logs;
}

/**
 * Load SIMs / Promos / Load Requests from the SIM Manager spreadsheet.
 * Pass `accessToken = null` for unauthenticated public reads via GViz.
 * @returns {Promise<{sims: object[], promos: object[], loadRequests: object[]}>}
 */
export async function loadSimManagerFromSheets(accessToken, spreadsheetId) {
  let simRows, promoRows, requestRows, auditLogRows;

  if (accessToken) {
    // Only request ranges for tabs that actually exist. A single batchGet call
    // fails entirely if ANY referenced range points at a tab that doesn't exist
    // yet (e.g. a brand-new 'Audit Logs' tab), which would otherwise wipe out
    // perfectly good data from the other tabs.
    const existingTitles = await fetchSheetTitles(accessToken, spreadsheetId);
    const wantedRanges = [
      ['SIM Cards', 'SIM Cards!A1:N2000'],
      ['Promos', 'Promos!A1:C500'],
      ['Load Requests', 'Load Requests!A1:J2000'],
      ['Audit Logs', 'Audit Logs!A1:G500'],
    ].filter(([title]) => existingTitles.has(title));

    const valueRanges = wantedRanges.length > 0
      ? await fetchAuthenticatedValues(accessToken, spreadsheetId, wantedRanges.map(([, range]) => range))
      : [];
    simRows       = valueRanges.find(v => v.range?.includes('SIM Cards'))?.values     || [];
    promoRows     = valueRanges.find(v => v.range?.includes('Promos'))?.values        || [];
    requestRows   = valueRanges.find(v => v.range?.includes('Load Requests'))?.values || [];
    auditLogRows  = valueRanges.find(v => v.range?.includes('Audit Logs'))?.values    || [];
  } else {
    [simRows, promoRows, requestRows, auditLogRows] = await Promise.all([
      fetchPublicSheetValues(spreadsheetId, 'SIM Cards', 'ICCID'),
      fetchPublicSheetValues(spreadsheetId, 'Promos', 'NAME'),
      fetchPublicSheetValues(spreadsheetId, 'Load Requests', 'ID'),
      fetchPublicSheetValues(spreadsheetId, 'Audit Logs', 'ID'),
    ]);
  }

  return {
    sims: rowsToSims(simRows),
    promos: rowsToPromos(promoRows),
    loadRequests: rowsToRequests(requestRows),
    auditLogs: rowsToAuditLogs(auditLogRows),
  };
}

/**
 * Ensure the SIM Cards / Promos / Load Requests tabs exist on the spreadsheet.
 * Creates any missing tabs so writes never fail on a spreadsheet that hasn't
 * been initialized yet.
 */
async function ensureTabsExist(accessToken, spreadsheetId) {
  let res;
  try {
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch {
    return; // best-effort; the write step below will surface any real error
  }
  if (!res.ok) return;

  const data = await res.json();
  const existing = new Set((data.sheets || []).map(s => s.properties?.title));
  const missing = TAB_NAMES.filter(name => !existing.has(name));
  if (missing.length === 0) return;

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: missing.map(title => ({ addSheet: { properties: { title } } })),
    }),
  }).catch(() => {});
}

/**
 * Overwrite SIMs / Promos / Load Requests / Audit Logs on the SIM Manager spreadsheet.
 * @param {string} accessToken
 * @param {string} spreadsheetId
 * @param {object[]} sims
 * @param {object[]} promos
 * @param {object[]} requests
 * @param {object[]} auditLogs
 */
export async function saveSimManagerToSheets(accessToken, spreadsheetId, sims, promos, requests, auditLogs = []) {
  await ensureTabsExist(accessToken, spreadsheetId);

  const simRows = [
    SIM_HEADERS,
    ...sims.map(s => [
      s.iccid || '', s.company || '', s.plate || '', s.imei || '', s.model || '', s.brand || '', s.sim || '',
      Number(s.regularBalance) || 0, s.loadDate || '', s.promo || '', s.promoExp || '',
      s.dateOfSubs || '', s.expirationOfSubs || '', s.lastUpdated || new Date().toISOString(),
    ]),
  ];
  const promoRows = [
    PROMO_HEADERS,
    ...promos.map(p => [p.name || '', Number(p.durationDays) || 0, p.description || '']),
  ];
  const requestRows = [
    REQUEST_HEADERS,
    ...requests.map(r => [
      r.id || '', r.timestamp || '', r.iccid || '', r.sim || '', r.company || '', r.plate || '',
      r.type || '', r.amountOrPromo || '', r.status || '', r.notes || '',
    ]),
  ];
  const auditLogRows = [
    AUDIT_LOG_HEADERS,
    ...auditLogs.map(a => [
      a.id || '', a.timestamp || '', a.type || '', a.title || '', a.description || '',
      a.user || '', a.userEmail || '',
    ]),
  ];

  // 1. Clear stale rows beyond current data
  let clearRes;
  try {
    clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranges: ['SIM Cards!A1:N2000', 'Promos!A1:C500', 'Load Requests!A1:J2000', 'Audit Logs!A1:G500'] }),
    });
  } catch (err) {
    throw new Error(`Network error while clearing spreadsheet: ${err.message || String(err)}`);
  }
  if (!clearRes.ok) {
    if (clearRes.status === 401) throw new Error('UNAUTHORIZED: Google OAuth session expired. Please sign in again.');
    const errText = await clearRes.text();
    let message = `Failed to clear sheet ranges (${clearRes.status})`;
    try { const j = JSON.parse(errText); if (j.error?.message) message = j.error.message; } catch {}
    throw new Error(message);
  }

  // 2. Write current data in one batch
  let updateRes;
  try {
    updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `SIM Cards!A1:N${simRows.length}`,        values: simRows },
          { range: `Promos!A1:C${promoRows.length}`,         values: promoRows },
          { range: `Load Requests!A1:J${requestRows.length}`, values: requestRows },
          { range: `Audit Logs!A1:G${auditLogRows.length}`,   values: auditLogRows },
        ],
      }),
    });
  } catch (err) {
    throw new Error(`Network error while updating spreadsheet: ${err.message || String(err)}`);
  }
  if (!updateRes.ok) {
    const errText = await updateRes.text();
    let message = `Failed to update sheet ranges (${updateRes.status})`;
    try { const j = JSON.parse(errText); if (j.error?.message) message = j.error.message; } catch {}
    throw new Error(message);
  }
}
