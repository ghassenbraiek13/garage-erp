import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  vehicle: z.string().min(1),
  service: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
})

export function PortalBookPage() {
  const [step, setStep] = useState(0)
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Prendre rendez-vous</h1>
      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Étape {step + 1} / 4</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {step === 0 ? (
            <div>
              <Label>Véhicule</Label>
              <Input {...form.register('vehicle')} placeholder="Peugeot 308" />
            </div>
          ) : null}
          {step === 1 ? (
            <div>
              <Label>Service</Label>
              <Input {...form.register('service')} placeholder="Révision" />
            </div>
          ) : null}
          {step === 2 ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date</Label>
                <Input type="date" {...form.register('date')} />
              </div>
              <div>
                <Label>Heure</Label>
                <Input type="time" {...form.register('time')} />
              </div>
            </div>
          ) : null}
          {step === 3 ? <p className="text-sm text-ink-secondary">Confirmation (démo)</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Retour
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (step < 3) setStep((s) => s + 1)
              }}
            >
              Suivant
            </Button>
          </div>
        </CardContent>
      </ClayCard>
    </div>
  )
}
