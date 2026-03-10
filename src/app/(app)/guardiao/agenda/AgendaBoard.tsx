'use client'

import { useState } from 'react'
import { format, parseISO, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Clock, AlertCircle, X } from 'lucide-react'
import { submitTaskReport } from './actions'

type AgendaBoardProps = {
    tasks: any[]
}

const DIAS_SEMANA = [
    { index: 1, label: 'Segunda', dateLabel: '' },
    { index: 2, label: 'Terça', dateLabel: '' },
    { index: 3, label: 'Quarta', dateLabel: '' },
    { index: 4, label: 'Quinta', dateLabel: '' },
    { index: 5, label: 'Sexta', dateLabel: '' },
]

export default function AgendaBoard({ tasks }: AgendaBoardProps) {
    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Agrupar tarefas por dia (1 a 5)
    const grouped = tasks.reduce((acc, t) => {
        // A data vem como "2025-03-03". Usar parseISO e buscar o dia da semana na timezone local
        const date = parseISO(t.data_referencia)
        const dayIdx = getDay(date) // 0-6 (Sun-Sat)

        // Ignorar fds se houver (mas n deve ter pela geracao)
        if (dayIdx >= 1 && dayIdx <= 5) {
            if (!acc[dayIdx]) acc[dayIdx] = []
            acc[dayIdx].push(t)
        }
        return acc
    }, {} as Record<number, any[]>)

    // Pegar os dias para o header
    const daysInfo = DIAS_SEMANA.map(d => {
        const ts = tasks.find(t => getDay(parseISO(t.data_referencia)) === d.index)
        return {
            ...d,
            dateStr: ts ? format(parseISO(ts.data_referencia), "dd/MM", { locale: ptBR }) : ''
        }
    })

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const formData = new FormData(e.currentTarget)
            formData.append('instanceId', selectedTask.id)
            await submitTaskReport(formData)
            // Refresh page so server component refetches
            window.location.reload()
        } catch (err) {
            alert("Erro ao enviar! " + (err as Error).message)
            setIsSubmitting(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'concluida': return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
            case 'atrasada': return 'border-red-500/30 bg-red-500/5 text-red-500'
            case 'pendente': return 'border-amber-500/30 bg-neutral-800 text-neutral-300 hover:border-amber-500/50 hover:bg-neutral-800/80 cursor-pointer transition-colors shadow-none'
            default: return 'border-neutral-800 bg-neutral-900 text-neutral-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'concluida': return <CheckCircle2 className="w-4 h-4" />
            case 'atrasada': return <AlertCircle className="w-4 h-4" />
            case 'pendente': return <Clock className="w-4 h-4" />
            default: return null
        }
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {daysInfo.map((day) => {
                    const dayTasks = grouped[day.index] || []

                    return (
                        <div key={day.index} className="flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between px-2 pb-4 mb-2 border-b border-neutral-800">
                                <span className="font-semibold text-neutral-200">{day.label}</span>
                                {day.dateStr && <span className="text-xs text-neutral-500 font-medium">{day.dateStr}</span>}
                            </div>

                            <div className="space-y-3 flex-1">
                                {dayTasks.length === 0 ? (
                                    <div className="text-sm text-neutral-600 text-center py-6 italic">Livre</div>
                                ) : (
                                    dayTasks.map((t: any) => (
                                        <div
                                            key={t.id}
                                            onClick={() => {
                                                if (t.status === 'pendente' || t.status === 'atrasada') setSelectedTask(t)
                                            }}
                                            className={`p-4 rounded-xl border flex flex-col gap-3 group ${getStatusStyle(t.status)}`}
                                        >
                                            <h4 className="text-sm font-medium leading-tight group-hover:text-amber-400 transition-colors">
                                                {t.task_templates?.nome}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-xs font-medium opacity-80 mt-auto">
                                                {getStatusIcon(t.status)}
                                                <span className="capitalize">{t.status}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal de Conclusão */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
                            <h3 className="text-lg font-semibold text-white">Concluir Tarefa</h3>
                            <button onClick={() => setSelectedTask(null)} className="text-neutral-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-base text-neutral-200">{selectedTask.task_templates?.nome}</h4>
                                <p className="text-sm text-neutral-500">
                                    Data de Referência: {format(parseISO(selectedTask.data_referencia), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                            </div>

                            {selectedTask.task_templates?.task_template_kpis?.length > 0 && (
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Métricas KPI</h5>
                                    {selectedTask.task_templates.task_template_kpis.flatMap((ttk: any) =>
                                        ttk.task_fields.map((field: any) => (
                                            <div key={field.id}>
                                                <label className="block text-sm font-medium mb-1.5 text-neutral-300">
                                                    {field.nome}
                                                    <span className="text-neutral-500 ml-1">({ttk.kpis?.nome})</span>
                                                    {field.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                                <input
                                                    type="number"
                                                    step={field.tipo === 'decimal' ? "0.01" : "1"}
                                                    name={`field_${field.id}`}
                                                    required={field.obrigatorio}
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                <h5 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Descrição Operacional</h5>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-neutral-300">
                                        Relato de Conclusão <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="descricao"
                                        required
                                        rows={4}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors placeholder:text-neutral-600"
                                        placeholder="Descreva o que foi executado, os alertas ou observações..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTask(null)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Salvando...' : 'Concluir e Salvar'}
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
