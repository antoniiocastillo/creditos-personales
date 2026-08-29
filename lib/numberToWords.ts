const UNIDADES = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIEZ_A_DIECINUEVE = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function twoDigits(n: number): string {
  if (n === 0) return '';
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIEZ_A_DIECINUEVE[n - 10];
  if (n === 20) return 'veinte';
  if (n === 21) return 'veintiún';
  if (n < 30) return 'veinti' + UNIDADES[n - 20];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return DECENAS[d] + (u ? ' y ' + UNIDADES[u] : '');
}

function threeDigits(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const r = n % 100;
  return (c ? CENTENAS[c] + (r ? ' ' : '') : '') + twoDigits(r);
}

export function numberToWords(n: number): string {
  if (n === 0) return 'cero';
  let result = '';
  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;
  if (millones) result += (millones === 1 ? 'un millón' : `${threeDigits(millones)} millones`) + ' ';
  if (miles) result += (miles === 1 ? 'mil' : `${threeDigits(miles)} mil`) + ' ';
  if (resto) result += threeDigits(resto);
  return result.trim();
}

/** Formato tradicional para pagarés/cheques en México: "UN MIL QUINIENTOS PESOS 00/100 M.N." */
export function moneyInWords(amount: number): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100)
    .toString()
    .padStart(2, '0');
  const words = numberToWords(whole).toUpperCase();
  return `${words} PESOS ${cents}/100 M.N.`;
}
