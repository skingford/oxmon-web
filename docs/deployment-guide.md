# Oxmon Web 线上部署指南

## 目录

- [环境要求](#环境要求)
- [构建产物说明](#构建产物说明)
- [本地构建](#本地构建)
- [上传到服务器](#上传到服务器)
- [服务器配置](#服务器配置)
- [PM2 启动](#pm2-启动)
- [Nginx 反向代理](#nginx-反向代理)
- [后续更新部署](#后续更新部署)
- [常见问题排查](#常见问题排查)

---

## 环境要求

| 工具    | 版本要求  |
| ------- | --------- |
| Node.js | >= 20.x   |
| PM2     | 最新版    |
| 内存    | >= 512 MB |

---

## 构建产物说明

执行 `npm run build` 后，部署所需的全部文件都在 `.next/standalone/` 目录中，结构如下：

```
.next/standalone/          ← 上传这整个目录到服务器
├── .next/
│   ├── server/            静态服务端渲染代码
│   ├── static/            CSS / JS 静态资源
│   ├── BUILD_ID
│   ├── build-manifest.json
│   ├── routes-manifest.json
│   └── ...
├── node_modules/          精简版依赖，无需 npm install
├── .env                   构建时自动复制的基础环境变量
├── .env.production        生产环境变量（含 API 地址等）
├── package.json
└── server.js              ← 启动入口
```

> **注意**：`static/` 已在 `.next/standalone/.next/static/` 内，无需额外复制。

---

## 本地构建

```bash
# 安装依赖
npm install

# 生产构建（会读取 .env.production）
npm run build
```

---

## 上传到服务器

### 首次部署（打包压缩上传）

```bash
# 本地打包（体积减少 60–80%）
tar czf oxmon-web.tar.gz -C .next/standalone .

# 上传
scp oxmon-web.tar.gz user@server:/opt/oxmon-web/

# 服务器上解压
ssh user@server "mkdir -p /opt/oxmon-web && cd /opt/oxmon-web && tar xzf oxmon-web.tar.gz && rm oxmon-web.tar.gz"
```

解压后服务器目录结构与本地 `.next/standalone/` 完全一致：

```
/opt/oxmon-web/
├── .next/
│   ├── server/
│   ├── static/
│   └── ...
├── node_modules/
├── .env
├── .env.production
├── package.json
└── server.js
```

### 后续更新（增量同步）

```bash
rsync -avz --delete .next/standalone/ user@server:/opt/oxmon-web/
```

---

## 服务器配置

在服务器的 `/opt/oxmon-web/` 目录下，确认 `.env.production` 内容正确：

```dotenv
NEXT_PUBLIC_DEFAULT_LOCALE=zh
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_OX_APP_ID=your-app-id
```

> `NEXT_PUBLIC_*` 变量在构建时已内联到客户端 bundle，**修改此文件不会影响浏览器端请求地址**，需重新构建才生效。

---

## PM2 启动

### 安装 PM2

```bash
npm install -g pm2
```

### 创建 ecosystem.config.js

在服务器 `/opt/oxmon-web/` 目录下创建：

```js
module.exports = {
  apps: [
    {
      name: 'oxmon-web',
      script: './server.js',
      cwd: '/opt/oxmon-web',
      instances: 1,
      exec_mode: 'fork',
      // 日志配置
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      merge_logs: true,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
}
```

### 启动

```bash
cd /opt/oxmon-web
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # 设置开机自启，按提示执行输出的命令
```

### 常用管理命令

```bash
pm2 status               # 查看运行状态
pm2 logs oxmon-web       # 实时日志
pm2 restart oxmon-web    # 重启
pm2 stop oxmon-web       # 停止
```

---

## Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;

    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    # Next.js 静态资源长缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 后续更新部署

```bash
# 1. 本地重新构建
npm run build

# 2. 同步到服务器
rsync -avz --delete .next/standalone/ user@server:/opt/oxmon-web/

# 3. 重启服务
ssh user@server "pm2 restart oxmon-web"
```

---

## 常见问题排查

| 现象 | 可能原因 | 解决办法 |
| ---- | -------- | -------- |
| 样式/JS 404 | `static/` 不在 standalone 内 | 确认 `.next/standalone/.next/static/` 存在 |
| API 请求打到本地 | `NEXT_PUBLIC_API_BASE_URL` 构建时写死了旧值 | 修改 `.env.production` 后重新 `npm run build` |
| `server.js not found` | 上传了 standalone 目录本身而非内容 | `rsync` 时注意末尾加 `/` |
| 端口被占用 | 3000 端口冲突 | 修改 ecosystem.config.js 中的 `PORT` |
| 开机不自启 | 未执行 `pm2 startup` | 执行后按提示运行输出的命令 |
