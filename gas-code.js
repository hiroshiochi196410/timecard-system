// Google Sheetsから従業員マスタを読み込む
async function loadEmployeesFromSheets() {
    try {
        const response = await fetch(API_URL + '?action=getEmployees');
        const result = await response.json();
        
        if (result.success && result.data) {
            debug('Google Sheetsから従業員データ取得: ' + Object.keys(result.data).length + '件');
            return result.data;
        }
        return null;
    } catch (e) {
        debug('Google Sheets従業員取得エラー: ' + e.message);
        return null;
    }
}

// 従業員データ読み込み（LocalStorage + Google Sheets）
async function loadAllEmployees() {
    // LocalStorageから読み込み
    let employees = loadEmployeesFromStorage();
    
    // Google Sheetsからも読み込んで統合
    const sheetsEmployees = await loadEmployeesFromSheets();
    if (sheetsEmployees) {
        employees = Object.assign({}, employees, sheetsEmployees);
        debug('従業員データ統合完了');
    }
    
    return employees;
}
```

---

## 🚀 最も簡単な方法

上記は少し複雑なので、**今すぐ使える簡単な方法**を提案します：

### 即効解決: 全従業員をハードコードに追加

PCのメインシステムで管理している**全従業員のリスト**を教えてください：
- 社員番号
- 氏名
- 部署

それを元に、全員分をハードコードした`timecard.html`を作成します。

**必要な情報をこの形式で提供してください**：
```
0078,中村 悠,本部
0084,松本 靖生,本部
1081,隼田 大輔,事業推進部
...
