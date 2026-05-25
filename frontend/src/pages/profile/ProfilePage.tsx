import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiBaseUrl } from '@/config/env'
import { cn } from '@/lib/utils'
import api from '@/utils/api'
import { useAuthStore } from '@/store/auth'

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z
      .string()
      .min(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'passwordRules'),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

function avatarUrl(avatar?: string): string | null {
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar
  const base = getApiBaseUrl().replace(/\/api\/v1$/, '')
  return `${base}/uploads/${avatar.replace(/^\/+/, '')}`
}

export function ProfilePage(): React.ReactElement {
  const { t } = useTranslation(['profile', 'common'])
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!user) return
    profileForm.reset({ name: user.name, email: user.email })
  }, [user, profileForm])

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const onProfileSubmit = profileForm.handleSubmit(async (values) => {
    try {
      const { data } = await api.put<{ data: { user: Record<string, unknown> } }>('/auth/me', {
        name: values.name,
      })
      const u = data.data.user
      if (user) {
        setUser({
          ...user,
          name: String(u.name ?? values.name),
          email: String(u.email ?? user.email),
          avatar: typeof u.avatar === 'string' ? u.avatar : user.avatar,
        })
      }
      toast.success(t('profile:saved'))
    } catch {
      toast.error(t('profile:saveError'))
    }
  })

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      passwordForm.reset()
      toast.success(t('profile:passwordUpdated'))
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('profile:passwordError')
      toast.error(msg)
    }
  })

  const onAvatarChange = async (file: File | undefined) => {
    if (!file || !user?.id) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post<{ data: { avatar: string } }>(`/users/${user.id}/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUser({ ...user, avatar: data.data.avatar })
      toast.success(t('profile:avatarUpdated'))
    } catch {
      toast.error(t('profile:avatarError'))
    } finally {
      setAvatarUploading(false)
    }
  }

  const imgSrc = avatarUrl(user?.avatar)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-fluid-h1 font-semibold text-ink-primary">{t('profile:title')}</h1>
        <p className="mt-1 text-sm text-ink-secondary">{t('profile:subtitle')}</p>
      </div>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">{t('profile:sectionInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onProfileSubmit}>
            <div>
              <Label>{t('profile:name')}</Label>
              <Input {...profileForm.register('name')} />
            </div>
            <div>
              <Label>{t('profile:email')}</Label>
              <Input {...profileForm.register('email')} readOnly className="opacity-70" />
              <p className="mt-1 text-xs text-ink-muted">{t('profile:emailReadonly')}</p>
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {t('common:save')}
            </Button>
          </form>
        </CardContent>
      </ClayCard>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">{t('profile:sectionAvatar')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div
            className={cn(
              'flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full',
              'bg-clay-primary/15 text-xl font-bold text-clay-primary',
            )}
          >
            {imgSrc ? (
              <img src={imgSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              initials ?? <User className="h-10 w-10" />
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onAvatarChange(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={avatarUploading}
              onClick={() => fileRef.current?.click()}
            >
              {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('profile:changeAvatar')}
            </Button>
          </div>
        </CardContent>
      </ClayCard>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">{t('profile:sectionPassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onPasswordSubmit}>
            <div>
              <Label>{t('profile:currentPassword')}</Label>
              <Input type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} />
            </div>
            <div>
              <Label>{t('profile:newPassword')}</Label>
              <Input type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} />
            </div>
            <div>
              <Label>{t('profile:confirmPassword')}</Label>
              <Input type="password" autoComplete="new-password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword ? (
                <p className="mt-1 text-xs text-clay-red">
                  {t('profile:passwordMismatch')}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {t('profile:updatePassword')}
            </Button>
          </form>
        </CardContent>
      </ClayCard>
    </div>
  )
}
