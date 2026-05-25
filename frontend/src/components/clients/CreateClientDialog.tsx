import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateClient } from '@/hooks/api/useClients'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6, 'Numéro trop court').max(20),
  email: z.string().email().optional().or(z.literal('')),
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(3),
})

type FormValues = z.infer<typeof schema>

export type CreateClientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (client: { id: string; name: string }) => void
}

export function CreateClientDialog({ open, onOpenChange, onCreated }: CreateClientDialogProps) {
  const { t } = useTranslation(['clients', 'common'])
  const createMut = useCreateClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', street: '', city: '', postalCode: '' },
  })

  useEffect(() => {
    if (!open) {
      form.reset({ name: '', phone: '', email: '', street: '', city: '', postalCode: '' })
    }
  }, [open, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await createMut.mutateAsync({
        name: values.name,
        phone: values.phone,
        email: values.email?.trim() ? values.email.trim() : undefined,
        address: { street: values.street, city: values.city, postalCode: values.postalCode },
      })
      const id = String(
        (result as Record<string, unknown>).id ?? (result as Record<string, unknown>)._id ?? '',
      )
      toast.success(t('clients:clientCreated', { name: values.name, defaultValue: `Client ${values.name} créé` }))
      onCreated({ id, name: values.name })
      form.reset()
      onOpenChange(false)
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('clients:createError', { defaultValue: 'Création impossible' })
      toast.error(msg)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('z-[70] max-w-md')}>
        <DialogHeader>
          <DialogTitle>{t('clients:addClientTitle')}</DialogTitle>
          <DialogDescription>
            {t('clients:createClientDescription', { defaultValue: 'Créer un nouveau client' })}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <Label htmlFor="create-client-name">{t('clients:name')}</Label>
            <Input id="create-client-name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="mt-0.5 text-xs text-clay-red">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-client-phone">{t('clients:phone')}</Label>
            <Input id="create-client-phone" placeholder="0612345678" {...form.register('phone')} />
            {form.formState.errors.phone ? (
              <p className="mt-0.5 text-xs text-clay-red">{form.formState.errors.phone.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-client-email">{t('clients:email')}</Label>
            <Input id="create-client-email" type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-xs text-clay-red">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-client-street">{t('clients:street')}</Label>
            <Input id="create-client-street" {...form.register('street')} />
            {form.formState.errors.street ? (
              <p className="mt-0.5 text-xs text-clay-red">{form.formState.errors.street.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="create-client-city">{t('clients:city')}</Label>
              <Input id="create-client-city" {...form.register('city')} />
              {form.formState.errors.city ? (
                <p className="mt-0.5 text-xs text-clay-red">{form.formState.errors.city.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-client-postal">{t('clients:postalCode')}</Label>
              <Input id="create-client-postal" {...form.register('postalCode')} />
              {form.formState.errors.postalCode ? (
                <p className="mt-0.5 text-xs text-clay-red">{form.formState.errors.postalCode.message}</p>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t('common:cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
