// ========================================
// タイムカードAPI - Google Apps Script
// （ログ保存 + 日別サマリー（出勤/退勤/外出戻り×2））
// ========================================

// スプレッドシートID
const SPREADSHEET_ID = '19fdY39GIHSsGXaXmLCUOFn4nJI3GM-sZFFylZ8_YN4s';

// シート名（存在しなければ自動作成）
const LOG_SHEET_NAME = '打刻ログ';
const SUMMARY_SHEET_NAME = '日別サマリー';

// サマリー列（A〜L）
const SUMMARY_HEADERS = [
  'タイムスタンプ', '社員番号', '氏名', '部署', '日付',
  '出勤', '退勤',
  '外出1', '戻り1',
  '外出2', '戻り2',
  'デバイスID'
];

// ログ列（A〜H） ※ミスターのスクショの並びに合わせる
const LOG_HEADERS = [
  'タイムスタンプ', '社員番号', '氏名', '部署', '日付', '時刻', '種別', 'デバイスID'
];

// ========================================
// GET/POST ルーティング
// ========================================
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getData';
    if (action === 'getSummary') return handleGetSummary();
    return handleGetData();
  } catch (err) {
    return createResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const params = parsePostBody(e);
    const action = params.action || 'punch';
    if (action === 'punch') return handlePunch(params);
    if (action === 'getSummary') return handleGetSummary();
    return handleGetData();
  } catch (err) {
    return createResponse({ success: false, error: err.message });
  }
}

// ========================================
// 打刻保存（ログ + サマリー更新）
// ========================================
function handlePunch(params) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    const logSheet = getOrCreateSheet_(ss, LOG_SHEET_NAME, LOG_HEADERS);
    const summarySheet = getOrCreateSheet_(ss, SUMMARY_SHEET_NAME, SUMMARY_HEADERS);

    // 種別の日本語変換
    const typeNames = {
      'checkin': '出勤',
      'checkout': '退勤',
      'out': '外出',
      'return': '戻り'
    };
    const typeJa = typeNames[params.type] || params.type || '';

    // 正規化（社員番号は文字列、日付は YYYY-MM-DD、時刻はそのまま文字列）
    const emp = normalizeEmp_(params.employeeNumber);
    const empForCell = emp ? ("'" + emp) : '';
    const dateISO = normalizeDateISO_(params.date); // 例: 2026-01-13
    const timeStr = (params.time === undefined || params.time === null) ? '' : String(params.time);
    const tsStr = (params.timestamp === undefined || params.timestamp === null) ? new Date().toISOString() : String(params.timestamp);

    // --- 1) ログ保存（A〜H） ---
    const logNextRow = logSheet.getLastRow() + 1;

    // 社員番号列(B)はテキスト、日付(E)もテキストに固定（先頭ゼロや表示崩れ防止）
    logSheet.getRange(logNextRow, 2).setNumberFormat('@'); // B
    logSheet.getRange(logNextRow, 5).setNumberFormat('@'); // E

    logSheet.getRange(logNextRow, 1, 1, 8).setValues([[
      tsStr,                 // A: タイムスタンプ
      empForCell,            // B: 社員番号（文字列）
      params.employeeName || '', // C: 氏名
      params.department || '',   // D: 部署
      dateISO,               // E: 日付（YYYY-MM-DD）
      timeStr,               // F: 時刻
      typeJa,                // G: 種別
      params.deviceId || ''  // H: デバイスID
    ]]);

    // --- 2) サマリー更新（A〜L） ---
    upsertSummaryRow_(summarySheet, {
      timestamp: tsStr,
      employeeNumber: emp,
      employeeName: params.employeeName || '',
      department: params.department || '',
      date: dateISO,
      time: timeStr,
      type: typeJa,
      deviceId: params.deviceId || ''
    });

    return createResponse({ success: true, message: 'データを保存しました' });

  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// ログデータ取得（既存UI互換：打刻ログを返す）
