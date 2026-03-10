'use client'

import { createBrowserClient } from '@supabase/ssr'
import { LogOut, LayoutDashboard, Calendar, ClipboardList, Settings, Users, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type Profile = {
    nome: string
    perfil: 'guardiao' | 'coordenador'
    setor: 'copy' | 'mentor' | 'ambos'
}

export function Sidebar() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const pathname = usePathname()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                setProfile(data)
            }
        }
        loadProfile()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    if (!profile) return <div className="w-64 bg-neutral-900 border-r border-neutral-800 animate-pulse" />

    const isCoordenador = profile.perfil === 'coordenador'

    const navItems = isCoordenador
        ? [
            { href: '/coordenador/dashboard', icon: LayoutDashboard, label: 'Dashboard Geral' },
            { href: '/coordenador/analise', icon: Users, label: 'Análise por Guardião' },
            { href: '/coordenador/configuracoes', icon: Settings, label: 'Configurações' },
        ]
        : [
            { href: '/guardiao/agenda', icon: Calendar, label: 'Agenda Semanal' },
            { href: '/guardiao/ocorrencias', icon: AlertCircle, label: 'Ocorrências' },
            { href: '/guardiao/dashboard', icon: LayoutDashboard, label: 'Meu Dashboard' },
        ]

    return (
        <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col min-h-screen sticky top-0">
            <div className="p-6">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-amber-500" />
                    <span className="truncate">Eficiência</span>
                </h2>
            </div>

            <div className="px-6 pb-6">
                <div className="bg-neutral-950 rounded-lg p-3 border border-neutral-800">
                    <p className="text-sm font-medium text-neutral-200 truncate">{profile.nome}</p>
                    <p className="text-xs text-neutral-500 capitalize">{profile.perfil} • {profile.setor}</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const active = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-neutral-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
