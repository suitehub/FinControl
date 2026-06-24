# --- Estágio de Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Copia os arquivos de definição do pacote
COPY package*.json ./

# Instala todas as dependências (incluindo as de desenvolvimento necessárias para o build)
RUN npm ci

# Copia todo o código-fonte
COPY . .

# Compila o cliente (Vite) e o servidor empacotado (esbuild)
RUN npm run build

# --- Estágio de Execução (Produção) ---
FROM node:20-slim AS runner

WORKDIR /app

# Define o ambiente de produção
ENV NODE_ENV=production

# Copia os arquivos de definição do pacote
COPY package*.json ./

# Instala apenas as dependências de produção para manter a imagem leve e segura
RUN npm ci --omit=dev

# Copia os builds gerados no estágio anterior
COPY --from=builder /app/dist ./dist

# Expõe a porta padrão do container
EXPOSE 3000

# Comando de inicialização do servidor
CMD ["npm", "start"]
