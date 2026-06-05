'use client'

import { getPasswordChecks } from '@/lib/utils/passwordPolicy'
import { NEON, DANGER } from '@/lib/constants/theme'

export function PasswordPolicyHint({ password }: { password: string }) {
  const checks = getPasswordChecks(password)

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {checks.map((check) => (
        <span
          key={check.label}
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: check.ok ? `${NEON}20` : `${DANGER}15`,
            color: check.ok ? NEON : '#ff8a8a',
            border: `1px solid ${check.ok ? NEON + '40' : DANGER + '30'}`,
          }}
        >
          {check.ok ? '✓' : '○'} {check.label}
        </span>
      ))}
    </div>
  )
}
