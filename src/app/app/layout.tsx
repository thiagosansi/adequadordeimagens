import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { OrgSidebar } from '@/components/org-sidebar'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const db = createServiceClient()
  const { data: profile } = await db
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const displayName = profile?.full_name ?? user.email ?? ''

  return (
    <AppShell sidebar={<OrgSidebar userDisplay={displayName} userEmail={user.email ?? ''} />}>
      {children}
    </AppShell>
  )
}
