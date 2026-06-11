'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input } from '@/components/ui'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(1, 'Ingresa la nueva contraseña'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .superRefine((data, ctx) => {
    const pwdError = validatePassword(data.newPassword)
    if (pwdError) {
      ctx.addIssue({ code: 'custom', message: pwdError, path: ['newPassword'] })
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
      })
    }
    if (data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'La nueva contraseña debe ser distinta a la actual',
        path: ['newPassword'],
      })
    }
  })

export type AdminPasswordFormValues = z.infer<typeof schema>

interface AdminPasswordFormProps {
  loading: boolean
  onSubmit: (values: AdminPasswordFormValues) => Promise<void>
}

export function AdminPasswordForm({ loading, onSubmit }: AdminPasswordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AdminPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = useWatch({ control, name: 'newPassword' })

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
    reset()
  })

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      <Input
        label="Contraseña actual"
        type="password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="Nueva contraseña"
        type="password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordPolicyHint password={newPassword ?? ''} />
      <Input
        label="Confirmar contraseña"
        type="password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" variant="outline" size="md" fullWidth loading={loading}>
        Cambiar contraseña
      </Button>
    </form>
  )
}
