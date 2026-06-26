#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== 1. Instalando dependências do Backend ==="
cd backend
npm install

echo "=== 2. Instalando dependências do Frontend ==="
cd ../frontend
npm install

echo "=== 3. Configurando variáveis de ambiente ==="
cd ..
if [ ! -f backend/.env ]; then
  cp .env.example backend/.env
  echo "Arquivo backend/.env criado a partir de .env.example. Certifique-se de configurar as chaves!"
else
  echo "Arquivo backend/.env já existe. Pulando cópia."
fi

echo "=== 4. Gerando Prisma Client e sincronizando banco de dados ==="
cd backend
npx prisma generate
npx prisma db push

echo "=== 5. Rodando Seed do banco de dados ==="
node seed.js

echo "=== 6. Iniciando servidores de Desenvolvimento ==="
echo "Para rodar em desenvolvimento, você pode executar:"
echo "  No backend: npm run dev"
echo "  No frontend: npm run dev"
