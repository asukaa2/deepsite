# Dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm install

# 复制源码并构建
COPY . .
RUN npm run build

# production environment
FROM node:18-alpine AS production
WORKDIR /usr/src/app

# 复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/.env* ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/middlewares ./middlewares
COPY --from=builder /app/utils ./utils

# 安装生产依赖并清理
RUN npm install --only=production --no-cache \
    && npm cache clean --force \
    && rm -rf /tmp/* /var/cache/apk/* \
    && find /usr/src/app/node_modules -type d -name "test" -o -name "tests" | xargs rm -rf

# 设置用户和环境
USER node
ENV NODE_ENV=production

# 暴露端口
EXPOSE 30001

# 启动应用
CMD ["node", "server.js"]