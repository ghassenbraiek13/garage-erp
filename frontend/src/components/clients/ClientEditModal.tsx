import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ApiClient } from '@/hooks/api/useClients'
import { useUpdateClient } from '@/hooks/api/useClients'
import { cn } from '@/lib/utils'

const schema = z.object({
  nom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().min(1),
  adresse: z
    .object({
      rue: z.string().optional(),
      ville: z.string().optional(),
      codePostal: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type ClientEditModalProps = {
  client: ApiClient | null
  open: boolean
  onClose: () => void
  onSaved?: (client: ApiClient) => void
}

export function ClientEditModal({ client, open, onClose, onSaved }: ClientEditModalProps) {
  const { t } = useTranslation(['clients', 'common'])
  const updateMut = useUpdateClient()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!client || !open) return
    form.reset({
      nom: client.name,
      email: client.email ?? '',
      telephone: client.phone,
      adresse: {
        rue: client.address?.street ?? '',
        ville: client.address?.city ?? '',
        codePostal: client.address?.postalCode ?? '',
      },
      notes: client.notes ?? '',
    })
  }, [client, open, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!client) return
    try {
      const updated = await updateMut.mutateAsync({
        id: client.id,
        body: {
          name: values.nom,
          email: values.email,
          phone: values.telephone,
          address: {
            street: values.adresse?.rue || undefined,
            city: values.adresse?.ville || undefined,
            postalCode: values.adresse?.codePostal || undefined,
          },
          notes: values.notes || undefined,
        },
      })
      toast.success(t('clients:editSuccess'))
      onSaved?.(updated)
      onClose()
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('clients:editError')
      toast.error(msg)
    }
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)]',
          'bg-[var(--bg-surface)] p-6 shadow-clay',
          'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:max-h-[92vh]',
          'max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl',
          '[&>button:last-child]:hidden',
        )}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
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
            <DialogTitle>{t('clients:editTitle')}</DialogTitle>
          </DialogHeader>

          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <div>
              <Label>{t('clients:name')}</Label>
              <Input {...form.register('nom')} />
            </div>
            <div>
              <Label>{t('clients:email')}</Label>
              <Input type="email" {...form.register('email')} />
            </div>
            <div>
              <Label>{t('clients:phone')}</Label>
              <Input {...form.register('telephone')} />
            </div>
            <div>
              <Label>{t('clients:street')}</Label>
              <Input {...form.register('adresse.rue')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('clients:city')}</Label>
                <Input {...form.register('adresse.ville')} />
              </div>
              <div>
                <Label>{t('clients:postalCode')}</Label>
                <Input {...form.register('adresse.codePostal')} />
              </div>
            </div>
            <div>
              <Label>{t('clients:notes')}</Label>
              <Textarea rows={3} {...form.register('notes')} />
            </div>
            <Button className="w-full" type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common:save')}
            </Button>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
