/**
 * 🔧 Logger simplificado para módulo de regiões
 * Funciona independente do winston para testes
 */

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Log com timestamp
 */
export function log(level, message) {
  const now = new Date().toLocaleTimeString('pt-BR');
  const prefix = `${now} [${level}]:`;
  
  switch (level) {
    case 'error':
      console.error(`${colors.red}${prefix}${colors.reset}`, message);
      break;
    case 'warn':
      console.warn(`${colors.yellow}${prefix}${colors.reset}`, message);
      break;
    case 'info':
      console.log(`${colors.cyan}${prefix}${colors.reset}`, message);
      break;
    case 'debug':
      console.log(`${colors.blue}${prefix}${colors.reset}`, message);
      break;
    default:
      console.log(prefix, message);
  }
}

export default { log };
