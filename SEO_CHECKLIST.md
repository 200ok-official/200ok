# SEO 優化檢查清單 ✓

部署前請確認以下項目已完成：

## 📋 部署前檢查

### 1. 環境變數設定
- [ ] 設定 `NEXT_PUBLIC_BASE_URL`（必需）
- [ ] 如使用 GA，設定 `NEXT_PUBLIC_GA_ID`
- [ ] 如需要，設定搜尋引擎驗證碼

### 2. 圖片資源
- [ ] 準備 `/public/og-image.png`（1200x630px，用於社交分享）
- [ ] 確認 `/public/icon.png` 存在（用於 PWA 和 favicon）
- [ ] 檢查所有圖片都有適當的 alt 屬性

### 3. 檔案檢查
- [ ] `public/robots.txt` 已創建
- [ ] `public/manifest.json` 已創建
- [ ] `src/app/sitemap.ts` 已創建
- [ ] 所有 SEO 組件已正確匯入

## 🚀 部署後驗證

### 立即檢查（部署後 5 分鐘內）

1. **基本 SEO 檢查**
```bash
# 檢查 robots.txt
curl https://200ok.tw/robots.txt

# 檢查 sitemap
curl https://200ok.tw/sitemap.xml

# 檢查 manifest
curl https://200ok.tw/manifest.json
```

2. **頁面標題檢查**
   - [ ] 首頁：「首頁 - 專業軟體接案平台 | 200 OK」
   - [ ] 案件頁：「瀏覽所有案件 | 200 OK」
   - [ ] 工程師頁：「尋找專業工程師 | 200 OK」
   - [ ] 如何運作：「如何運作 - 了解平台使用流程 | 200 OK」

3. **社交分享測試**
   - [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [ ] [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

4. **結構化資料驗證**
   - [ ] [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [ ] 確認 Organization 和 WebSite schema 正確顯示

### 第 1 天

5. **Google Search Console**
   - [ ] 添加網站並驗證所有權
   - [ ] 提交 sitemap（https://200ok.tw/sitemap.xml）
   - [ ] 檢查索引涵蓋率

6. **效能檢查**
   - [ ] [PageSpeed Insights](https://pagespeed.web.dev/)
   - [ ] [GTmetrix](https://gtmetrix.com/)
   - [ ] 確認 Core Web Vitals 分數

### 第 1 週

7. **監控指標**
   - [ ] Google Search Console：檢查索引頁面數
   - [ ] Google Analytics：確認追蹤正常運作
   - [ ] 檢查是否有 404 錯誤

8. **搜尋測試**
```
在 Google 搜尋：
- site:200ok.tw
- "200 OK" 接案平台
- 200ok.tw 軟體開發
```

## 🔧 開發工具

### 瀏覽器檢查
在瀏覽器開發者工具中檢查：

1. **HTML Head**
   - 開啟任一頁面
   - F12 → Elements → `<head>`
   - 確認看到：
     - `<title>` 正確
     - `<meta name="description">`
     - Open Graph tags (`og:title`, `og:description`, `og:image`)
     - Twitter Card tags
     - Canonical link

2. **結構化資料**
   - 開啟任一頁面
   - F12 → Console
   - 輸入：`document.querySelectorAll('script[type="application/ld+json"]')`
   - 應該看到 JSON-LD 結構化資料

### SEO 工具推薦

1. **線上工具**
   - [Ahrefs Webmaster Tools](https://ahrefs.com/webmaster-tools)（免費）
   - [Ubersuggest](https://neilpatel.com/ubersuggest/)（部分免費）
   - [Moz Link Explorer](https://moz.com/link-explorer)（有限免費）

2. **瀏覽器擴充功能**
   - META SEO inspector（Chrome/Firefox）
   - SEOquake（Chrome/Firefox）
   - Lighthouse（Chrome 內建）

3. **命令列工具**
```bash
# 使用 curl 檢查 meta tags
curl -s https://200ok.tw | grep -i "<meta"

# 使用 curl 檢查標題
curl -s https://200ok.tw | grep -i "<title"
```

## 📊 效能基準

設定這些目標值：

### Lighthouse 分數（目標）
- ✅ Performance: 90+
- ✅ Accessibility: 95+
- ✅ Best Practices: 95+
- ✅ SEO: 100

### Core Web Vitals（目標）
- ✅ LCP (Largest Contentful Paint): < 2.5s
- ✅ FID (First Input Delay): < 100ms
- ✅ CLS (Cumulative Layout Shift): < 0.1

## 🐛 常見問題排解

### Q: Open Graph 圖片不顯示？
**A:** 
1. 確認 `/public/og-image.png` 存在
2. 圖片尺寸是 1200x630px
3. 使用 Facebook Debugger 清除快取

### Q: Google 沒有索引我的網頁？
**A:**
1. 確認 robots.txt 沒有封鎖
2. 在 Search Console 提交 sitemap
3. 使用「要求建立索引」功能
4. 等待 1-2 週

### Q: 標題沒有更新？
**A:**
1. 清除瀏覽器快取
2. 檢查 SEOHead 組件是否正確載入
3. 開啟開發者工具檢查 `<title>` 標籤

### Q: 結構化資料有錯誤？
**A:**
1. 使用 Rich Results Test 檢查
2. 確認 JSON-LD 格式正確
3. 檢查必填欄位是否都有值

## 📞 需要協助？

如果遇到問題：
1. 檢查瀏覽器 Console 是否有錯誤
2. 檢查 Next.js 開發模式下的錯誤訊息
3. 參考 `SEO_OPTIMIZATION.md` 詳細說明

## ✅ 完成確認

當以下所有項目都打勾時，SEO 優化就完成了：

- [ ] 所有環境變數已設定
- [ ] 所有必要圖片已準備
- [ ] robots.txt 可正常訪問
- [ ] sitemap.xml 可正常訪問
- [ ] 社交分享測試通過
- [ ] 結構化資料驗證通過
- [ ] Google Search Console 已設定
- [ ] Lighthouse SEO 分數達 100

**恭喜！您的網站 SEO 優化已完成！** 🎉

