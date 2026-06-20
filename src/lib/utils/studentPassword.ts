/** Normaliza contraseña DNI del alumno (8 dígitos con ceros a la izquierda). */
export function normalizeStudentDniPassword(password: string): string {
  const trimmed = password.trim()
  if (/^\d{1,8}$/.test(trimmed)) return trimmed.padStart(8, '0')
  return trimmed
}
