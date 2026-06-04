import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  isDuplicateServiceError,
  useCreateService,
  useUpdateService,
  type ApiService,
  type ServiceCategory,
} from '@/hooks/api/useServices'
import { cn } from '@/lib/utils'

const categories: ServiceCategory[] = [
  'lavage',
  'vidange',
  'freinage',
  'diagnostic',
  'pneumatique',
  'carrosserie',
  'electricite',
  'climatisation',
  'autre',
]

const schema = z.object({
  name: z.string().min(1),
  category: z.enum([
    'lavage',
    'vidange',
    'freinage',
    'diagnostic',
    'pneumatique',
    'carrosserie',
    'electricite',
    'climatisation',
    'autre',
  ]),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  duration: z.coerce.number().int().min(15),
  isCustom: z.boolean(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const selectClass = cn(
  'flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm text-ink-primary',
)

type ServiceFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: ApiService | null
}

export function ServiceFormModal({ open, onOpenChange, service }: ServiceFormModalProps) {
  const { t } = useTranslation(['services', 'common'])
  const createMut = useCreateService()
  const updateMut = useUpdateService()
  const isEdit = Boolean(service?.id)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'autre',
      isCustom: false,
      isActive: true,
      duration: 30,
      price: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    if (service) {
      form.reset({
        name: service.name,
        category: service.category ?? 'autre',
        description: service.description ?? '',
        price: service.price ?? 0,
        duration: service.duration ?? 30,
        isCustom: service.isCustom ?? false,
        isActive: service.isActive !== false,
      })
    } else {
      form.reset({
        name: '',
        category: 'autre',
        description: '',
        price: 0,
        duration: 30,
        isCustom: false,
        isActive: true,
      })
    }
  }, [open, service, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && service) {
        await updateMut.mutateAsync({
          id: service.id,
          body: {
            name: values.name,
            category: values.category,
            description: values.description || undefined,
            price: values.price,
            duration: values.duration,
            isCustom: values.isCustom,
            isActive: values.isActive,
          },
        })
        toast.success(t('services:editSuccess'))
      } else {
        await createMut.mutateAsync({
          name: values.name,
          category: values.category,
          description: values.description || undefined,
          price: values.price,
          duration: values.duration,
          isCustom: values.isCustom,
          isActive: values.isActive,
        })
        toast.success(t('services:createSuccess'))
      }
      onOpenChange(false)
    } catch (err) {
      if (isDuplicateServiceError(err)) {
        toast.error(t('services:duplicateName'))
        return
      }
      toast.error(t('services:saveError'))
    }
  })

  const pending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('services:editTitle') : t('services:addTitle')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="svc-name">{t('services:name')}</Label>
            <Input id="svc-name" {...form.register('name')} />
          </div>
          <div>
            <Label htmlFor="svc-cat">{t('services:category')}</Label>
            <select id="svc-cat" className={selectClass} {...form.register('category')}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {t(`services:categories.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="svc-desc">{t('services:description')}</Label>
            <Textarea id="svc-desc" rows={3} {...form.register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="svc-price">{t('services:price')}</Label>
              <Input id="svc-price" type="number" step="0.001" placeholder="0.000" {...form.register('price')} />
            </div>
            <div>
              <Label htmlFor="svc-duration">{t('services:duration')}</Label>
              <Input id="svc-duration" type="number" {...form.register('duration')} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input type="checkbox" {...form.register('isCustom')} />
            {t('services:isCustom')}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input type="checkbox" {...form.register('isActive')} />
            {t('services:isActive')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
