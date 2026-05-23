import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgSidebar } from '@/components/org-sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <OrgSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  )
}
