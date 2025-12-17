import React from 'react';

const getStyleByStatus = (status) => {
  switch (status) {
    case 'MOVIMENTO_FORTE':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'MOVIMENTO_MODERADO':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'MOVIMENTO_BAIXO':
      return 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40';
    case 'SEM_MOVIMENTO':
    default:
      return 'bg-[#231A14]/60 text-[#8B7355] border-[#3E352F]';
  }
};

const getIconByStatus = (status) => {
  switch (status) {
    case 'MOVIMENTO_FORTE':
      return '🏅';
    case 'MOVIMENTO_MODERADO':
      return '🎖️';
    case 'MOVIMENTO_BAIXO':
      return '📌';
    case 'SEM_MOVIMENTO':
    default:
      return '➖';
  }
};

export default function MovementBadge({ certificate, className = '' }) {
  if (!certificate) return null;

  const status = certificate.status || 'SEM_MOVIMENTO';
  const label = certificate.label || 'Certificado de Movimento';
  const score = Number.isFinite(certificate.score) ? certificate.score : null;
  const direction = certificate.direction || 'LATERAL';

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStyleByStatus(status)} ${className}`}
      title={certificate.message || ''}
    >
      <span className="text-lg">{getIconByStatus(status)}</span>
      <span className="font-semibold">{label}</span>
      <span className="opacity-80">({direction})</span>
      {score !== null && <span className="text-sm opacity-80">• {score}/100</span>}
    </div>
  );
}
