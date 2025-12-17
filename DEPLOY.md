# 🚀 Guia de Deploy - Cacau Market Frontend

## 📋 Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn
- Acesso ao servidor Hostinger
- Domínio ou subdomínio configurado

## 🏗️ Build para Produção

### 1. Preparar o Ambiente
```bash
# Criar arquivo .env para produção
cat > .env << EOF
REACT_APP_API_URL=https://seu-dominio.com/api
REACT_APP_ENV=production
REACT_APP_DEBUG=false
EOF
```

### 2. Fazer o Build
```bash
npm run build
```

Isso cria a pasta `build/` pronta para produção.

### 3. Verificar o Build
```bash
# Dentro da pasta build deve conter:
# - index.html
# - /static (CSS, JS, media)
# - favicon.ico
# - robots.txt
```

## 🖥️ Deploy em Hostinger

### Opção 1: Via FTP/SFTP (Recomendado)

1. **Conectar ao servidor**
   - Abra um cliente FTP (FileZilla, WinSCP, etc)
   - Host: ftp.seu-dominio.com
   - Usuário: seu_usuario_ftp
   - Senha: sua_senha_ftp
   - Porta: 21 (FTP) ou 22 (SFTP)

2. **Upload dos arquivos**
   - Navegue até `/public_html` ou `/www`
   - Faça upload de toda a pasta `build`
   - Ou copie o conteúdo de `build` diretamente

3. **Configurar redirecionamento**
   - Crie um arquivo `.htaccess` na raiz:
   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Opção 2: Via cPanel (Se disponível)

1. Acesse **cPanel** > **File Manager**
2. Navegue até `/public_html`
3. Upload > Fazer upload dos arquivos da pasta `build`
4. Extrair arquivos se necessário

### Opção 3: Via Git (Mais avançado)

1. **No servidor**
   ```bash
   cd /home/seu_usuario/public_html
   git clone https://seu-repo.git
   cd cacau-market-frontend
   npm install --legacy-peer-deps
   npm run build
   cp -r build/* .
   ```

2. **Automatizar com webhooks**
   - Configure webhook do GitHub para auto-deploy

## ⚙️ Configurações do Servidor

### Nginx

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    root /var/www/html/cacau-market-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache (via .htaccess)

```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirecionar tudo para index.html exceto arquivos reais
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
</IfModule>
```

## 🔒 SSL/HTTPS

1. **Ativar HTTPS**
   - Hostinger fornece Let's Encrypt gratuito
   - Acesse cPanel > AutoSSL
   - Ativar SSL automático

2. **Redirecionar HTTP para HTTPS**
   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{HTTPS} off
     RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   </IfModule>
   ```

## 📦 Otimizações de Produção

### 1. Minificação
- Já feita automaticamente pelo `npm run build`

### 2. Compressão
- Adicionar ao `.htaccess`:
```
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml
  AddOutputFilterByType DEFLATE text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/x-javascript
  AddOutputFilterByType DEFLATE application/xml application/xhtml+xml
</IfModule>
```

### 3. Cache
- Configurar headers de cache (ver seções acima)

### 4. CDN (Opcional)
- Usar Cloudflare para cache e segurança global
- Domínio > Nameservers > Apontar para Cloudflare

## 📊 Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto antes do build:

```env
# API
REACT_APP_API_URL=https://seu-dominio.com/api

# Ambiente
REACT_APP_ENV=production

# Debug (desativar em produção)
REACT_APP_DEBUG=false

# Opcional: Analytics
REACT_APP_GA_ID=seu-google-analytics-id
```

## ✅ Checklist de Deploy

- [ ] .env configurado com URLs de produção
- [ ] npm run build executado com sucesso
- [ ] Pasta `build` criada
- [ ] Arquivos feitos upload via FTP
- [ ] .htaccess configurado
- [ ] SSL/HTTPS ativado
- [ ] Domínio apontando corretamente
- [ ] Teste a aplicação em https://seu-dominio.com
- [ ] Verificar console do navegador (F12) para erros
- [ ] Testar todas as páginas (Dashboard, Relatórios, Alertas, Configurações)
- [ ] Testar responsividade em mobile
- [ ] Verificar conexão com API backend

## 🧪 Testando Antes de Deploy

```bash
# Build local
npm run build

# Servir localmente para testar
npx serve -s build

# Abrir em http://localhost:3000
```

## 📱 Domains e Subdomínios

### Opção 1: Domínio Principal
```
seu-dominio.com → /public_html
```

### Opção 2: Subdomínio
```
app.seu-dominio.com → /public_html/app
```

Configurar em cPanel > Addon Domains ou Subdomains

## 🔍 Monitoramento Pós-Deploy

### 1. Verificar Console
```javascript
// Abrir F12 no navegador
// Procurar por erros em Console
// Verificar Network para requisições à API
```

### 2. Logs do Servidor
```bash
# SSH no servidor
tail -f /var/log/apache2/error_log
tail -f /var/log/apache2/access_log
```

### 3. Performance
- Usar Google PageSpeed Insights
- Analisar com GTmetrix
- Verificar Lighthouse (Chrome DevTools)

## 🚨 Troubleshooting

### Página em branco
- Verificar console (F12)
- Verificar se o index.html está na raiz
- Verificar se .htaccess está correto

### API não conecta
- Verificar CORS no backend
- Verificar URL da API em .env
- Verificar se backend está rodando

### Assets 404
- Verificar se /static/ está no servidor
- Verificar caminhos relativos vs absolutos
- Limpar cache do navegador (Ctrl+Shift+Delete)

### Slow loading
- Habilitar gzip no servidor
- Configurar cache de assets
- Usar CDN (Cloudflare)

## 📞 Suporte Hostinger

- Chat: https://www.hostinger.com.br/contato
- Email: support@hostinger.com.br
- Documentação: https://docs.hostinger.com.br

## 🎓 Próximos Passos

1. Adicionar analítica (Google Analytics)
2. Configurar monitoramento de erros (Sentry)
3. Implementar backup automático
4. Adicionar CI/CD (GitHub Actions)
5. Configurar alertas de uptime

---

**Versão**: 1.0.0  
**Data**: Dezembro 2025  
**Última Atualização**: Dezembro 2025
