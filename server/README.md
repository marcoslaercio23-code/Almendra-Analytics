# 🍫 Cacau News Server

Backend completo para coleta e classificação automática de notícias sobre cacau usando **Groq AI**.

## 📁 Estrutura

```
server/
├── src/
│   ├── config/index.js         # Configurações + fontes
│   ├── database/connection.js  # Conexão MongoDB
│   ├── models/News.js          # Schema de notícias
│   ├── services/
│   │   ├── scraperService.js   # Web scraping
│   │   └── classifierService.js # Classificação IA
│   ├── routes/
│   │   ├── newsRoutes.js       # /api/news
│   │   └── aiRoutes.js         # /api/ai
│   ├── jobs/cronJobs.js        # Agendador CRON
│   ├── scripts/
│   │   ├── runScraper.js       # Scraping manual
│   │   └── seedDatabase.js     # Dados exemplo
│   ├── tests/
│   │   ├── testGroq.js         # Teste IA
│   │   └── testScraper.js      # Teste scraper
│   ├── utils/logger.js         # Logger Winston
│   └── index.js                # Entry point
├── .env                        # Variáveis
├── .env.example                # Exemplo
├── package.json                # Scripts
└── README.md
```

## 🚀 Instalação

### 1. Instalar dependências

```bash
cd server
npm install
```

### 2. Configurar .env

```bash
cp .env.example .env
notepad .env
```

**Variáveis:**

```env
PORT=4000
NODE_ENV=development
GROQ_API_KEY=gsk_sua_chave_aqui
GROQ_MODEL=llama-3.1-8b-instant
MONGO_URI=mongodb://localhost:27017/cocoa_news
SCRAPE_CRON=0 6 * * *
```

### 3. Obter API Key Groq

1. Acesse https://console.groq.com
2. Crie conta gratuita
3. Vá em "API Keys" → criar chave
4. Cole no `.env`

### 4. Instalar MongoDB

**Windows:**
```powershell
choco install mongodb
mongod
```

**Ou use MongoDB Atlas (cloud)** em https://cloud.mongodb.com

## 📋 Scripts

```bash
# Desenvolvimento (hot reload)
npm run dev

# Produção
npm start

# Testar conexão Groq
npm run test:groq

# Testar scraper
npm run test:scraper

# Executar scraping manual
npm run scrape:now

# Popular banco com exemplos
npm run db:seed
```

## 🔌 API Endpoints

### Notícias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/news` | Listar notícias |
| `GET` | `/api/news/classified` | Por relevância |
| `GET` | `/api/news/stats` | Estatísticas |
| `GET` | `/api/news/:id` | Detalhes |
| `POST` | `/api/news/scrape` | Executar scraping |
| `POST` | `/api/news/classify-pending` | Classificar pendentes |
| `POST` | `/api/news/run-job` | Job completo |
| `DELETE` | `/api/news/:id` | Remover |

### IA

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/ai/test` | Testar Groq |
| `GET` | `/api/ai/config` | Configuração |
| `POST` | `/api/ai/classify` | Classificar texto |
| `POST` | `/api/ai/classify-batch` | Lote (max 10) |

## 📊 Exemplos

```bash
# Listar notícias
curl http://localhost:4000/api/news

# Filtrar por score
curl "http://localhost:4000/api/news?minScore=2"

# Notícias relevantes
curl http://localhost:4000/api/news/classified

# Classificar manualmente
curl -X POST http://localhost:4000/api/ai/classify \
  -H "Content-Type: application/json" \
  -d '{"title": "Preço do cacau atinge recorde"}'

# Executar scraping
curl -X POST http://localhost:4000/api/news/scrape
```

## ⏰ Cron Jobs

| Job | Schedule | Descrição |
|-----|----------|-----------|
| Scrape diário | `0 6 * * *` | Coleta + classificação às 6h |
| Retry | `0 */4 * * *` | Reclassifica erros a cada 4h |

## 🏷️ Sistema de Classificação

| Score | Label | Descrição |
|-------|-------|-----------|
| 0 | Não relevante | Sem relação com cacau |
| 1 | Pouco relevante | Menção superficial |
| 2 | Relevante | Informação útil |
| 3 | Muito relevante | Impacto direto no mercado |

## 📰 Fontes de Notícias

- Globo Rural
- Globo Rural - Cacau
- Bloomberg Linea Agro
- Cacau News
- Costa do Cacau Blog
- Forbes Brasil - Cacau
- Mercado do Cacau
- Investing.com - Cocoa
- Notícias Agrícolas - Cacau

## 🛠️ Tecnologias

- **Express** - Framework web
- **Mongoose** - ODM MongoDB
- **Groq SDK** - IA para classificação
- **Axios + Cheerio** - Web scraping
- **Node-cron** - Agendamento
- **Winston** - Logging
- **Helmet + CORS** - Segurança

## 📄 Licença

MIT © Almendra Analytics
