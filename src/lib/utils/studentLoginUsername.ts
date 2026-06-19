export function buildStudentFullName(
  firstName: string,
  paternalSurname: string,
  maternalSurname?: string
): string {
  return [firstName, paternalSurname, maternalSurname ?? '']
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

export function generateStudentLoginUsernameFromParts(
  firstName: string,
  paternalSurname: string
): string | null {
  return generateStudentLoginUsername(buildStudentFullName(firstName, paternalSurname))
}

/**
 * Usuario de acceso alumno: inicial del nombre + apellido paterno (ej. Juan Pérez → JPEREZ).
 * Debe coincidir con StudentLoginUsernameHelper en el backend.
 */
export function generateStudentLoginUsername(fullName: string): string | null {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null

  const firstInitial = parts[0].match(/[A-Za-zÀ-ÿ]/)?.[0]
  if (!firstInitial) return null

  const surname = parts.length === 1 ? parts[0].slice(1) : parts.length === 2 ? parts[1] : parts[1]
  if (!surname) return null

  const raw = firstInitial + surname
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()

  return normalized || null
}
