# 200 OK - 部署指南

## 📦 部署選項

### 選項 1: Vercel（推薦）

最簡單快速的部署方式，適合前後端一體的 Next.js 應用程式。

#### 步驟

1. **安裝 Vercel CLI**

```bash
npm i -g vercel
```

2. **登入 Vercel**

```bash
vercel login
```

3. **部署到 Vercel**

```bash
# 首次部署
vercel

# 部署到生產環境
vercel --prod
```

4. **設定環境變數**

在 Vercel Dashboard 中設定：
- Settings > Environment Variables
- 新增所有 `.env` 中的變數

5. **設定資料庫**

建議使用 Vercel Postgres 或外部 PostgreSQL（如 Supabase、Neon）：

```env
DATABASE_URL="postgresql://..."
```

6. **設定 Build Command**

Vercel 會自動偵測，但也可手動設定：

```json
{
  "buildCommand": "next build",
  "installCommand": "npm install"
}
```

---

### 選項 2: GCP Cloud Run

適合需要更多控制和擴展性的場景。

#### 前置準備

1. 安裝 Google Cloud SDK
2. 建立 GCP 專案
3. 啟用必要的 API

#### 步驟

1. **建立 Dockerfile**

```dockerfile
# /Users/guanyuchen/200ok/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **修改 next.config.mjs**

```javascript
const nextConfig = {
  output: 'standalone',
  // ... 其他設定
};
```

3. **建立 .dockerignore**

```
node_modules
.next
.git
.env
.env.local
```

4. **部署到 Cloud Run**

```bash
# 設定專案
gcloud config set project YOUR_PROJECT_ID

# Build and Push Docker Image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/200ok

# Deploy to Cloud Run
gcloud run deploy 200ok \
  --image gcr.io/YOUR_PROJECT_ID/200ok \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=... \
  --set-env-vars JWT_SECRET=...
```

---

### 選項 3: AWS (EC2 + RDS)

#### 步驟

1. **建立 EC2 實例**
   - 選擇 Ubuntu 22.04 LTS
   - 設定 Security Group（開放 22, 80, 443 port）

2. **連線到 EC2**

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **安裝必要軟體**

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安裝 PostgreSQL Client
sudo apt install -y postgresql-client

# 安裝 PM2
sudo npm install -g pm2

# 安裝 Nginx
sudo apt install -y nginx
```

4. **複製專案**

```bash
git clone <your-repo>
cd 200ok
npm install
```

5. **設定環境變數**

```bash
cp .env.example .env
nano .env  # 編輯環境變數
```

6. **設定資料庫**

資料庫已透過 Supabase SQL Editor 執行 `supabase_schema.sql` 設定完成。

7. **建置應用程式**

```bash
npm run build
```

8. **使用 PM2 啟動**

```bash
pm2 start npm --name "200ok" -- start
pm2 save
pm2 startup
```

9. **設定 Nginx**

```nginx
# /etc/nginx/sites-available/200ok
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 啟用設定
sudo ln -s /etc/nginx/sites-available/200ok /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

10. **設定 SSL (Let's Encrypt)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🗄️ 資料庫部署

### 選項 1: Supabase（推薦）

1. 註冊 [Supabase](https://supabase.com/)
2. 建立新專案
3. 取得連線字串
4. 更新 `DATABASE_URL`

### 選項 2: Neon

1. 註冊 [Neon](https://neon.tech/)
2. 建立新專案
3. 取得連線字串
4. 更新 `DATABASE_URL`

### 選項 3: 自建 PostgreSQL

參考上方 AWS 部署步驟

---

## 🔒 安全性檢查清單

部署前請確認：

- [ ] 所有環境變數已正確設定
- [ ] JWT_SECRET 使用強密碼
- [ ] 資料庫連線使用 SSL
- [ ] CORS 設定正確
- [ ] Rate Limiting 已啟用
- [ ] 敏感資料不在程式碼中
- [ ] `.env` 已加入 `.gitignore`
- [ ] 生產環境關閉開發模式功能
- [ ] 設定 HTTPS
- [ ] 定期備份資料庫

---

## 📊 監控與日誌

### Vercel Analytics

自動整合，無需額外設定。

### Sentry（錯誤追蹤）

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Google Analytics

在 `app/layout.tsx` 中加入：

```typescript
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## 🔄 CI/CD 設定

### GitHub Actions

建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 📝 部署後檢查

- [ ] 網站可正常訪問
- [ ] API 端點運作正常
- [ ] 資料庫連線正常
- [ ] 認證功能正常
- [ ] 圖片上傳功能正常
- [ ] Email 發送正常
- [ ] 監控系統運作正常
- [ ] SSL 憑證有效

---

**200 OK** - 部署成功 🚀

