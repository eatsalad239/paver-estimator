// Lightweight, dependency-free validators for the contact gate.

/** Strip a phone string to digits, dropping a US country code if present. */
export function normalizePhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') return digits.slice(1); // 1-239-... -> 239-...
  return digits;
}

/**
 * Valid US phone per NANP: area code and exchange both start 2-9, 10 digits total.
 * Accepts (239) 555-0142, 239-555-0142, 2395550142, +1 239 555 0142, etc.
 */
export function isValidUSPhone(input) {
  const d = normalizePhone(input);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(d);
}

/** Pragmatic email check — one @, a dot in the domain, no whitespace. */
export function isValidEmail(input) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input ?? '').trim());
}

/** Name must be at least 2 non-space characters. */
export function isValidName(input) {
  return String(input ?? '').trim().length >= 2;
}

/**
 * All conditions required before the contact form can submit:
 * valid name, phone, email, AND the SMS-consent box checked (TCPA).
 */
export function isContactValid(contact) {
  return (
    isValidName(contact?.name) &&
    isValidUSPhone(contact?.phone) &&
    isValidEmail(contact?.email) &&
    contact?.smsConsent === true
  );
}
