// Paleta do protótipo no Figma.
export const colors = {
  primary: '#1F8A3A',
  primaryDark: '#16692C',
  primaryLight: '#BFE3C8',
  primarySoft: '#E3F2E6',
  accent: '#FF8A00',
  accentSoft: '#FFF1E0',
  background: '#F6F7F4',
  surface: '#FFFFFF',
  text: '#1D1D1D',
  textSecondary: '#6B6B6B',
  placeholder: '#9A9A9A',
  border: '#DCDCDC',
  inputBackground: '#FAFAFA',
  danger: '#C62828',
  dangerSoft: '#FDECEA',
  info: '#1565C0',
  infoSoft: '#E3F2FD',
  muted: '#D9D9D9',
};

// Cores e textos de cada status de pedido (usados pelo cliente e pela empresa).
export const statusInfo = {
  pendente: { label: 'Aguardando a loja', color: '#E65100', background: '#FFF3E0', icon: 'time-outline' },
  aceito: { label: 'Em separação', color: '#1565C0', background: '#E3F2FD', icon: 'cube-outline' },
  enviado: { label: 'Saiu para entrega', color: '#6A1B9A', background: '#F3E5F5', icon: 'bicycle-outline' },
  entregue: { label: 'Entregue', color: '#1F8A3A', background: '#E3F2E6', icon: 'checkmark-circle-outline' },
  recusado: { label: 'Recusado pela loja', color: '#C62828', background: '#FDECEA', icon: 'close-circle-outline' },
  cancelado: { label: 'Cancelado', color: '#6B6B6B', background: '#EEEEEE', icon: 'close-circle-outline' },
};
