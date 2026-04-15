import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from 'react-i18next'

const schema = z.object({
  code: z.string().min(4),
})

export function PortalLoginPage() {
  const { t } = useTranslation('clientPortal')
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <ClayCard variant="elevated" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(() => navigate('/portal'))}
          >
            <div>
              <Label>{t('code')}</Label>
              <Input {...form.register('code')} placeholder="GF-CLIENT-001" />
            </div>
            <Button className="w-full" type="submit">
              Entrer
            </Button>
          </form>
        </CardContent>
      </ClayCard>
    </div>
  )
}
