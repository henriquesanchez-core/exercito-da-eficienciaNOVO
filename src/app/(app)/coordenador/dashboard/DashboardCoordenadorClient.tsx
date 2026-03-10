'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Target, TrendingUp, TrendingDown, Users, AlertCircle, FileText, Clock } from 'lucide-react'

export default function DashboardCoordenadorClient({ data }: { data: any }) {
    const { kpis, guardioes } = data
    const [filterSetor, setFilterSetor] = useState('todos')

    const filteredKpis = kpis.filter((k: any) => filterSetor === 'todos' || k.setor === filterSetor)

    // Guardiões nós podemos ou não aplicar o filtro de setor. Como o Coordenador vê KPIs por setor, faz sentido filtrar a equipe tbm.
    const filteredGuardioes = guardioes.filter((g: any) => filterSetor === 'todos' || g.setor === filterSetor || g.setor === 'ambos')

    const KpiTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-1">{label}</p>
                    <p className="text-amber-500 font-bold">Valor Consolidado: {payload[0].value}</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Visão Geral da Operação</h1>
                    <p className="text-neutral-400">Desempenho da semana atual e métricas consolidadas de todos os setores.</p>
                </div>

                <select
                    className="bg-neutral-900 border border-neutral-800 text-sm rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                    value={filterSetor}
                    onChange={(e) => setFilterSetor(e.target.value)}
                >
                    <option value="todos">Todos os Setores</option>
                    <option value="copy">Apenas Copy</option>
                    <option value="mentor">Apenas Mentor</option>
                </select>
            </header>

            {/* BLOCO 1 - KPIs Gerais */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    KPIs Consolidados (Semana Atual)
                </h2>

                {filteredKpis.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-900 border border-neutral-800 rounded-xl">
                        <p className="text-neutral-500">Nenhum KPI ativo encontrado para o filtro selecionado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredKpis.map((kpi: any) => {
                            const atingiuMeta = kpi.meta > 0 && kpi.acumuladoAtual >= kpi.meta
                            const subiu = kpi.variacao > 0
                            const descendo = kpi.variacao < 0
                            const neutro = kpi.variacao === 0

                            return (
                                <div key={kpi.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition-colors shadow-sm">

                                    <div className="mb-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-white text-base leading-tight pr-4">{kpi.nome}</h3>
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-neutral-800 text-neutral-400">{kpi.setor}</span>
                                        </div>

                                        <div className="flex items-end gap-3 mt-4">
                                            <span className="text-4xl font-black text-amber-500 tracking-tight">{kpi.acumuladoAtual}</span>
                                            <span className="text-sm font-medium text-neutral-500 mb-1">{kpi.unidade}</span>
                                        </div>

                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="text-xs font-medium text-neutral-400">Meta: {kpi.meta}</div>
                                            <div className={`flex items-center gap-1 text-xs font-bold ${subiu ? 'text-emerald-500' : descendo ? 'text-red-500' : 'text-neutral-500'}`}>
                                                {subiu ? <TrendingUp className="w-4 h-4" /> : descendo ? <TrendingDown className="w-4 h-4" /> : null}
                                                {Math.abs(kpi.variacao)}% vs semana ant.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-24 w-full mt-auto -ml-2 -mb-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={kpi.historico}>
                                                <XAxis dataKey="name" hide />
                                                <YAxis hide domain={['auto', 'auto']} />
                                                <Tooltip content={<KpiTooltip />} cursor={{ stroke: '#404040', strokeWidth: 1 }} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="val"
                                                    stroke={atingiuMeta ? '#10b981' : '#f59e0b'}
                                                    strokeWidth={3}
                                                    dot={false}
                                                    activeDot={{ r: 5, fill: '#171717', stroke: '#f59e0b', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* BLOCO 2 - Equipe */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    Assertividade da Equipe (Semana Atual)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredGuardioes.map((g: any) => {
                        const risco = g.aderencia < 70
                        return (
                            <div key={g.id} className={`bg-neutral-900 border p-5 rounded-2xl relative overflow-hidden transition-all ${risco ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-neutral-800'}`}>

                                {risco && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/20 to-transparent pointer-events-none" />}

                                <div className="mb-4">
                                    <h3 className="font-bold text-white text-lg truncate mb-1">{g.nome}</h3>
                                    <p className="text-xs text-neutral-500 font-medium capitalize">{g.setor} {g.squad ? `• ${g.squad}` : ''}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/50">
                                        <span className="text-xs font-medium text-neutral-400">Aderência Semanal</span>
                                        <span className={`text-sm font-bold ${risco ? 'text-red-500' : 'text-emerald-500'}`}>{g.aderencia}%</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/50 text-center">
                                            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Atrasadas</span>
                                            <span className="flex items-center justify-center gap-1.5 font-bold text-sm text-white">
                                                {g.atrasadas > 0 && <Clock className="w-3.5 h-3.5 text-red-500" />} {g.atrasadas}
                                            </span>
                                        </div>
                                        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/50 text-center">
                                            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Ocorrências</span>
                                            <span className="flex items-center justify-center gap-1.5 font-bold text-sm text-white">
                                                {g.ocorrenciasAbertas > 0 && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />} {g.ocorrenciasAbertas}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center px-1 pt-1">
                                        <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5" /> Relatórios
                                        </span>
                                        <span className="text-xs font-bold text-neutral-300">{g.taxaRelatorios}% Completos</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
