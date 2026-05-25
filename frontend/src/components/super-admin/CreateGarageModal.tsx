import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isDuplicateGarageError, useCreateGarage } from '@/hooks/api/useSuperAdmin'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  address: z.string().optional(),
  subscriptionTier: z.enum(['trial', 'basic', 'pro', 'enterprise']),
})

type FormValues = z.infer<typeof schema>

const selectClass = cn(
  'flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm text-ink-primary',
)

type CreateGarageModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGarageModal({ open, onOpenChange }: CreateGarageModalProps) {
  const { t } = useTranslation(['superAdmin', 'common'])
  const createMut = useCreateGarage()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      subscriptionTier: 'trial',
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        email: '',
        phone: '',
        city: '',
        address: '',
        subscriptionTier: 'trial',
      })
    }
  }, [open, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMut.mutateAsync(values)
      toast.success(t('superAdmin:createGarageSuccess'))
      onOpenChange(false)
    } catch (err) {
      if (isDuplicateGarageError(err)) {
        toast.error(t('superAdmin:createGarageDuplicate'))
        return
      }
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('superAdmin:createGarageError')
      toast.error(msg)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-clay',
          '[&>button:last-child]:hidden',
        )}
      >
        <DialogClose
          className={cn(
            'absolute end-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full',
            'text-ink-muted transition-colors hover:bg-[var(--bg-sidebar)] hover:text-ink-primary',
          )}
          aria-label={t('common:close')}
        >
          <X className="h-4 w-4" />
        </DialogClose>

        <DialogHeader className="pe-10 text-start">
          <DialogTitle>{t('superAdmin:createGarageTitle')}</DialogTitle>
        </DialogHeader>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="garage-name">{t('superAdmin:garageName')}</Label>
            <Input id="garage-name" {...form.register('name')} />
          </div>
          <div>
            <Label htmlFor="garage-email">{t('superAdmin:garageEmail')}</Label>
            <Input id="garage-email" type="email" {...form.register('email')} />
          </div>
          <div>
            <Label htmlFor="garage-phone">{t('superAdmin:garagePhone')}</Label>
            <Input id="garage-phone" {...form.register('phone')} />
          </div>
          <div>
            <Label htmlFor="garage-city">{t('superAdmin:garageCity')}</Label>
            <Input id="garage-city" {...form.register('city')} />
          </div>
          <div>
            <Label htmlFor="garage-address">{t('superAdmin:garageAddress')}</Label>
            <Input id="garage-address" {...form.register('address')} />
          </div>
          <div>
            <Label htmlFor="garage-tier">{t('superAdmin:garageTier')}</Label>
            <select id="garage-tier" className={selectClass} {...form.register('subscriptionTier')}>
              <option value="trial">{t('superAdmin:tiers.trial')}</option>
              <option value="basic">{t('superAdmin:tiers.basic')}</option>
              <option value="pro">{t('superAdmin:tiers.pro')}</option>
              <option value="enterprise">{t('superAdmin:tiers.enterprise')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
