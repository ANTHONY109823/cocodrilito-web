/** Normaliza nombres de categoría para comparar (tildes, mayúsculas, espacios). */
export function normalizeCategoryKey(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

export function categoryMatches(questionCategory: string, categoryName: string): boolean {
  return normalizeCategoryKey(questionCategory) === normalizeCategoryKey(categoryName)
}
