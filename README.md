# 🫘 Cacau Market - Frontend React

Sistema de análise de mercado de cacau em tempo real com autenticação Supabase, gráficos interativos e alertas personalizados.

## ✨ Características

### 📊 Dashboard
- Gráficos em tempo real com Recharts
- Estatísticas de preços, produção e exportação
- Abas interativas para diferentes análises
- Cards com tendências

### 🚨 Sistema de Alertas
- Criar alertas por tipo (preço, produção, clima, câmbio)
- Editar e deletar alertas
- Notificações automáticas
- Tabela com histórico

### 📄 Relatórios
- Gerar relatórios por período
- Filtrar por tipo e região
- Editar e atualizar relatórios
- Download de dados

### 🔐 Autenticação
- Login seguro com email/senha
- Registro com validação
- Proteção de rotas
- Logout

## 🚀 Início Rápido

### 1. Configurar Supabase

Acesse https://supabase.com e:
1. Crie uma conta (gratuita)
2. Crie um novo projeto
3. Vá em **Settings > API**
4. Copie **Project URL** e **anon public key**

### 2. Criar `.env.local`

Na raiz do projeto:

```bash
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...sua-chave...
REACT_APP_API_URL=http://localhost:4000
REACT_APP_ENV=development
REACT_APP_DEBUG=true
```

### 3. Instalar Dependências

```bash
# Com PNPM (recomendado)
pnpm install

# Com NPM
npm install
```

### 4. Executar Localmente

```bash
pnpm start
# Abre em http://localhost:3000
```

### 5. Testar Login

1. Clique em "Registre-se agora"
2. Preencha dados
3. Faça login
4. Dashboard carregado ✅

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 18.2 | Framework |
| Material UI | 5.13 | UI Components |
| Recharts | 2.8 | Gráficos |
| Zustand | 4.4 | State Management |
| Supabase | 2.87 | Auth/DB |
| react-toastify | 11.0 | Notificações |
| Tailwind CSS | 3.3 | Utility CSS |
| date-fns | 2.30 | Datas |

## 📁 Estrutura

```
src/
├── api/
│   ├── client.js           # Axios
│   └── supabase.js         # Supabase ✅
├── hooks/
│   ├── useAuth.js          # Autenticação ✅
│   └── useData.js          # Dados
├── pages/
│   ├── Login.js            # Login ✅
│   ├── Register.js         # Registro ✅
│   ├── Dashboard.js        # Dashboard
│   ├── Reports.js          # Relatórios
│   ├── Alerts.js           # Alertas
│   └── Settings.js         # Configurações
├── components/
│   ├── Layout/Layout.js    # Sidebar + AppBar
│   └── StatCard.js         # Cards
├── store/
│   └── appStore.js         # Zustand
├── utils/
│   ├── helpers.js          # Funções
│   └── toast.js            # Notificações ✅
├── App.js                  # Router ✅
└── index.js                # Entry point ✅
```

## 🔗 Backend API

Endpoints esperados em `http://localhost:4000`:

- `GET /api/prices` - Preços
- `GET /api/forecasts` - Previsões
- `GET /api/production` - Produção
- `GET /api/weather` - Clima
- `GET /api/exchange` - Câmbio
- `GET /api/inventory` - Inventário
- `GET /api/alerts` - Alertas
- `POST /api/alerts` - Criar alerta
- `GET /api/reports` - Relatórios
- `POST /api/reports` - Gerar relatório

## 🎨 Temas

**Tema Cacau:**
- Primária: `#8B4513` (Marrom)
- Secundária: `#FFD700` (Ouro)
- Sucesso: `#4CAF50`
- Erro: `#F44336`
- Aviso: `#FF9800`

## 📱 Responsividade

✅ Desktop (1920px+)  
✅ Tablet (768px - 1024px)  
✅ Mobile (320px - 767px)  
✅ Drawer responsivo  

## 🚀 Deployment

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod
```

### Build Estático
```bash
pnpm build
serve -s build
```

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Cannot find module '@supabase/supabase-js'" | `pnpm install` |
| "REACT_APP_SUPABASE_URL is required" | Criar `.env.local` |
| "Connection refused" | Backend não está rodando |
| Estilos não carregam | `rm -rf node_modules/.cache` |
| Supabase não conecta | Verificar credenciais em `.env.local` |

## 📚 Documentação

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Setup Supabase
- [SUPABASE_INTEGRACAO.md](SUPABASE_INTEGRACAO.md) - Integração
- [CONCLUSAO_FINAL.md](CONCLUSAO_FINAL.md) - Status Final
- [ESTRUTURA_VISUAL.md](ESTRUTURA_VISUAL.md) - Layout

## ✅ Status

✅ **Pronto para Produção** (v1.0.0)

- ✅ Autenticação com Supabase
- ✅ Proteção de rotas
- ✅ Notificações
- ✅ Layout responsivo
- ✅ Gráficos interativos
- ✅ Compilação sem erros

## 📞 Suporte

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Material UI](https://mui.com)
- [Recharts](https://recharts.org)

---

**Desenvolvido com ❤️ para o mercado de cacau**
