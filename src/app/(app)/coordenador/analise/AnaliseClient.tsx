'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Target, CheckCircle2, AlertCircle, Clock, FileText, AlertOctagon, Lightbulb, TrendingUp, TrendingDown, Users, Settings2, X } from 'lucide-react'
import { useState } from 'react'
import { adminUpdateOcorrencia } from './actions'

type Props = {
    options: any[]
    guardiaoId?: string
    data?: any
}

export default function AnaliseClient({ options, guardiaoId, data }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [selectedOcorrencia, setSelectedOcorrencia] = useState<any | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    // Atualizar query parameter ao selecionar Guardião
    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        const params = new URLSearchParams(searchParams.toString())
        if (val) {
            params.set('guardiaoId', val)
        } else {
            params.delete('guardiaoId')
        }
        router.push(`/coordenador/analise?${params.toString()}`)
    }

    // Submit modal ocorrência
    const handleUpdateOcorrencia = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            const formData = new FormData(e.currentTarget)
            const status = formData.get('status') as string
            const comentario = formData.get('comentario') as string
            await adminUpdateOcorrencia(selectedOcorrencia.id, status, comentario)
            setSelectedOcorrencia(null)
            window.location.reload()
        } catch (err: any) {
            alert("Erro ao atualizar: " + err.message)
        } finally {
            setIsUpdating(false)
        }
    }

    if (!guardiaoId) {
        return (
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Análise por Guardião</h1>
                        <p className="text-neutral-400">Selecione um Guardião para visualizar seus KPIs, tarefas e ocorrências detalhadas.</p>
                    </div>

                    <div className="w-full md:w-72">
                        <select
                            className="w-full bg-neutral-900 border border-neutral-800 text-sm rounded-lg px-4 py-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                            value=""
                            onChange={handleSelect}
                        >
                            <option value="" disabled>Selecione um Guardião...</option>
                            {options.map(g => (
                                <option key={g.id} value={g.id}>{g.nome} ({g.setor})</option>
                            ))}
                        </select>
                    </div>
                </header>
                <div className="text-center py-24 bg-neutral-900 border border-neutral-800 rounded-xl">
                    <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg">Selecione um Guardião acima para carregar o histórico.</p>
                </div>
            </div>
        )
    }

    // Renderizar a tela com os dados
    const { assertividade, tarefasSemanaAtual, kpis, ocorrencias } = data
    const guardiao = options.find(o => o.id === guardiaoId)

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-1">{label}</p>
                    <p className="text-amber-500 font-bold">{payload[0].value}% Aderência</p>
                    <p className="text-xs text-neutral-500 mt-1">{payload[0].payload.concluidas} concluídas de {payload[0].payload.total}</p>
                </div>
            )
        }
        return null
    }

    const KpiTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-1">{label}</p>
                    <p className="text-amber-500 font-bold">Valor: {payload[0].value}</p>
                </div>
            )
        }
        return null
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pendente': return <span className="px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded text-[10px] font-semibold uppercase tracking-wider">Pendente</span>
            case 'concluida': return <span className="px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-semibold uppercase tracking-wider">Concluída</span>
            case 'atrasada': return <span className="px-2 py-0.5 border border-red-500/30 bg-red-500/10 text-red-500 rounded text-[10px] font-semibold uppercase tracking-wider">Atrasada</span>
            default: return null
        }
    }

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Análise por Guardião</h1>
                    <p className="text-neutral-400 capitalize">{guardiao?.nome} • {guardiao?.setor} {guardiao?.squad ? `(${guardiao?.squad})` : ''}</p>
                </div>

                <div className="w-full md:w-72">
                    <select
                        className="w-full bg-neutral-900 border border-neutral-800 text-sm rounded-lg px-4 py-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                        value={guardiaoId}
                        onChange={handleSelect}
                    >
                        <option value="" disabled>Selecione um Guardião...</option>
                        {options.map(g => (
                            <option key={g.id} value={g.id}>{g.nome} ({g.setor})</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Bloco 1: Assertividade */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    Assertividade (Últimas 4 Semanas)
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="flex flex-col justify-center gap-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl text-center">
                            <p className="text-sm font-medium text-neutral-400 mb-2">Total</p>
                            <p className="text-4xl font-black text-white">{assertividade.totalGeral}</p>
                            <p className="text-xs text-neutral-500 mt-2 uppercase tracking-wideset font-bold">Tarefas</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-900 border border-emerald-500/30 bg-emerald-500/5 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-emerald-500">{assertividade.concluidasGeral}</p>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Concluídas</p>
                            </div>
                            <div className="bg-neutral-900 border border-red-500/30 bg-red-500/5 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-red-500">{assertividade.atrasadasGeral}</p>
                                <p className="text-[10px] text-red-500 font-bold uppercase mt-1">Atrasadas</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 p-6 rounded-xl h-64">
                        <h3 className="text-sm font-semibold text-neutral-300 mb-6 uppercase tracking-wider">Aderência Semanal (%)</h3>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={assertividade.grafico}>
                                <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                <RechartsTooltip cursor={{ fill: '#262626' }} content={<CustomTooltip />} />
                                <Bar dataKey="aderencia" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Bloco 2: Tarefas da semana */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    Tarefas (Semana Atual)
                </h2>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    {tarefasSemanaAtual.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-neutral-500">Nenhuma tarefa gerada para esta semana.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-800">
                            {tarefasSemanaAtual.map((t: any) => (
                                <div key={t.id} className="p-4 hover:bg-neutral-800/30 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-white">{t.task_templates?.nome}</span>
                                            {getStatusBadge(t.status)}
                                        </div>
                                        <span className="text-xs text-neutral-500 font-medium">
                                            Data Ref: {format(parseISO(t.data_referencia), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                    </div>

                                    {t.status === 'concluida' && (
                                        <button
                                            onClick={() => setSelectedTask(t)}
                                            className="text-xs font-semibold px-4 py-2 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Ver Relatório
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Bloco 3: KPIs */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    KPIs Individuais (Últimas 4 Semanas)
                </h2>

                {kpis.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-900 border border-neutral-800 rounded-xl">
                        <p className="text-neutral-500">Nenhum KPI alimentado por este Guardião.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kpis.map((kpi: any) => (
                            <div key={kpi.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between">
                                <div className="mb-4">
                                    <h3 className="font-semibold text-white text-base leading-tight mb-2">{kpi.nome}</h3>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black text-amber-500">{kpi.acumuladoAtual}</span>
                                        <span className="text-xs font-medium text-neutral-500 mb-1">{kpi.unidade}</span>
                                    </div>
                                </div>
                                <div className="h-20 w-full mt-auto -ml-2 -mb-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={kpi.historico}>
                                            <XAxis dataKey="name" hide />
                                            <YAxis hide domain={['auto', 'auto']} />
                                            <RechartsTooltip content={<KpiTooltip />} cursor={{ stroke: '#404040' }} />
                                            <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Bloco 4: Ocorrências */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <AlertOctagon className="w-5 h-5 text-amber-500" />
                    Ocorrências Abertas
                </h2>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    {ocorrencias.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-neutral-500">Nenhuma ocorrência em aberto para este Guardião.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-800">
                            {ocorrencias.map((o: any) => (
                                <div key={o.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-800/50 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {o.tipo === 'problema' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Lightbulb className="w-4 h-4 text-amber-500" />}
                                            <span className="font-bold text-white text-sm">{o.titulo}</span>
                                            <span className="px-2 py-0.5 rounded ml-2 bg-neutral-800 text-neutral-400 text-[10px] uppercase font-bold tracking-wider relative -top-0.5">Aberto</span>
                                        </div>
                                        <p className="text-xs text-neutral-500 max-w-xl truncate">{o.descricao}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOcorrencia(o)}
                                        className="text-xs font-semibold px-4 py-2 bg-amber-500 text-neutral-950 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap"
                                    >
                                        Tratar Ocorrência
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* MODAL TAREFA (VISUALIZAÇÃO) */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
                            <h3 className="text-lg font-semibold text-white">Relatório de Tarefa</h3>
                            <button onClick={() => setSelectedTask(null)} className="text-neutral-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-base text-neutral-200">{selectedTask.task_templates?.nome}</h4>
                                <p className="text-sm text-neutral-500">
                                    Data Referência: {format(parseISO(selectedTask.data_referencia), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                            </div>

                            {selectedTask.task_reports && selectedTask.task_reports.length > 0 && selectedTask.task_reports[0].task_field_values?.length > 0 && (
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Métricas KPI (Preenchidas)</h5>
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
                                        {selectedTask.task_reports[0].task_field_values.map((v: any, idx: number) => {
                                            const fieldName = selectedTask.task_templates?.task_template_kpis?.flatMap((k: any) => k.task_fields).find((f: any) => f.id === v.task_field_id)?.nome
                                            return (
                                                <div key={idx} className="p-3 flex items-center justify-between">
                                                    <span className="text-sm text-neutral-300">{fieldName || 'Campo'}</span>
                                                    <span className="text-sm font-bold text-white bg-neutral-800 px-3 py-1 rounded">{v.valor}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h5 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Descrição Operacional</h5>
                                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                                    <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                                        {selectedTask.task_reports && selectedTask.task_reports.length > 0 ? selectedTask.task_reports[0].descricao : 'Nenhuma descrição.'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <button onClick={() => setSelectedTask(null)} className="px-5 py-2.5 rounded-lg text-sm font-medium border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors w-full">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL OCORRÊNCIA (AÇÃO COORDENADOR) */}
            {selectedOcorrencia && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
                            <h3 className="text-lg font-semibold text-white">Tratar Ocorrência</h3>
                            <button onClick={() => setSelectedOcorrencia(null)} className="text-neutral-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateOcorrencia} className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                                <div className="flex items-start justify-between">
                                    <h4 className="text-sm font-bold text-white leading-tight">{selectedOcorrencia.titulo}</h4>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-400 px-2 py-1 rounded">{selectedOcorrencia.tipo}</span>
                                </div>
                                <p className="text-xs text-neutral-400 whitespace-pre-wrap">{selectedOcorrencia.descricao}</p>
                                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider pt-2 border-t border-neutral-800/50 mt-2">
                                    Impacto: {selectedOcorrencia.impacto}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-neutral-300">Novo Status</label>
                                <select name="status" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:ring-2 focus:ring-amber-500 focus:outline-none">
                                    <option value="em_analise">Em Análise</option>
                                    <option value="resolvido">Resolvido</option>
                                    <option value="descartado">Descartado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-neutral-300">Comentário / Resolução</label>
                                <textarea
                                    name="comentario"
                                    required
                                    rows={4}
                                    placeholder="Adicione um feedback que o Guardião poderá ler..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-neutral-600"
                                />
                            </div>

                            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedOcorrencia(null)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
                                >
                                    {isUpdating ? 'Salvando...' : 'Atualizar Ocorrência'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
