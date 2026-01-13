// 社員コードの先頭ゼロを保持するため、文字列として明示
const empCode = (params.employeeNumber === undefined || params.employeeNumber === null)
  ? ''
  : String(params.employeeNumber);

sheet.appendRow([
  params.timestamp || new Date().toISOString(),  // A: タイムスタンプ
  params.date || '',                              // B: 日付
  empCode,                                        // C: 社員コード（いったん文字列）
  params.employeeName || '',                      // D: 氏名
  params.department || '',                        // E: 部署
  params.time || '',                              // F: 時刻
  typeNames[params.type] || params.type || '',   // G: 種別
  params.deviceId || ''                           // H: デバイスID
]);

// 追加した行の「社員コード」セルをテキスト扱いにして、値を再セット（これで0101が落ちない）
const lastRow = sheet.getLastRow();
const empCell = sheet.getRange(lastRow, 3); // C列
empCell.setNumberFormat('@');
empCell.setValue(empCode);
