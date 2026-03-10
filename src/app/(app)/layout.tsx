import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            <Sidebar />
            <main className="flex-1 min-w-0 flex flex-col max-h-screen overflow-y-auto">
                <div className="flex-1 p-8 2xl:p-12 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
