# 🗺️ Análise Regional do Cacau - Documentação

## Visão Geral

O módulo de **Análise Regional do Cacau** fornece dados reais, análises e insights sobre o mercado de cacau em diferentes regiões do mundo. Combina:

- 🌤️ **Dados climáticos em tempo real** (Open-Meteo API)
- 💰 **Preços regionais** (Scraping de múltiplas fontes)
- 🌍 **Análise geopolítica** (IA Groq)
- 📰 **Notícias correlacionadas** (Banco de dados local)
- 🤖 **Relatórios completos por IA** (Groq LLaMA)

---

## 🗺️ Regiões Suportadas

### 🇧🇷 Brasil
| ID | Nome | Estado | Coordenadas |
|----|------|--------|-------------|
| `ilheus` | Ilhéus | Bahia | -14.79, -39.05 |
| `itabuna` | Itabuna | Bahia | -14.79, -39.28 |
| `bahia` | Bahia (Estado) | Bahia | -13.00, -41.00 |
| `para` | Pará | Pará | -3.42, -52.22 |
| `espirito_santo` | Espírito Santo | ES | -19.18, -40.31 |

### 🌍 Global
| ID | Nome | País | Produção |
|----|------|------|----------|
| `costa_do_marfim` | Costa do Marfim | Costa do Marfim | ~45% mundial |
| `gana` | Gana | Gana | ~15% mundial |
| `indonesia` | Indonésia | Indonésia | ~10% mundial |
| `nigeria` | Nigéria | Nigéria | ~5% mundial |
| `camaroes` | Camarões | Camarões | ~5% mundial |
| `equador` | Equador | Equador | Cacau fino |

---

## 🛣️ Endpoints da API

### Listar Regiões

```http
GET /api/regions
GET /api/regions?type=BR        # Apenas Brasil
GET /api/regions?type=GLOBAL    # Apenas global
```

### Dados de Região Específica

```http
GET /api/regions/:id
```

Exemplo: `GET /api/regions/ilheus`

### 🌤️ Clima

```http
GET /api/regions/:id/climate    # Clima de uma região
GET /api/regions/all/climate    # Clima de todas as regiões
```

**Resposta exemplo:**
```json
{
  "success": true,
  "data": {
    "region": { "id": "ilheus", "name": "Ilhéus", "country": "Brasil" },
    "current": {
      "temperature": 29.8,
      "windSpeed": 12,
      "weatherDescription": "Parcialmente nublado"
    },
    "last48h": {
      "avgTemperature": 26.4,
      "totalPrecipitation": 0
    },
    "risk": {
      "level": "moderado",
      "factors": ["Seca - precipitação muito baixa"]
    }
  }
}
```

### 💰 Preços

```http
GET /api/regions/:id/price      # Preço de uma região
GET /api/regions/all/prices     # Preços de todas as regiões
```

**Resposta exemplo:**
```json
{
  "success": true,
  "data": {
    "region": { "id": "ilheus", "name": "Ilhéus" },
    "price": 404,
    "unit": "R$/arroba",
    "currency": "BRL",
    "trend": "alta",
    "variation": { "day": 0.24, "week": 3.69 },
    "sources": ["Mercado do Cacau", "Notícias Agrícolas"]
  }
}
```

### 🌍 Geopolítica

```http
GET /api/regions/:id/geopolitical       # Análise de uma região
GET /api/regions/:id/geopolitical?ai=true  # Com análise IA
GET /api/regions/all/geopolitical       # Todas as regiões
```

### 📊 ANÁLISE COMPLETA (Principal)

```http
GET /api/regions/:id/analysis
GET /api/regions/:id/analysis?refresh=true  # Forçar nova análise
```

**📌 Este é o endpoint principal!** Retorna:
- Dados climáticos
- Preços atuais
- Análise geopolítica
- Notícias relacionadas
- **Relatório completo gerado por IA**

