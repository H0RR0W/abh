#!/bin/bash
# Скрипт обновления приложения на сервере
# Запускать из /var/www/demka: bash deploy.sh

set -e
echo "🚀 Deploying demka..."

cd /var/www/demka

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🔨 Building Next.js..."
npm run build

echo "♻️  Restarting PM2..."
pm2 restart demka || pm2 start ecosystem.config.js

echo "✅ Deploy complete!"
pm2 status
