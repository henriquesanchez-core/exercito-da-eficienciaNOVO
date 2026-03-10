import { getWeeklyAgenda } from './actions'
import AgendaBoard from './AgendaBoard'

export default async function AgendaPage() {
    const { tasks, stats } = await getWeeklyAgenda()

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Agenda Semanal</h1>
                    <p className="text-neutral-400">{stats.weekLabel}</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-3 flex flex-col items-center min-w-[120px]">
                        <span className="text-3xl font-bold text-amber-500">{stats.percentual}%</span>
                        <span className="text-xs uppercase font-medium tracking-wider text-neutral-500 mt-1">Concluídas</span>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-3 flex flex-col items-center min-w-[100px]">
                        <span className="text-2xl font-bold text-white">{stats.pendentes}</span>
                        <span className="text-xs uppercase font-medium tracking-wider text-neutral-500 mt-1">Pendentes</span>
                    </div>
                    <div className="bg-neutral-900 border border-red-900/30 rounded-xl px-5 py-3 flex flex-col items-center min-w-[100px]">
                        <span className="text-2xl font-bold text-red-500">{stats.atrasadas}</span>
                        <span className="text-xs uppercase font-medium tracking-wider text-red-500/70 mt-1">Atrasadas</span>
                    </div>
                </div>
            </header>

            <AgendaBoard tasks={tasks} />
        </div>
    )
}
