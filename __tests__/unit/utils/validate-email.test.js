import { validateEmail } from '../../../utils/validate-email.js';

describe('validateEmail utility', () => {
  it('should validate a correctly formatted email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject an email with no @ symbol', () => {
    expect(validateEmail('testexample.com')).toBe(false);
  });

  it('should reject an email with no domain', () => {
    expect(validateEmail('test@')).toBe(false);
  });

  it('should reject an email with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false);
  });

  it('should reject null or undefined', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});