import { describe, expect, it } from 'vitest';
import { numberToWords, moneyInWords } from './numberToWords';

describe('numberToWords', () => {
  it('convierte números comunes', () => {
    expect(numberToWords(0)).toBe('cero');
    expect(numberToWords(1)).toBe('un');
    expect(numberToWords(21)).toBe('veintiún');
    expect(numberToWords(100)).toBe('cien');
    expect(numberToWords(150)).toBe('ciento cincuenta');
    expect(numberToWords(1000)).toBe('mil');
    expect(numberToWords(1500)).toBe('mil quinientos');
    expect(numberToWords(6000)).toBe('seis mil');
    expect(numberToWords(10000)).toBe('diez mil');
    expect(numberToWords(802)).toBe('ochocientos dos');
  });

  it('formatea cantidades en letras estilo pagaré', () => {
    expect(moneyInWords(1000)).toBe('MIL PESOS 00/100 M.N.');
    expect(moneyInWords(1600)).toBe('MIL SEISCIENTOS PESOS 00/100 M.N.');
    expect(moneyInWords(802.92)).toBe('OCHOCIENTOS DOS PESOS 92/100 M.N.');
  });
});
