import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { OrgSidebar } from '@/components/org-sidebar'

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <OrgSidebar userDisplay={displayName} userEmail={user.email ?? ''} />
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  )
}