// ========================================
function handleGetData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(LOG_SHEET_NAME) || ss.getSheets()[0];
    if (!sheet) return createResponse({ success: true, data: [] });

    // 表示値で取得（社員番号の0保持、日付の文字列保持）
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const displays = dataRange.getDisplayValues();

    const records = [];
    for (let i = 1; i < values.length; i++) {
      records.push({
        timestamp: values[i][0],
        employeeNumber: String(displays[i][1] || '').trim(), // 0保持
        employeeName: values[i][2],
        department: values[i][3],
        date: String(displays[i][4] || '').trim(),
        time: String(displays[i][5] || '').trim(),
        type: values[i][6],
        deviceId: values[i][7]
      });
    }

    return createResponse({ success: true, data: records });

  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// サマリー取得（必要なら管理画面で使用）
// ========================================
function handleGetSummary() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
    if (!sheet) return createResponse({ success: true, data: [] });

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const displays = dataRange.getDisplayValues();

    const records = [];
    for (let i = 1; i < values.length; i++) {
      records.push({
        timestamp: values[i][0],
        employeeNumber: String(displays[i][1] || '').trim(),
        employeeName: values[i][2],
        department: values[i][3],
        date: String(displays[i][4] || '').trim(),
        checkin: String(displays[i][5] || '').trim(),
        checkout: String(displays[i][6] || '').trim(),
        out1: String(displays[i][7] || '').trim(),
        return1: String(displays[i][8] || '').trim(),
        out2: String(displays[i][9] || '').trim(),
        return2: String(displays[i][10] || '').trim(),
        deviceId: values[i][11]
      });
    }

    return createResponse({ success: true, data: records });

  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// 内部：サマリーの行を追加/更新（外出戻りは2回分）
