import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * 雜湊密碼
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 驗證密碼
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 驗證密碼強度
 * 至少 8 字元，包含大小寫字母與數字
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("密碼長度至少需要 8 個字元");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("密碼需包含至少一個小寫字母");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("密碼需包含至少一個大寫字母");
  }

  if (!/\d/.test(password)) {
    errors.push("密碼需包含至少一個數字");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

