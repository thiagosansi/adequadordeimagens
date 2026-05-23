import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgSidebar } from '@/components/org-sidebar'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { orgId } = await params

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <OrgSidebar orgId={orgId} />
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  )
}
