/**
 * passwordPolicy.js — Enterprise Strong Password Validation Utility
 * Enforces:
 *   1. Minimum 8 characters (recommends 12+)
 *   2. At least 1 uppercase letter (A-Z)
 *   3. At least 1 lowercase letter (a-z)
 *   4. At least 1 number (0-9)
 *   5. At least 1 special symbol (!@#$%^&*...)
 */

function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Password is required and must be a string.',
      criteria: {
        length: false,
        upper: false,
        lower: false,
        number: false,
        symbol: false,
      },
    };
  }

  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };

  const valid = criteria.length && criteria.upper && criteria.lower && criteria.number && criteria.symbol;

  if (!criteria.length) {
    return { valid: false, message: 'Password must contain at least 8 characters.', criteria };
  }
  if (!criteria.upper) {
    return { valid: false, message: 'Password must contain at least 1 uppercase letter (A-Z).', criteria };
  }
  if (!criteria.lower) {
    return { valid: false, message: 'Password must contain at least 1 lowercase letter (a-z).', criteria };
  }
  if (!criteria.number) {
    return { valid: false, message: 'Password must contain at least 1 number (0-9).', criteria };
  }
  if (!criteria.symbol) {
    return { valid: false, message: 'Password must contain at least 1 special symbol (!@#$%^&*).', criteria };
  }

  return { valid: true, message: 'Password satisfies strong security requirements.', criteria };
}

module.exports = {
  validatePasswordStrength,
};
