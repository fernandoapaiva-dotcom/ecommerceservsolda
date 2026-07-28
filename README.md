# ServSolda — E-commerce B2B/B2C & Orçamentos via WhatsApp

Plataforma de e-commerce completa e otimizada para a **ServSolda**, com fluxo de orçamentos integrado ao WhatsApp, alertas automáticos por e-mail para o administrador, sincronização de estoque com ERP Softsystem e painel administrativo para gerenciamento de catálogo, banners, categorias e personalização de tema visual com Inteligência Artificial.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 18+ (Vite), Tailwind CSS, React Router v6, Context API + useReducer.
- **Backend/API**: Node.js, Express (API REST), Node-Cron, PDFKit (geração de PDF no servidor).
- **Banco de Dados**: PostgreSQL (Prisma ORM) em Produção / SQLite para Desenvolvimento.
- **Gerenciador de Processos**: PM2 (ecosystem.config.js).

---

## 📂 Estrutura de Pastas Explicada

```text
servsolda_site/
├── backend/                  # Código do servidor Node.js
│   ├── src/
│   │   ├── middlewares/      # Middlewares de Autenticação JWT e CORS
│   │   ├── models/           # Inicialização do Prisma Client
│   │   ├── routes/           # Endpoints da API REST (auth, products, configs, reviews, etc)
│   │   ├── services/         # Regras de negócio (geração de PDF, envio de e-mails, sinc do ERP)
│   │   └── server.js         # Ponto de entrada do backend Express (Node.js)
│   ├── package.json          # Dependências do backend
│   └── seed.js               # Dados iniciais do catálogo e Admin Padrão
├── frontend/                 # Código da aplicação SPA React
│   ├── src/
│   │   ├── admin/            # Painel Administrativo (Layout, Configurações, Produtos, Seções)
│   │   ├── components/       # Componentes reusáveis (Header, Footer, WhatsAppButton)
│   │   ├── context/          # Estados globais (Carrinho, Autenticação, Configurações)
│   │   ├── pages/            # Páginas públicas (Home, Lista de Produtos, Detalhes, Checkout)
│   │   └── main.jsx          # Ponto de entrada do React
│   └── tailwind.config.js    # Configurações do Tailwind CSS v3
├── ecosystem.config.js       # Arquivo de configuração do PM2 para Produção
├── .env.example              # Exemplo de variáveis de ambiente do projeto
└── README.md                 # Instruções de instalação e deploy
```

---

## 💻 Instalação e Execução Local

### Pré-requisitos
- **Node.js**: Versão 18 ou superior.
- **npm** (incluso com o Node.js).
- **PostgreSQL** ou **SQLite** configurado localmente.

### Passo a Passo

1. **Clonar o Repositório**:
   ```bash
   git clone <link-do-repositorio>
   cd servsolda_site
   ```

2. **Copiar o arquivo `.env.example` para `.env`**:
   ```bash
   cp .env.example backend/.env
   ```
   *Edite `backend/.env` com as suas credenciais locais (banco de dados, chaves de API, etc).*

3. **Instalar dependências e rodar migrações**:
   Você pode rodar o script automatizado para Linux/macOS:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   Ou executar manualmente passo a passo:
   ```bash
   # Instalar dependências
   cd backend && npm install
   cd ../frontend && npm install
   
   # Gerar Prisma Client e sincronizar o banco
   cd ../backend
   npx prisma db push
   node seed.js
   ```

4. **Rodar em Desenvolvimento**:
   - Para o **Backend** (porta 5000):
     ```bash
     cd backend
     npm run dev
     ```
   - Para o **Frontend** (porta 5173):
     ```bash
     cd frontend
     npm run dev
     ```

---

## 🚀 Guia de Deploy na Hostinger (Plano Business ou VPS)

A Hostinger oferece suporte nativo para aplicações Node.js no painel **hPanel** (através de servidor com gerenciador PM2 por trás) ou por meio de acesso **Terminal SSH** direto.

### Etapa 1: Preparar os arquivos para Upload
1. No seu ambiente local, gere o build otimizado do frontend executando:
   ```bash
   cd frontend
   npm run build
   ```
   *Isso gerará a pasta `frontend/dist`. O backend está configurado para servir esses arquivos estáticos automaticamente quando rodar em modo de produção (`NODE_ENV=production`).*
2. Comprima todos os arquivos do projeto (exceto `node_modules`, `backend/node_modules`, `.git` e arquivos de banco de dados locais `.db`) em um arquivo `.zip`.

