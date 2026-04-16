import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { Badge } from '@/components/ui/badge'
import { useClientsList, useCreateClientPortal, useRemoveClientPortal } from '@/hooks/api/useClients'
import { useCreateGarageUser, useGarageUsers, usePatchUserActive, type ApiStaffUser } from '@/hooks/api/useUsers'
import { useAuthStore } from '@/store/auth'

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre'),
  role: z.enum(['mechanic', 'cashier', 'manager']),
})

const portalSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional(),
  sendEmail: z.boolean().optional(),
})

export function UsersTeamPage(): React.ReactElement {
  const { t } = useTranslation(['common', 'navigation'])
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === 'manager'

  const { data: users, isLoading, isError, error, refetch } = useGarageUsers()
  const { data: clientsData } = useClientsList(undefined, 1, 100)
  const createStaff = useCreateGarageUser()
  const patchActive = usePatchUserActive()
  const createPortal = useCreateClientPortal()
  const removePortal = useRemoveClientPortal()

  const [openStaff, setOpenStaff] = useState(false)
  const [portalClientId, setPortalClientId] = useState<string | null>(null)
  const [createdPw, setCreatedPw] = useState<string | null>(null)

  const staffList = useMemo(
    () => (users ?? []).filter((u) => u.role !== 'client'),
    [users],
  )
  const portalUsers = useMemo(() => (users ?? []).filter((u) => u.role === 'client'), [users])
  const portalClientIds = useMemo(
    () => new Set(portalUsers.map((u) => u.clientId).filter(Boolean) as string[]),
    [portalUsers],
  )

  const staffForm = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', email: '', password: '', role: 'mechanic' },
  })
  const pwWatch = staffForm.watch('password')

  const portalForm = useForm<z.infer<typeof portalSchema>>({
    resolver: zodResolver(portalSchema),
    defaultValues: { sendEmail: false },
  })
  const portalPw = portalForm.watch('password')

  if (!isManager) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
        Réservé aux gérants.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-fluid-h1 font-semibold text-[var(--text-primary)]">{t('navigation:team')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">Équipe atelier et accès portail clients</p>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="portal">Clients (portail)</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => setOpenStaff(true)}>
              Ajouter un employé
            </Button>
          </div>
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            onRetry={() => void refetch()}
            isEmpty={!isLoading && staffList.length === 0}
            loading={<TableSkeleton rows={4} />}
            empty={<p className="text-sm text-[var(--text-muted)]">Aucun membre</p>}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {staffList.map((m: ApiStaffUser) => (
                <ClayCard key={m.id} variant="elevated">
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-badge-blue)] text-sm font-bold text-[var(--text-badge-blue)]">
                        {m.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{m.name}</CardTitle>
                        <p className="text-xs text-[var(--text-muted)]">{m.email}</p>
                      </div>
                    </div>
                    <span className={`h-2 w-2 rounded-full ${m.isActive === false ? 'bg-[var(--accent-red)]' : 'bg-[var(--accent-green)]'}`} />
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="primary" className="capitalize">
                      {m.role}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={() =>
                          patchActive.mutate(
                            { id: m.id, isActive: !(m.isActive !== false) },
                            { onError: () => toast.error('Impossible') },
                          )
                        }
                      >
                        {m.isActive === false ? 'Activer' : 'Désactiver'}
                      </Button>
                    </div>
                    {m.lastLogin ? (
                      <p className="w-full text-xs text-[var(--text-muted)]">
                        Dernière connexion : {new Date(m.lastLogin).toLocaleString('fr-FR')}
                      </p>
                    ) : null}
                  </CardContent>
                </ClayCard>
              ))}
            </div>
          </QueryBoundary>
        </TabsContent>

        <TabsContent value="portal" className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Activez un compte portail pour un client existant (email requis). Un mot de passe temporaire est généré ou saisi.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(clientsData?.items ?? []).map((c) => {
              const hasPortal = portalClientIds.has(c.id)
              return (
                <ClayCard key={c.id} variant="elevated">
                  <CardHeader>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <p className="text-xs text-[var(--text-muted)]">{c.email ?? 'Sans email'}</p>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {hasPortal ? (
                      <>
                        <Badge variant="success">Portail actif</Badge>
                        <Button
                          size="sm"
                          variant="danger"
                          type="button"
                          onClick={() =>
                            removePortal.mutate(c.id, {
                              onSuccess: () => toast.success('Accès portail retiré'),
                              onError: () => toast.error('Échec'),
                            })
                          }
                        >
                          Désactiver portail
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="warning">Pas d&apos;accès</Badge>
                        <Button
                          size="sm"
                          type="button"
                          disabled={!c.email}
                          onClick={() => setPortalClientId(c.id)}
                        >
                          Activer portail
                        </Button>
                      </>
                    )}
                  </CardContent>
                </ClayCard>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={openStaff} onOpenChange={setOpenStaff}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel employé</DialogTitle>
            <DialogDescription>Mot de passe : min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={staffForm.handleSubmit(async (vals: z.infer<typeof staffSchema>) => {
              try {
                await createStaff.mutateAsync({
                  name: vals.name,
                  email: vals.email,
                  password: vals.password,
                  role: vals.role,
                })
                setCreatedPw(vals.password)
                toast.success('Employé créé')
                setOpenStaff(false)
                staffForm.reset()
              } catch {
                toast.error('Création impossible')
              }
            })}
          >
            <div>
              <Label>Nom</Label>
              <Input {...staffForm.register('name')} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...staffForm.register('email')} />
            </div>
            <div>
              <Label>Mot de passe temporaire</Label>
              <Input type="text" autoComplete="new-password" {...staffForm.register('password')} />
              <PasswordStrength password={pwWatch} />
            </div>
            <div>
              <Label>Rôle</Label>
              <select
                className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)]"
                {...staffForm.register('role')}
              >
                <option value="mechanic">Mécanicien</option>
                <option value="cashier">Caisse</option>
                <option value="manager">Gérant</option>
              </select>
            </div>
            <Button className="w-full" type="submit" disabled={createStaff.isPending}>
              {t('common:save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(portalClientId)} onOpenChange={() => setPortalClientId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activer le portail</DialogTitle>
            <DialogDescription>Laissez vide pour générer un mot de passe</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={portalForm.handleSubmit(async (vals) => {
              if (!portalClientId) return
              try {
                const res = await createPortal.mutateAsync({
                  clientId: portalClientId,
                  password: vals.password || undefined,
                  sendEmail: vals.sendEmail,
                })
                toast.success('Portail activé')
                setPortalClientId(null)
                portalForm.reset()
                setCreatedPw(res.tempPassword)
              } catch {
                toast.error('Activation impossible')
              }
            })}
          >
            <div>
              <Label>Mot de passe (optionnel)</Label>
              <Input type="text" {...portalForm.register('password')} />
              <PasswordStrength password={portalPw ?? ''} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" {...portalForm.register('sendEmail')} />
              Envoyer les accès par email
            </label>
            <Button className="w-full" type="submit">
              Confirmer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(createdPw)} onOpenChange={() => setCreatedPw(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mot de passe temporaire</DialogTitle>
            <DialogDescription>Copiez-le maintenant — il ne sera plus affiché.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input readOnly value={createdPw ?? ''} className="font-mono" />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(createdPw ?? '')
                toast.success('Copié')
              }}
            >
              Copier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
