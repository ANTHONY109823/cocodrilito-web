export const PASSWORD_REQUIREMENTS =
  'Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.'

export function validatePassword(password: string): string | null {
  if (!password) return PASSWORD_REQUIREMENTS
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(password)) return 'Incluye al menos una letra mayúscula.'
  if (!/[a-z]/.test(password)) return 'Incluye al menos una letra minúscula.'
  if (!/[0-9]/.test(password)) return 'Incluye al menos un número.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Incluye al menos un símbolo.'
  return null
}

export function getPasswordChecks(password: string) {
  return [
    { label: '8+ caracteres', ok: password.length >= 8 },
    { label: 'Mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Minúscula', ok: /[a-z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
    { label: 'Símbolo', ok: /[^A-Za-z0-9]/.test(password) },
  ]
}