### Etapa 2: Configurar o Aplicativo Node.js no hPanel
1. Faça login no painel **hPanel** da Hostinger.
2. Navegue até **Sites** -> **Node.js**.
3. Crie um novo aplicativo apontando para:
   - **Nome do App**: `servsolda`
   - **Versão do Node**: `18.x` ou `20.x`
   - **Arquivo de Script de Inicialização (Startup Script)**: `backend/src/server.js`
   - **Diretório do App**: `/public_html` (ou subdiretório de sua escolha)
4. Use o **Gerenciador de Arquivos** da Hostinger para fazer upload do `.zip` e descompactá-lo no diretório do aplicativo.

### Etapa 3: Configurar Variáveis de Ambiente no hPanel
No painel de gerenciamento do aplicativo Node.js no hPanel, **não use o arquivo `.env`**. Em vez disso, cadastre as variáveis de ambiente diretamente nas seções de configuração do painel Node.js:

- `DATABASE_URL`: `postgresql://usuario:senha@endereco-host-postgresql:5432/nome_banco?sslmode=require` *(Obtenha as credenciais na seção Bancos de Dados PostgreSQL no hPanel)*
- `NODE_ENV`: `production`
- `PORT`: `5000` *(Porta interna roteada pelo proxy da Hostinger)*
- `JWT_SECRET`: *(Uma string longa e segura para as sessões dos usuários)*
- `VITE_API_URL`: `https://seu-dominio-ou-ip.com`
- `UPLOADS_PATH`: `/home/uXXXXXXX/public_html/uploads` *(Caminho absoluto da pasta uploads na Hostinger para evitar perdas de referências no upload de imagens)*

#### ⚙️ Configuração de IA e E-mail SMTP (Após o Deploy):
As credenciais de **Inteligência Artificial (Google Gemini API Key)** e os dados de **E-mail de Alerta (SMTP)** não são mais configurados em variáveis de ambiente `.env`. Acesse a tela de **Configurações Gerais** no painel administrativo do site em `https://seu-dominio.com/admin/config` para cadastrar estes dados diretamente no banco de dados.

#### 🔑 Como gerar a senha de app do Google Workspace para SMTP:
1. Acesse [myaccount.google.com](https://myaccount.google.com) logado com a conta **comercial@servsolda.com.br**.
2. Vá em **Segurança** -> **Verificação em duas etapas** (ative caso ainda não esteja ativada).
3. Vá em **Segurança** -> **Senhas de app**.
4. Crie uma nova senha de app dando o nome de `"ServSolda Site"`.
5. Copie a senha de 16 caracteres gerada e use-a para preencher o campo **SMTP Senha** no Painel Admin do site.

### Etapa 4: Configuração via Terminal SSH da Hostinger
Para rodar comandos como sincronizar o banco de dados e aplicar o seed inicial, acesse sua conta via SSH:

1. Ative o acesso SSH no painel da Hostinger em **Avançado** -> **SSH**.
2. Conecte-se via terminal:
   ```bash
   ssh uXXXXXXX@endereco-ip-da-sua-hospedagem -p 65002
   ```
3. Navegue até a pasta do projeto:
   ```bash
   cd public_html
   ```
4. Instale as dependências do backend em produção:
   ```bash
   cd backend
   npm install --omit=dev
   ```
5. Execute a sincronização do banco de dados PostgreSQL na Hostinger:
   ```bash
   npx prisma db push
   ```
6. Popule o banco com o seed inicial (cria as categorias padrão, produtos de teste e o usuário administrador):
   ```bash
   node seed.js
   ```

### Etapa 5: Inicializando o PM2 (Ecosystem)
A Hostinger gerencia a aplicação com PM2. O arquivo `ecosystem.config.js` incluído no projeto mapeia a execução do aplicativo.
No painel Node.js da Hostinger, clique em **Iniciar/Reiniciar** para rodar a aplicação através do PM2 configurado.

### Etapa 6: SSL e Domínio
O tráfego de entrada na Hostinger é roteado da porta 80/443 do seu domínio automaticamente para a porta configurada no Node.js (5000). Certifique-se de:
1. Ir em **Segurança** -> **SSL** e instalar o certificado SSL gratuito (Let's Encrypt) no seu domínio.
2. Habilitar o redirecionamento automático HTTPS no painel.

---

## 👤 Credenciais Padrão do Administrador (Seed)

Após rodar o script `seed.js` ou realizar a sincronização inicial do banco, as seguintes credenciais de acesso estarão disponíveis:

- **E-mail**: `admin@servsolda.com.br`
- **Senha**: `Admin@2026!`
- **Role**: `ADMIN`

*IMPORTANTE: Após o primeiro login, altere a senha nas configurações do perfil para garantir a segurança da plataforma.*
