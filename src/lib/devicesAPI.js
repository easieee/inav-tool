/**
 * Google Sheets API v4 helpers for Devices / Sensors / Accessories data.
 * Supports both authenticated (OAuth token) and public (GViz) reads.
 */

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

async function fetchPublicSheetValues(spreadsheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;
  const res  = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`Public sheet read failed (${res.status})`);
  const payload = parseGvizPayload(text);
  if (payload.status !== 'ok' || !payload.table) {
    const detail = payload.errors?.[0]?.detailed_message || payload.errors?.[0]?.message || 'Unknown error';
    throw new Error(`Public sheet read failed: ${detail}`);
  }
  return gvizTableToRows(payload.table);
}

// ─── Parsers ──────────────────────────────────────────────────────────────

function parseSheetsAPIRows(values) {
  if (!values || values.length < 1) return [];
  const headers = values[0].map(h => String(h || '').toLowerCase().trim());
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) obj[header] = row[index] !== undefined ? row[index] : '';
    });
    return obj;
  });
}

function parseAppsScriptDevices(rawList) {
  if (!rawList || !Array.isArray(rawList)) return [];
  return rawList.map(item => {
    const platformsRaw  = item.platforms  || item.Platforms  || '';
    const sensorsRaw    = item.sensors    || item.Sensors    || '';
    const accRaw        = item.accessories || item.Accessories || '';
    const camerasRaw    =
      item['cameras supported'] !== undefined ? item['cameras supported']
      : item.camerasSupported  !== undefined ? item.camerasSupported
      : item.CamerasSupported;
    return {
      id:               String(item.id   || item.ID   || '').trim(),
      name:             String(item.name || item.Name || '').trim(),
      category:         (item.category   || item.Category   || 'Standard Tracker').trim(),
      camerasSupported: Number(camerasRaw) || 0,
      platforms:        typeof platformsRaw === 'string'
        ? platformsRaw.split(',').map(p => p.trim()).filter(Boolean)
        : Array.isArray(platformsRaw) ? platformsRaw : [],
      sensors:          typeof sensorsRaw === 'string'
        ? sensorsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(sensorsRaw) ? sensorsRaw : [],
      accessories:      typeof accRaw === 'string'
        ? accRaw.split(',').map(a => a.trim()).filter(Boolean)
        : Array.isArray(accRaw) ? accRaw : [],
      description:      String(item.description || item.Description || '').trim(),
      imageUrl:         String(item['image url'] || item.imageUrl || item.ImageUrl || '').trim() || undefined,
    };
  }).filter(d => d.id && d.name);
}

function parseAppsScriptSensors(rawList) {
  if (!rawList || !Array.isArray(rawList)) return [];
  return rawList.map(item => ({
    id:          String(item.id   || item.ID   || '').trim(),
    name:        String(item.name || item.Name || '').trim(),
    type:        (item.type || item.Type || 'Digital').trim(),
    description: String(item.description || item.Description || '').trim(),
  })).filter(s => s.id && s.name);
}

function parseAppsScriptAccessories(rawList) {
  if (!rawList || !Array.isArray(rawList)) return [];
  return rawList.map(item => ({
    id:          String(item.id   || item.ID   || '').trim(),
    name:        String(item.name || item.Name || '').trim(),
    description: String(item.description || item.Description || '').trim(),
  })).filter(a => a.id && a.name);
}

// ─── API Calls ────────────────────────────────────────────────────────────

/**
 * Load Devices / Sensors / Accessories from a Google Spreadsheet.
 * Pass `accessToken = null` for unauthenticated public reads via GViz.
 * @param {string|null} accessToken
 * @param {string} spreadsheetId
 * @returns {Promise<{devices, sensors, accessories}>}
 */
export async function loadDevicesFromSheets(accessToken, spreadsheetId) {
  let devicesValues, sensorsValues, accessoriesValues;

  if (accessToken) {
    // ── Authenticated read via Sheets API v4 ──────────────────
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet`
      + `?ranges=Devices!A1:I1000&ranges=Sensors!A1:D1000&ranges=Accessories!A1:C1000`;

    let res;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      throw new Error(`Failed to connect to Google Sheets API: ${err.message || String(err)}`);
    }

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Session expired — please sign in again.');
      }
      const errText = await res.text();
      let message = `Google Sheets API error (${res.status})`;
      try { const j = JSON.parse(errText); if (j.error?.message) message = j.error.message; } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const vr   = data.valueRanges || [];
    devicesValues     = parseSheetsAPIRows(vr.find(v => v.range?.includes('Devices'))?.values     || []);
    sensorsValues     = parseSheetsAPIRows(vr.find(v => v.range?.includes('Sensors'))?.values     || []);
    accessoriesValues = parseSheetsAPIRows(vr.find(v => v.range?.includes('Accessories'))?.values || []);
  } else {
    // ── Public read via GViz (no auth required) ───────────────
    const [devRaw, senRaw, accRaw] = await Promise.all([
      fetchPublicSheetValues(spreadsheetId, 'Devices'),
      fetchPublicSheetValues(spreadsheetId, 'Sensors'),
      fetchPublicSheetValues(spreadsheetId, 'Accessories'),
    ]);
    devicesValues     = parseSheetsAPIRows(devRaw);
    sensorsValues     = parseSheetsAPIRows(senRaw);
    accessoriesValues = parseSheetsAPIRows(accRaw);
  }

  return {
    devices:     parseAppsScriptDevices(devicesValues),
    sensors:     parseAppsScriptSensors(sensorsValues),
    accessories: parseAppsScriptAccessories(accessoriesValues),
  };
}

/**
 * Overwrite Devices / Sensors / Accessories in the Google Spreadsheet.
 * @param {string} accessToken
 * @param {string} spreadsheetId
 * @param {object[]} devices
 * @param {object[]} sensors
 * @param {object[]} accessories
 */
export async function saveDevicesToSheets(accessToken, spreadsheetId, devices, sensors, accessories) {
  // 1. Clear existing ranges
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;
  let clearRes;
  try {
    clearRes = await fetch(clearUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranges: ['Devices!A1:I1000', 'Sensors!A1:D1000', 'Accessories!A1:C1000'] }),
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

  // 2. Build row data
  const deviceHeaders = ['ID', 'Name', 'Category', 'Cameras Supported', 'Platforms', 'Sensors', 'Accessories', 'Description', 'Image URL'];
  const sensorHeaders = ['ID', 'Name', 'Type', 'Description'];
  const accHeaders    = ['ID', 'Name', 'Description'];

  const deviceRows = [
    deviceHeaders,
    ...devices.map(d => [
      d.id || '', d.name || '', d.category || 'Standard Tracker',
      Number(d.camerasSupported) || 0,
      (d.platforms    || []).join(','),
      (d.sensors      || []).join(','),
      (d.accessories  || []).join(','),
      d.description || '', d.imageUrl || '',
    ]),
  ];
  const sensorRows = [
    sensorHeaders,
    ...sensors.map(s => [s.id || '', s.name || '', s.type || 'Digital', s.description || '']),
  ];
  const accRows = [
    accHeaders,
    ...accessories.map(a => [a.id || '', a.name || '', a.description || '']),
  ];

  // 3. Write all in one batch update
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  let updateRes;
  try {
    updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `Devices!A1:I${deviceRows.length}`,     values: deviceRows },
          { range: `Sensors!A1:D${sensorRows.length}`,     values: sensorRows },
          { range: `Accessories!A1:C${accRows.length}`,    values: accRows },
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
