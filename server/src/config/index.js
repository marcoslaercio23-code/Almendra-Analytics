import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnvVars = ['GROQ_API_KEY', 'MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter((name) => {
  const value = process.env[name];
  return !value || value.trim() === '';
});

// Não derrube o servidor por falta de env vars.
// Em dev, preferimos iniciar e devolver erros claros por rota (e reportar no /health).
if (missingEnvVars.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(`[config] Variáveis ausentes: ${missingEnvVars.join(', ')} (servidor iniciará em modo degradado)`);
}

const parsedPort = Number.parseInt(process.env.PORT, 10);
const port = Number.isNaN(parsedPort) ? undefined : parsedPort;
const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const groqApiKey = (process.env.GROQ_API_KEY || '').trim();
const groqModel = (process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();
const mongoUri = (process.env.MONGO_URI || '').trim();
const scrapeCron = (process.env.SCRAPE_CRON || '0 6 * * *').trim();

const config = {
  // Servidor
  port: port || 4000,
  nodeEnv,
  missingEnvVars,
  
  // Groq AI
  groq: {
    apiKey: groqApiKey,
    model: groqModel,
  },
  
  // MongoDB
  mongo: {
    uri: mongoUri,
  },
  
  // Cron
  cron: {
    scrapeSchedule: scrapeCron,
    retrySchedule: '0 */4 * * *',
  },
  
  // Scraper
  scraper: {
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  
  // Lista de fontes de notícias
  newsSources: [
    {
      name: 'Globo Rural',
      url: 'https://globorural.globo.com/',
      selectors: {
        articles: 'article, .feed-post-body, .bastian-feed-item',
        title: 'h2 a, .feed-post-body-title a, a.feed-post-link',
        link: 'h2 a, .feed-post-body-title a, a.feed-post-link',
        date: 'time, .feed-post-datetime'
      },
      filterKeywords: ['cacau', 'chocolate', 'commodity', 'amêndoa', 'cacaueiro']
    },
    {
      name: 'Globo Rural - Cacau',
      url: 'https://globorural.globo.com/agricultura/cacau/',
      selectors: {
        articles: 'article, .feed-post-body, .bastian-feed-item',
        title: 'h2 a, .feed-post-body-title a, a.feed-post-link',
        link: 'h2 a, .feed-post-body-title a, a.feed-post-link',
        date: 'time, .feed-post-datetime'
      }
    },
    {
      name: 'Bloomberg Linea Agro',
      url: 'https://www.bloomberglinea.com.br/agro/',
      selectors: {
        articles: 'article, .story-card, div[class*="story"]',
        title: 'h2 a, h3 a, .story-card__headline a, a[class*="headline"]',
        link: 'h2 a, h3 a, .story-card__headline a, a[class*="headline"]',
        date: 'time, span[class*="date"]'
      },
      filterKeywords: ['cacau', 'cocoa', 'chocolate', 'commodity']
    },
    {
      name: 'Cacau News',
      url: 'https://cacaunews.com/',
      selectors: {
        articles: 'article, .post, .entry',
        title: 'h2 a, .entry-title a, h3 a',
        link: 'h2 a, .entry-title a, h3 a',
        date: 'time, .entry-date, .post-date'
      }
    },
    {
      name: 'Costa do Cacau Blog',
      url: 'https://costadocacau.blog.br/',
      selectors: {
        articles: 'article, .post, .entry',
        title: 'h2 a, .entry-title a, h3 a',
        link: 'h2 a, .entry-title a, h3 a',
        date: 'time, .entry-date, .post-date'
      }
    },
    {
      name: 'Forbes Brasil - Cacau',
      url: 'https://forbes.com.br/noticias-sobre/cacau/',
      selectors: {
        articles: 'article, .post-item, div[class*="post"]',
        title: 'h2 a, h3 a, .post-title a, a[class*="title"]',
        link: 'h2 a, h3 a, .post-title a, a[class*="title"]',
        date: 'time, .post-date, span[class*="date"]'
      }
    },
    {
      name: 'Mercado do Cacau',
      url: 'https://mercadodocacau.com.br/news/',
      selectors: {
        articles: 'article, .post, .news-item, div[class*="news"]',
        title: 'h2 a, h3 a, .entry-title a, a[class*="title"]',
        link: 'h2 a, h3 a, .entry-title a, a[class*="title"]',
        date: 'time, .entry-date, span[class*="date"]'
      }
    },
    {
      name: 'Investing.com - Cocoa',
      url: 'https://br.investing.com/commodities/us-cocoa-news',
      selectors: {
        articles: 'article, .js-article-item, div[class*="article"]',
        title: 'a.title, .js-article-item a, a[class*="title"]',
        link: 'a.title, .js-article-item a, a[class*="title"]',
        date: 'time, .date, span[class*="date"]'
      }
    },
    {
      name: 'Notícias Agrícolas - Cacau',
      url: 'https://www.noticiasagricolas.com.br/cotacoes/cacau/cacau-mercado-do-cacau',
      selectors: {
        articles: 'article, .news-item, .list-item, div[class*="news"]',
        title: 'h2 a, h3 a, .news-title a, a[class*="title"]',
        link: 'h2 a, h3 a, .news-title a, a[class*="title"]',
        date: 'time, .news-date, span[class*="date"]'
      }
    }
  ]
};

export default config;
