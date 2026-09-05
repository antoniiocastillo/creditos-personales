// Etiquetas en español para los valores enum que vienen de la base de datos.
// Centralizado aquí para no repetir el mismo diccionario en cada página.

export const methodLabel: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  other: 'Otro',
};

export const loanStatusLabel: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paid_off: 'Liquidado',
  cancelled: 'Cancelado',
  restructured: 'Reestructurado',
};

export const loanStatusBadge: Record<string, string> = {
  draft: 'pending',
  active: 'paid',
  paid_off: 'paid',
  cancelled: 'late',
  restructured: 'pending',
};

export const installmentStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  partial: 'Parcial',
  overdue: 'Vencida',
  restructured: 'Reestructurada',
};

export const lateRuleLabel: Record<string, string> = {
  daily: 'Por día de atraso',
  per_overdue_period: 'Por periodo vencido',
  percent_overdue_balance: '% sobre saldo vencido',
};
