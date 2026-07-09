import {
  applyCurrentGradeSelection,
  categoryLabelFromTrack,
  CURRENT_GRADE_SELECT_OPTIONS,
  parseCurrentGradeFromText,
  promotionGradeLabel,
  studentClassificationFromPostulationGrade,
} from '@/lib/constants/promotionGrades'
import { trackLabel } from '@/lib/constants/trackTypes'
import { SUBSCRIPTION_PLANS } from '@/lib/constants/subscriptionPlans'
import {
  buildStudentFullName,
  generateStudentLoginUsernameFromParts,
} from '@/lib/utils/studentLoginUsername'

export interface ExcelPreviewRow {
  rowNumber: number
  firstName: string
  paternalSurname: string
  maternalSurname?: string | null
  dni: string
  fullName: string
  loginUsername: string
  currentGrade: number | null
  currentGradeLabel: string
  postulationGradeLabel: string
  trackLabel: string
  planDays: number
  promotionGrade: number
  trackType: number
  rankLabel: string
  hierarchyLabel: string
  categoryLabel: string
  valid: boolean
  error?: string | null
}

type ApiPreviewRow = ExcelPreviewRow & {
  currentPromotionGrade?: number
}

export function normalizePreviewRowsFromApi(rows: ApiPreviewRow[]): ExcelPreviewRow[] {
  const normalized = rows.map((row) => {
    const currentGrade =
      row.currentGrade ??
      row.currentPromotionGrade ??
      parseCurrentGradeFromText(row.currentGradeLabel || row.rankLabel)

    const base: ExcelPreviewRow = {
      ...row,
      currentGrade: currentGrade ?? null,
      maternalSurname: row.maternalSurname ?? '',
    }

    if (currentGrade != null) {
      return applyGradeToPreviewRow(base, currentGrade)
    }

    return base
  })

  return revalidatePreviewRows(normalized)
}

export function applyGradeToPreviewRow(row: ExcelPreviewRow, currentGrade: number): ExcelPreviewRow {
  const applied = applyCurrentGradeSelection(currentGrade)
  if (!applied) {
    return {
      ...row,
      currentGrade,
      valid: false,
      error: 'Grado sin postulación válida',
    }
  }

  return {
    ...row,
    currentGrade,
    currentGradeLabel: CURRENT_GRADE_SELECT_OPTIONS.find((g) => g.value === currentGrade)?.label ?? row.currentGradeLabel,
    rankLabel: applied.rank,
    promotionGrade: applied.promotionGrade,
    trackType: applied.trackType,
    postulationGradeLabel: promotionGradeLabel(applied.promotionGrade),
    trackLabel: trackLabel(applied.trackType),
    ...(() => {
      const c = studentClassificationFromPostulationGrade(applied.promotionGrade)
      return { hierarchyLabel: c?.hierarchyLabel ?? '', categoryLabel: c?.categoryLabel ?? '' }
    })(),
  }
}

export function updatePreviewRowField(
  rows: ExcelPreviewRow[],
  rowNumber: number,
  field: keyof ExcelPreviewRow,
  value: string | number
): ExcelPreviewRow[] {
  const updated = rows.map((row) => {
    if (row.rowNumber !== rowNumber) return row

    let next: ExcelPreviewRow = { ...row }

    if (field === 'firstName' || field === 'paternalSurname' || field === 'maternalSurname') {
      const firstName = field === 'firstName' ? String(value) : row.firstName
      const paternalSurname = field === 'paternalSurname' ? String(value) : row.paternalSurname
      const maternalSurname = field === 'maternalSurname' ? String(value) : row.maternalSurname ?? ''
      const loginUsername =
        generateStudentLoginUsernameFromParts(firstName, paternalSurname) ?? row.loginUsername
      next = {
        ...next,
        firstName,
        paternalSurname,
        maternalSurname,
        loginUsername,
        fullName: buildStudentFullName(firstName, paternalSurname, maternalSurname),
      }
    } else if (field === 'dni') {
      next.dni = String(value).replace(/\D/g, '').slice(0, 8)
    } else if (field === 'loginUsername') {
      next.loginUsername = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
    } else if (field === 'planDays') {
      next.planDays = Number(value)
    } else if (field === 'currentGrade') {
      return applyGradeToPreviewRow(next, Number(value))
    } else {
      next = { ...next, [field]: value } as ExcelPreviewRow
    }

    return next
  })

  return revalidatePreviewRows(updated)
}

