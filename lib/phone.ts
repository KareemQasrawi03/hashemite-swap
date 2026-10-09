const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Normalises a Jordanian mobile number to 07XXXXXXXX, or returns null. Accepts Arabic digits and +962. */
export function normPhone(v: string): string | null {
  let s = String(v)
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\s\-().]/g, '');
  s = s.replace(/^\+?962/, '0');
  if (/^7[789]\d{7}$/.test(s)) s = '0' + s;
  return /^07[789]\d{7}$/.test(s) ? s : null;
}

export function fmtPhone(p: string): string {
  return p.slice(0, 3) + ' ' + p.slice(3, 6) + ' ' + p.slice(6);
}

/** Wraps a number or code in Unicode LTR isolate marks so it keeps its order inside Arabic text. */
export function ltr(s: string): string {
  return '⁦' + s + '⁩';
}
