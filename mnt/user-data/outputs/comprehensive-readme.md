# 統合タイムカード管理システム
双葉三共株式会社の就業規則に準拠したタイムカード管理システム

## システム構成

### 📊 メインシステム（/）
包括的勤怠管理システム - 管理者・HR部門向け
- ✅ 勤怠記録の入力・編集
- ✅ 有休管理
- ✅ 残業計算（管理職・一般従業員）
- ✅ 給与計算
- ✅ 会社カレンダー管理
- ✅ 統計・集計機能
- ✅ CSV入出力
- 🆕 Google Sheetsデータ取り込み機能

### 📱 打刻システム（/timecard）
従業員向けシンプル打刻アプリ - スマホ最適化
- ⏰ ワンタッチ出勤・退勤打刻
- 📍 デバイス自動識別
- ☁️ Google Sheetsリアルタイム連携
- 📊 デバイス間データ同期

## データフロー

```
👥 従業員 → 📱 打刻アプリ → ☁️ Google Sheets → 📊 メインシステム
```

1. **従業員打刻**: スマホで簡単打刻（/timecard）
2. **データ蓄積**: Google Sheetsに自動保存
3. **管理・分析**: メインシステムで包括管理（/）

## デプロイ方法

### GitHubリポジトリ構成
```
/
├── index.html          # メインシステム（包括機能）
├── timecard.html       # 打刻アプリ（従業員用）
├── vercel.json         # 統合設定
└── README.md           # このファイル
```

### Vercelデプロイ
1. リポジトリをGitHubにプッシュ
2. [Vercel](https://vercel.com)でインポート
3. 自動デプロイ実行

### アクセスURL
- **メインシステム**: `https://your-project.vercel.app/`
- **打刻システム**: `https://your-project.vercel.app/timecard`

## Google Sheets連携設定

### 必要な設定
1. Google Apps Script設定
2. スプレッドシート作成
3. Web App公開
4. timecard.html内API URL設定

### データ連携
- 打刻データ自動保存
- メインシステムでの取り込み機能
- リアルタイム同期

## 使い方

### 従業員の方
1. `https://your-project.vercel.app/timecard` にアクセス
2. 社員番号で登録
3. 出勤・退勤ボタンで打刻

### 管理者・HR部門の方
1. `https://your-project.vercel.app/` にアクセス
2. 包括的な勤怠管理機能を使用
3. Google Sheetsからデータ取り込み

## 技術仕様
- **フロントエンド**: React, HTML5, JavaScript
- **バックエンド**: Google Apps Script
- **データベース**: Google Sheets + LocalStorage
- **デプロイ**: Vercel
- **レスポンシブ**: スマホ・PC対応

## 料金
- 完全無料（Google Apps Script、Google Sheets、Vercel無料枠使用）