export async function validateExcelUploadFile(file: File): Promise<string | null> {
  const name = file.name.toLowerCase()
  if (!name.endsWith('.xlsx')) {
    if (name.endsWith('.xls')) {
      return 'El formato .xls (Excel antiguo) no es compatible. Abra el archivo en Excel y guárdelo como .xlsx, o descargue la plantilla de este panel.'
    }
    if (name.endsWith('.csv')) {
      return 'No se admiten archivos CSV. Descargue la plantilla Excel (.xlsx) desde este panel.'
    }
    return 'Solo se admiten archivos .xlsx. Descargue la plantilla oficial desde este panel.'
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  const isZipXlsx = header.length >= 2 && header[0] === 0x50 && header[1] === 0x4b
  if (!isZipXlsx) {
    return 'El archivo no es un Excel .xlsx válido. Descargue la plantilla oficial, complétela y vuelva a subirla.'
  }

  return null
}

export function buildExcelConfirmRow(row: ExcelPreviewRow) {
  if (row.currentGrade == null) {
    throw new Error(`Fila ${row.rowNumber}: grado actual requerido`)
  }
  const applied = applyCurrentGradeSelection(row.currentGrade)
  if (!applied) {
    throw new Error(`Fila ${row.rowNumber}: grado sin postulación válida`)
  }

  return {
    rowNumber: row.rowNumber,
    firstName: row.firstName.trim(),
    paternalSurname: row.paternalSurname.trim(),
    maternalSurname: row.maternalSurname?.trim() || null,
    dni: row.dni.trim(),
    fullName: buildStudentFullName(row.firstName, row.paternalSurname, row.maternalSurname ?? ''),
    loginUsername: row.loginUsername.trim().toUpperCase(),
    rankLabel: applied.rank,
    planDays: row.planDays,
    promotionGrade: applied.promotionGrade,
    currentPromotionGrade: applied.currentGrade,
    trackType: applied.trackType,
  }
}

export function applyBackendImportErrors(rows: ExcelPreviewRow[], errors: string[]): ExcelPreviewRow[] {
  if (errors.length === 0) return rows

  return rows.map((row) => {
    const match = errors.find((e) => e.startsWith(`Fila ${row.rowNumber}:`))
    if (!match) return row
    return {
      ...row,
      valid: false,
      error: match.replace(`Fila ${row.rowNumber}: `, '').trim(),
    }
  })
}

export function revalidatePreviewRows(rows: ExcelPreviewRow[]): ExcelPreviewRow[] {
  return rows.map((row) => revalidatePreviewRow(row, rows))
}

function revalidatePreviewRow(row: ExcelPreviewRow, allRows: ExcelPreviewRow[]): ExcelPreviewRow {
  if (!row.firstName.trim() || !row.paternalSurname.trim()) {
    return { ...row, valid: false, error: 'Nombres y apellido paterno requeridos' }
  }

  if (row.dni.length !== 8 || !/^\d+$/.test(row.dni)) {
    return { ...row, valid: false, error: 'DNI debe tener 8 dígitos (será la contraseña)' }
  }

  if (!row.loginUsername.trim()) {
    return { ...row, valid: false, error: 'Usuario de acceso requerido' }
  }

  if (row.currentGrade == null) {
    return { ...row, valid: false, error: 'Seleccione el grado actual' }
  }

  const applied = applyCurrentGradeSelection(row.currentGrade)
  if (!applied) {
    return { ...row, valid: false, error: 'Grado sin postulación válida' }
  }

  if (!SUBSCRIPTION_PLANS.some((p) => p.days === row.planDays)) {
    return { ...row, valid: false, error: 'Plan debe ser 30, 60 o 180 días' }
  }

  const dniDup = allRows.filter((r) => r.dni === row.dni && r.rowNumber !== row.rowNumber)
  if (dniDup.length > 0) {
    return { ...row, valid: false, error: `DNI duplicado en fila ${dniDup[0].rowNumber}` }
  }

  const userDup = allRows.filter(
    (r) => r.loginUsername.toUpperCase() === row.loginUsername.toUpperCase() && r.rowNumber !== row.rowNumber
  )
  if (userDup.length > 0) {
    return { ...row, valid: false, error: `Usuario duplicado en fila ${userDup[0].rowNumber}` }
  }

  if (row.promotionGrade !== applied.promotionGrade || row.trackType !== applied.trackType) {
    return applyGradeToPreviewRow(row, row.currentGrade)
  }

  return {
    ...row,
    fullName: buildStudentFullName(row.firstName, row.paternalSurname, row.maternalSurname ?? ''),
    rankLabel: applied.rank,
    promotionGrade: applied.promotionGrade,
    trackType: applied.trackType,
    postulationGradeLabel: promotionGradeLabel(applied.promotionGrade),
    trackLabel: trackLabel(applied.trackType),
    ...(() => {
      const c = studentClassificationFromPostulationGrade(applied.promotionGrade)
      return { hierarchyLabel: c?.hierarchyLabel ?? '', categoryLabel: c?.categoryLabel ?? '' }
    })(),
    valid: true,
    error: null,
  }
}
