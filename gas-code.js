// ========================================
// Google Apps Script - タイムカードAPI
// このコードをGoogle Apps Scriptに貼り付けてください
// ========================================

// スプレッドシートID（URLから取得）
// 例: https://docs.google.com/spreadsheets/d/【このID部分】/edit
const SPREADSHEET_ID = '19fdY39GIHSsGXaXmLCUOFn4nJI3GM-sZFFylZ8_YN4s';

// シート名
const SHEET_NAME = 'タイムカード';

// ========================================
// GETリクエスト処理（メイン）
// ========================================
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'punch') {
      return handlePunch(e.parameter);
    } else if (action === 'getData') {
      return handleGetData(e.parameter);
    } else {
      return createResponse({ success: false, error: '不明なアクション' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ========================================
// POSTリクエスト処理（バックアップ用）
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
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // ヘッダー行を追加
    sheet.appendRow([
      'タイムスタンプ',
      '社員番号',
      '氏名',
      '部署',
      '日付',
      '時刻',
      '種別',
      'デバイスID'
    ]);
    // ヘッダー行の書式設定
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  }
  
  // 種別の日本語変換
  const typeNames = {
    'checkin': '出勤',
    'checkout': '退勤',
    'out': '外出',
    'return': '戻り'
  };
  
  // データを追加
  sheet.appendRow([
    params.timestamp || new Date().toISOString(),
    params.employeeNumber || '',
    params.employeeName || '',
    params.department || '',
    params.date || '',
    params.time || '',
    typeNames[params.type] || params.type || '',
    params.deviceId || ''
  ]);
  
  return createResponse({ 
    success: true, 
    message: 'データを保存しました',
    timestamp: new Date().toISOString()
  });
}

// ========================================
// データ取得（管理者用）
// ========================================
function handleGetData(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse({ success: true, data: [] });
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    records.push({
      timestamp: row[0],
      employeeNumber: row[1],
      employeeName: row[2],
      department: row[3],
      date: row[4],
      time: row[5],
      type: row[6],
      deviceId: row[7]
    });
  }
  
  return createResponse({ success: true, data: records });
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
// テスト用関数
// ========================================
function testPunch() {
  const testParams = {
    timestamp: new Date().toISOString(),
    employeeNumber: '9999',
    employeeName: 'テスト太郎',
    department: '本部',
    date: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
    time: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'HH:mm:ss'),
    type: 'checkin',
    deviceId: 'test-device'
  };
  
  const result = handlePunch(testParams);
  Logger.log(result.getContent());
}
