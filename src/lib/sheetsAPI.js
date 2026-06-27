/**
 * Google Sheets API v4 helpers
 * All row operations use a soft approach: deletions clear the row content
 * so the row ID lookup stays consistent. Empty rows are filtered on read.
 */

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const SHEET_HEADERS = {
  Technicians: ['id', 'name', 'email', 'phone', 'points', 'createdAt'],
  JobOrders: [
    'id', 'title', 'description', 'client', 'location', 'device',
    'date', 'startTime', 'endTime', 'technicianIds', 'status',
    'createdBy', 'createdByEmail', 'createdAt', 'isBackJob', 'originalJobId'
  ],
  JobHistory: [
    'id', 'title', 'description', 'client', 'location', 'device',
    'date', 'startTime', 'endTime', 'technicianIds',
    'createdBy', 'createdByEmail', 'createdAt', 'completedAt',
    'isBackJob', 'originalJobId'
  ]
};

async function apiFetch(url, options = {}, token) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Sheets API error (${res.status})`);
  }
  return data;
}

function rowToObject(row, sheetName) {
  const headers = SHEET_HEADERS[sheetName];
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });

  // Parse arrays stored as pipe-separated strings
  if (obj.technicianIds !== undefined) {
    obj.technicianIds = obj.technicianIds
      ? obj.technicianIds.split('|').filter(Boolean)
      : [];
  }
  // Parse numeric points
  if (obj.points !== undefined) {
    obj.points = parseInt(obj.points, 10) || 0;
  }
  return obj;
}

function objectToRow(obj, sheetName) {
  const headers = SHEET_HEADERS[sheetName];
  return headers.map(h => {
    const v = obj[h];
    if (h === 'technicianIds' && Array.isArray(v)) return v.join('|');
    return v !== undefined && v !== null ? String(v) : '';
  });
}

/** Read all non-empty rows from a sheet, returns array of objects */
export async function getAllRows(spreadsheetId, sheetName, token) {
  try {
    const data = await apiFetch(
      `${BASE}/${spreadsheetId}/values/${sheetName}`,
      {},
      token
    );
    const values = data.values || [];
    if (values.length === 0) return [];

    // Skip header row (row[0]) and empty rows
    return values
      .slice(1)
      .filter(row => row && row[0])
      .map(row => rowToObject(row, sheetName));
  } catch (err) {
    console.error(`getAllRows(${sheetName}):`, err.message);
    return [];
  }
}

/** Append a new row to a sheet */
export async function appendRow(spreadsheetId, sheetName, obj, token) {
  const row = objectToRow(obj, sheetName);
  return apiFetch(
    `${BASE}/${spreadsheetId}/values/${sheetName}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: [row] }) },
    token
  );
}

/** Update an existing row identified by its id */
export async function updateRowById(spreadsheetId, sheetName, id, updates, token) {
  const data = await apiFetch(
    `${BASE}/${spreadsheetId}/values/${sheetName}`,
    {},
    token
  );
  const values = data.values || [];

  // rowIndex in the values array (0 = header, 1+ = data)
  const rowIndex = values.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) throw new Error(`Row id=${id} not found in ${sheetName}`);

  // Build the current object, then merge updates
  const current = rowToObject(values[rowIndex], sheetName);
  const merged = { ...current, ...updates };
  const newRow = objectToRow(merged, sheetName);

  const sheetRowNum = rowIndex + 1; // 1-based sheet row
  return apiFetch(
    `${BASE}/${spreadsheetId}/values/${sheetName}!A${sheetRowNum}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [newRow] }) },
    token
  );
}

/** Clear a row's cells (soft delete) — row is then filtered out on read */
export async function deleteRowById(spreadsheetId, sheetName, id, token) {
  const data = await apiFetch(
    `${BASE}/${spreadsheetId}/values/${sheetName}`,
    {},
    token
  );
  const values = data.values || [];
  const rowIndex = values.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) throw new Error(`Row id=${id} not found in ${sheetName}`);

  const sheetRowNum = rowIndex + 1;
  const emptyRow = new Array(SHEET_HEADERS[sheetName].length).fill('');
  return apiFetch(
    `${BASE}/${spreadsheetId}/values/${sheetName}!A${sheetRowNum}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [emptyRow] }) },
    token
  );
}

/**
 * Ensure all required sheet tabs exist and have their header row.
 * Creates missing tabs automatically — safe to call on every load.
 */
export async function initializeSheets(spreadsheetId, token) {
  // 1. Fetch spreadsheet metadata to see which tabs already exist
  const meta = await apiFetch(
    `${BASE}/${spreadsheetId}?fields=sheets(properties(title))`,
    {},
    token
  );
  const existing = new Set((meta.sheets || []).map(s => s.properties.title));

  // 2. Create any missing tabs in one batch request
  const missing = Object.keys(SHEET_HEADERS).filter(name => !existing.has(name));
  if (missing.length > 0) {
    await apiFetch(
      `${BASE}/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: missing.map(title => ({ addSheet: { properties: { title } } }))
        })
      },
      token
    );
  }

  // 3. Ensure every tab has its header row
  for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
    try {
      const data = await apiFetch(
        `${BASE}/${spreadsheetId}/values/${sheetName}!A1:Z1`,
        {},
        token
      );
      if (!data.values || data.values.length === 0 || data.values[0][0] !== headers[0]) {
        await apiFetch(
          `${BASE}/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=RAW`,
          { method: 'PUT', body: JSON.stringify({ values: [headers] }) },
          token
        );
      }
    } catch (err) {
      console.warn(`Could not init headers for ${sheetName}:`, err.message);
    }
  }
}
