import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  isValidUSPhone,
  isValidEmail,
  isValidName,
  isContactValid,
} from './validation.js';

describe('normalizePhone', () => {
  it('strips formatting to 10 digits', () => {
    expect(normalizePhone('(239) 555-0142')).toBe('2395550142');
  });
  it('drops a leading US country code', () => {
    expect(normalizePhone('+1 239 555 0142')).toBe('2395550142');
    expect(normalizePhone('1-239-555-0142')).toBe('2395550142');
  });
});

describe('isValidUSPhone', () => {
  it('accepts common US formats', () => {
    expect(isValidUSPhone('(239) 555-0142')).toBe(true);
    expect(isValidUSPhone('239-555-0142')).toBe(true);
    expect(isValidUSPhone('2395550142')).toBe(true);
    expect(isValidUSPhone('+1 239 555 0142')).toBe(true);
    expect(isValidUSPhone('1-239-555-0142')).toBe(true);
  });
  it('rejects invalid numbers', () => {
    expect(isValidUSPhone('123')).toBe(false); // too short
    expect(isValidUSPhone('239-555-012')).toBe(false); // 9 digits
    expect(isValidUSPhone('0239555012')).toBe(false); // area code starts with 0
    expect(isValidUSPhone('123-555-0142')).toBe(false); // area code starts with 1
    expect(isValidUSPhone('239-155-0142')).toBe(false); // exchange starts with 1
    expect(isValidUSPhone('not a phone')).toBe(false);
    expect(isValidUSPhone('')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('mike@example.com')).toBe(true);
    expect(isValidEmail('mike.smith+leads@paver-co.io')).toBe(true);
  });
  it('rejects malformed addresses', () => {
    expect(isValidEmail('mike@')).toBe(false);
    expect(isValidEmail('mike@example')).toBe(false); // no TLD dot
    expect(isValidEmail('mike example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidName', () => {
  it('requires at least 2 non-space chars', () => {
    expect(isValidName('Al')).toBe(true);
    expect(isValidName(' A ')).toBe(false);
    expect(isValidName('')).toBe(false);
  });
});

describe('isContactValid (submit gate)', () => {
  const good = {
    name: 'Mike Smith',
    phone: '(239) 555-0142',
    email: 'mike@example.com',
    smsConsent: true,
  };

  it('passes when everything is valid AND consent is checked', () => {
    expect(isContactValid(good)).toBe(true);
  });

  it('fails without SMS consent (TCPA gate)', () => {
    expect(isContactValid({ ...good, smsConsent: false })).toBe(false);
  });

  it('fails on any invalid field', () => {
    expect(isContactValid({ ...good, phone: '123' })).toBe(false);
    expect(isContactValid({ ...good, email: 'bad' })).toBe(false);
    expect(isContactValid({ ...good, name: '' })).toBe(false);
  });
});
