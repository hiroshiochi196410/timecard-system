// ========================================
// タイムカードAPI - Google Apps Script
// ========================================

// スプレッドシートID（お使いのスプレッドシートのURLから取得）
const SPREADSHEET_ID = '1FmVj1DJKZMjCk1920IrFj6PXRPAW8cKFo0MeIe3_c3c';

// シート名
const SHEET_NAME = 'タイムカード';

// ========================================
// GETリクエスト処理
// ========================================
function doGet(e) {
  try {
    // パラメータがない場合
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
      return createResponse({ success: false, error: '不明なアクション: ' + action });
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
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // シートがなければ作成
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
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
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createResponse({ success: true, data: [] });
    }
    
    const data = sheet.getDataRange().getValues();
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      records.push({
        timestamp: data[i][0],
        employeeNumber: data[i][1],
        employeeName: data[i][2],
        department: data[i][3],
        date: data[i][4],
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
    time: '20:00:00',
    type: 'checkin',
    deviceId: 'test'
  });
  Logger.log(result.getContent());
}
