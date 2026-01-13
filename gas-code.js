// ========================================
// タイムカードAPI - Google Apps Script
// ========================================

// スプレッドシートID
const SPREADSHEET_ID = '19fdY39GIHSsGXaXmLCUOFn4nJI3GM-sZFFylZ8_YN4s';

// シート名（最初のシートを使用）
const SHEET_NAME = null; // nullの場合は最初のシートを使用

// ========================================
// GETリクエスト処理
// ========================================
function doGet(e) {
  try {
    if (!e || !e.parameter) {
      return createResponse({ success: false, error: 'パラメータがありません' });
    }
    
    const action = e.parameter.action;
    
    if (action === 'punch') {
      return handlePunch(e.parameter);
    } else if (action === 'getData') {
      return handleGetData();
    } else {
      // actionがなくてもpunchとして処理
      if (e.parameter.employeeNumber) {
        return handlePunch(e.parameter);
      }
      return createResponse({ success: false, error: '不明なアクション' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// POSTリクエスト処理
// ========================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return handlePunch(data);
  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// 打刻データ保存
// ========================================
function handlePunch(params) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet;
    
    if (SHEET_NAME) {
      sheet = ss.getSheetByName(SHEET_NAME);
    } else {
      sheet = ss.getSheets()[0]; // 最初のシート
    }
    
    if (!sheet) {
      return createResponse({ success: false, error: 'シートが見つかりません' });
    }
    
    // 種別の日本語変換
    const typeNames = {
      'checkin': '出勤',
      'checkout': '退勤',
      'out': '外出',
      'return': '戻り'
    };
    
    // 現在のスプレッドシートの列順に合わせる
// A:タイムスタンプ B:日付 C:社員コード D:氏名 E:部署 F:時刻 G:種別 H:デバイスID

// 社員コードは先頭ゼロ保持のため文字列として強制
const empCode = (params.employeeNumber === undefined || params.employeeNumber === null)
  ? ''
  : String(params.employeeNumber);

const TZ = 'Asia/Tokyo';

// 日付を yyyyMMdd に統一（例: 2026-01-13 / 2026/1/13 / 20260113 を吸収）
const toYYYYMMDD = (input) => {
  if (!input) return '';
  const s = String(input).trim();
  if (/^\d{8}$/.test(s)) return s;

  // YYYY-MM-DD / YYYY/M/D
  const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return Utilities.formatDate(new Date(y, mo - 1, d), TZ, 'yyyyMMdd');
  }

  // それ以外（ISO日時など）
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return Utilities.formatDate(dt, TZ, 'yyyyMMdd');

  // 万一パース不能ならそのまま
  return s;
};

const dateYMD = toYYYYMMDD(params.date) || toYYYYMMDD(params.timestamp) || '';

// appendRowは数値化で先頭ゼロが落ちることがあるため、setValuesで書き込む
const nextRow = sheet.getLastRow() + 1;

// C列（社員コード）を先にテキスト形式に固定
sheet.getRange(nextRow, 2).setNumberFormat('@'); // B列（日付）
    sheet.getRange(nextRow, 3).setNumberFormat('@'); // C列（社員コード）

// 1行分を書き込み（社員コードは '0101 のように文字列強制）
sheet.getRange(nextRow, 1, 1, 8).setValues([[
  params.timestamp || new Date().toISOString(),  // A: タイムスタンプ
  dateYMD || '',                                  // B: 日付（yyyymmdd）
  empCode ? ("'" + empCode) : '',                 // C: 社員コード（先頭ゼロ保持）
  params.employeeName || '',                      // D: 氏名
  params.department || '',                        // E: 部署
  params.time || '',                              // F: 時刻
  typeNames[params.type] || params.type || '',    // G: 種別
  params.deviceId || ''                           // H: デバイスID
]]);

return createResponse({ 
      success: true, 
      message: 'データを保存しました'
    });
    
  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// データ取得
// ========================================
function handleGetData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet;
    
    if (SHEET_NAME) {
      sheet = ss.getSheetByName(SHEET_NAME);
    } else {
      sheet = ss.getSheets()[0];
    }
    
    if (!sheet) {
      return createResponse({ success: true, data: [] });
    }
    
    const range = sheet.getDataRange();
    const data = range.getValues();
    const disp = range.getDisplayValues(); // 表示値（文字列）
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      records.push({
        timestamp: data[i][0],
        date: String((disp[i] && disp[i][1]) || '').trim(),
        employeeNumber: String((disp[i] && disp[i][2]) || '').trim(),
        employeeName: data[i][3],
        department: data[i][4],
        time: data[i][5],
        type: data[i][6],
        deviceId: data[i][7]
      });
    }
    
    return createResponse({ success: true, data: records });
  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// JSONレスポンス作成
// ========================================
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
    employeeNumber: '9999',
    employeeName: 'テスト太郎',
    department: 'テスト部',
    date: '2026-01-13',
    time: '21:00:00',
    type: 'checkin',
    deviceId: 'test'
  });
  Logger.log(result.getContent());
}
