    // 社員コード（先頭ゼロ保持のため、文字列として強制）
    const empCode = (params.employeeNumber === undefined || params.employeeNumber === null)
      ? ''
      : String(params.employeeNumber);

    // 次の空行に setValues で書き込む（appendRowは使わない）
    const nextRow = sheet.getLastRow() + 1;

    // C列（社員コード）を先にテキスト形式に固定
    sheet.getRange(nextRow, 3).setNumberFormat('@');

    // A:タイムスタンプ B:日付 C:社員コード D:氏名 E:部署 F:時刻 G:種別 H:デバイスID
    sheet.getRange(nextRow, 1, 1, 8).setValues([[
      params.timestamp || new Date().toISOString(),  // A
      params.date || '',                              // B
      empCode ? ("'" + empCode) : '',                 // C ← '0101 で文字列強制
      params.employeeName || '',                      // D
      params.department || '',                        // E
      params.time || '',                              // F
      typeNames[params.type] || params.type || '',    // G
      params.deviceId || ''                           // H
    ]]);