**Resposta exemplo:**
```json
{
  "success": true,
  "data": {
    "region": {
      "id": "ilheus",
      "name": "Ilhéus",
      "country": "Brasil",
      "type": "BR"
    },
    "climate": {
      "current": { "temperature": 29.8 },
      "risk": { "level": "moderado" }
    },
    "price": {
      "value": 404,
      "unit": "R$/arroba",
      "trend": "estável"
    },
    "geopolitical": {
      "risk": { "overall": "baixo" }
    },
    "analysis": {
      "riskLevel": "moderado",
      "summary": "A região de Ilhéus enfrenta um clima seco...",
      "climateImpact": "O clima seco pode reduzir a produção...",
      "priceTrend": "estável",
      "recommendation": "Monitorar condições climáticas...",
      "outlook": {
        "shortTerm": "Perspectiva estável para 1-2 semanas",
        "mediumTerm": "Depende de chuvas na região"
      }
    }
  }
}
```

### Análise em Lote

```http
POST /api/regions/analyze-batch
Content-Type: application/json

{
  "regions": ["ilheus", "bahia", "costa_do_marfim"]
}
```

### Análise Global (Todas as Regiões)

```http
GET /api/regions/analyze-all
```
⚠️ **Atenção:** Esta operação pode levar vários minutos!

---

## ⏰ Cron Jobs Automáticos

| Horário | Tarefa | Descrição |
|---------|--------|-----------|
| **07:00** | Atualização Completa | Clima + Preços + Análise IA |
| A cada 6h | Clima | Atualiza dados climáticos |
| 9h-17h (Seg-Sex) | Preços | Atualiza preços regionais |
| **19:00** | Análise Noturna | Roda análise completa |
| A cada 30min | Health Check | Verifica se sistema está ativo |

---

## 📦 Estrutura de Arquivos

```
server/src/
├── regions/
│   ├── regionList.js           # Lista de regiões com coordenadas
│   ├── climateService.js       # API Open-Meteo
│   ├── priceService.js         # Scraping de preços
│   ├── geopoliticalService.js  # Análise geopolítica
│   ├── regionAnalysisService.js # Serviço principal
│   └── logger.js               # Logger simplificado
├── routes/
│   └── regionRoutes.js         # Endpoints da API
├── models/
│   └── RegionalAnalysis.js     # Schema MongoDB
├── cronJobs.js                 # Tarefas agendadas
└── tests/
    ├── testRegions.js
    ├── testClimate.js
    ├── testPrices.js
    └── testRegionalAnalysis.js
```

---

## 🧪 Executar Testes

```bash
cd server

# Testar lista de regiões
node src/tests/testRegions.js

# Testar serviço de clima
node src/tests/testClimate.js

# Testar serviço de preços
node src/tests/testPrices.js

# Testar análise completa (requer MongoDB e Groq)
node src/tests/testRegionalAnalysis.js
```

---

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cocoa_news

# Groq AI
GROQ_API_KEY=gsk_xxx...

# Servidor
PORT=4000
NODE_ENV=development
```

### APIs Utilizadas

| API | Uso | Autenticação |
|-----|-----|--------------|
| Open-Meteo | Dados climáticos | Não requer |
| Mercado do Cacau | Preços Brasil | Scraping |
| Notícias Agrícolas | Preços Brasil | Scraping |
| Investing.com | Preços globais | Scraping |
| Groq | Análise IA | API Key |

---

## 📊 Exemplo de Uso

### Obter análise de Ilhéus:

```bash
curl http://localhost:4000/api/regions/ilheus/analysis
```

### Resultado esperado:

```
📌 Região: Ilhéus
🌡️ Clima: 30°C, parcialmente nublado
💰 Preço: R$ 404/arroba
🌍 Geopolítica: risco baixo
📈 Tendência: estável
📊 Opinião da IA: Condições climáticas requerem monitoramento...
```

---

## 🚀 Próximos Passos

1. [ ] Adicionar histórico de preços
2. [ ] Gráficos de tendência
3. [ ] Alertas automáticos por email
4. [ ] Dashboard frontend
5. [ ] Mais fontes de preços (ICO, Bloomberg)

---

**Desenvolvido para o projeto Cacau Market** 🍫