// ========================================
function upsertSummaryRow_(sheet, payload) {
  // 列index（1-based）
  const COL = {
    ts: 1,
    emp: 2,
    name: 3,
    dept: 4,
    date: 5,
    in: 6,
    out: 7,
    out1: 8,
    ret1: 9,
    out2: 10,
    ret2: 11,
    device: 12
  };

  const emp = payload.employeeNumber || '';
  const date = payload.date || '';
  if (!emp || !date) return;

  // 探索（B=社員番号, E=日付）※displayで比較
  const lastRow = sheet.getLastRow();
  let targetRow = null;

  if (lastRow >= 2) {
    const range = sheet.getRange(2, 2, lastRow - 1, 4); // B〜E
    const disp = range.getDisplayValues(); // [[emp,name,dept,date],...]
    for (let i = 0; i < disp.length; i++) {
      const rowEmp = String(disp[i][0] || '').trim().replace(/^'/, '');
      const rowDate = String(disp[i][3] || '').trim();
      if (rowEmp === emp && rowDate === date) {
        targetRow = 2 + i;
        break;
      }
    }
  }

  // なければ新規行を作る
  if (!targetRow) {
    targetRow = sheet.getLastRow() + 1;

    // 形式固定（社員番号・日付・時刻列をテキスト）
    sheet.getRange(targetRow, COL.emp).setNumberFormat('@');   // B
    sheet.getRange(targetRow, COL.date).setNumberFormat('@');  // E
    sheet.getRange(targetRow, COL.in, 1, 6).setNumberFormat('@'); // F〜K

    sheet.getRange(targetRow, 1, 1, 12).setValues([[
      payload.timestamp || '',         // A
      "'" + emp,                       // B（文字列）
      payload.employeeName || '',      // C
      payload.department || '',        // D
      date,                            // E
      '', '', '', '', '', '',          // F〜K
      payload.deviceId || ''           // L
    ]]);
  }

  // 既存値取得（display）
  const current = sheet.getRange(targetRow, 1, 1, 12).getDisplayValues()[0];
  const curIn = current[COL.in - 1] || '';
  const curOut = current[COL.out - 1] || '';
  const curOut1 = current[COL.out1 - 1] || '';
  const curRet1 = current[COL.ret1 - 1] || '';
  const curOut2 = current[COL.out2 - 1] || '';
  const curRet2 = current[COL.ret2 - 1] || '';

  const t = payload.time || '';

  // 出勤：最小時刻を保持
  if (payload.type === '出勤') {
    const nextIn = (!curIn || compareTime_(t, curIn) < 0) ? t : curIn;
    sheet.getRange(targetRow, COL.in).setValue(nextIn);
  }

  // 退勤：最大時刻を保持
  if (payload.type === '退勤') {
    const nextOut = (!curOut || compareTime_(t, curOut) > 0) ? t : curOut;
    sheet.getRange(targetRow, COL.out).setValue(nextOut);
  }

  // 外出：空いている外出枠へ（外出1→外出2）
  if (payload.type === '外出') {
    if (!curOut1) {
      sheet.getRange(targetRow, COL.out1).setValue(t);
    } else if (curOut1 && curRet1 && !curOut2) {
      sheet.getRange(targetRow, COL.out2).setValue(t);
    } else if (curOut1 && !curRet1 && !curOut2) {
      // 例外：戻り前に外出が重なった場合は外出2へ退避
      sheet.getRange(targetRow, COL.out2).setValue(t);
    }
  }

  // 戻り：外出1の戻り→外出2の戻り
  if (payload.type === '戻り') {
    if (curOut1 && !curRet1) {
      sheet.getRange(targetRow, COL.ret1).setValue(t);
    } else if (curOut2 && !curRet2) {
      sheet.getRange(targetRow, COL.ret2).setValue(t);
    }
  }

  // 共通：氏名・部署・デバイスID・タイムスタンプ更新（空なら補完、デバイスは最新）
  if (!current[COL.name - 1] && payload.employeeName) sheet.getRange(targetRow, COL.name).setValue(payload.employeeName);
  if (!current[COL.dept - 1] && payload.department) sheet.getRange(targetRow, COL.dept).setValue(payload.department);

  sheet.getRange(targetRow, COL.device).setValue(payload.deviceId || sheet.getRange(targetRow, COL.device).getValue());
  sheet.getRange(targetRow, COL.ts).setValue(payload.timestamp || sheet.getRange(targetRow, COL.ts).getValue());
}

// ========================================
// ユーティリティ
// ========================================
function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  // ヘッダーが無ければ設定
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    // 既存ヘッダーが違う場合は上書き（運用中なら必要に応じてコメントアウト可）
    const existing = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
    const mismatch = headers.some((h, i) => String(existing[i] || '') !== h);
    if (mismatch) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function normalizeEmp_(v) {
  if (v === undefined || v === null) return '';
  // 0101 を維持（数値化しない）
  return String(v).trim();
}

function normalizeDateISO_(v) {
  if (v === undefined || v === null) return '';
  const s = String(v).trim();
  // YYYYMMDD
  if (/^\d{8}$/.test(s)) return s.slice(0,4) + '-' + s.slice(4,6) + '-' + s.slice(6,8);
  // YYYY-MM-DD or YYYY/MM/DD
  const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (m) {
    const yyyy = m[1];
    const mm = ('0' + m[2]).slice(-2);
    const dd = ('0' + m[3]).slice(-2);
    return `${yyyy}-${mm}-${dd}`;
  }
  return s; // 不明形式はそのまま（UI側で弾かれる可能性あり）
}

function compareTime_(a, b) {
  // HH:MM or HH:MM:SS を秒にして比較
  const toSec = (t) => {
    const s = String(t || '').trim();
    const parts = s.split(':').map(x => parseInt(x, 10));
    if (parts.length < 2) return NaN;
    const hh = parts[0] || 0, mm = parts[1] || 0, ss = parts[2] || 0;
    return hh*3600 + mm*60 + ss;
  };
  const sa = toSec(a);
  const sb = toSec(b);
  if (isNaN(sa) || isNaN(sb)) return 0;
  return sa - sb;
}

function parsePostBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    const obj = JSON.parse(e.postData.contents);
    return obj && typeof obj === 'object' ? obj : {};
  } catch (_) {
    // x-www-form-urlencoded などの場合
    const raw = e.postData.contents;
    const out = {};
    raw.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return out;
  }
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// テスト関数
// ========================================
function testPunch() {
  const result = handlePunch({
    timestamp: new Date().toISOString(),
    employeeNumber: '0101',
    employeeName: 'テスト太郎',
    department: 'テスト部',
    date: '2026-01-13',
    time: '08:00:00',
    type: 'checkin',
    deviceId: 'test'
  });
  Logger.log(result.getContent());
}
