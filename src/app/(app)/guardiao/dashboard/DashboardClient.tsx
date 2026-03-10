'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Target, CheckCircle2, AlertCircle, FileText } from 'lucide-react'

type DashboardDataProps = {
    assertividade: {
        aderenciaGeral: number
        atrasadasGeral: number
        taxaRelatorios: number
        grafico: any[]
    }
    kpis: any[]
}

export default function DashboardClient({ data }: { data: DashboardDataProps }) {
    const { assertividade, kpis } = data

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-1">{label}</p>
                    <p className="text-amber-500 font-bold">{payload[0].value}% Aderência</p>
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

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Meu Dashboard</h1>
                <p className="text-neutral-400">Análise de assertividade e indicadores de performance (Últimas 4 semanas).</p>
            </header>

            {/* BLOCO 1 - Assertividade */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    Assertividade de Execução
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-400">Progresso no Prazo</p>
                            <p className="text-3xl font-bold text-white">{assertividade.aderenciaGeral}%</p>
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-400">Total Atrasadas</p>
                            <p className="text-3xl font-bold text-white">{assertividade.atrasadasGeral}</p>
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-400">Relatórios Completos</p>
                            <p className="text-3xl font-bold text-white">{assertividade.taxaRelatorios}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl h-80">
                    <h3 className="text-sm font-semibold text-neutral-300 mb-6 uppercase tracking-wider">Evolução Semanal de Aderência</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assertividade.grafico}>
                            <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                            <Tooltip cursor={{ fill: '#262626' }} content={<CustomTooltip />} />
                            <Bar dataKey="aderencia" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* BLOCO 2 - KPIs */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    Meus Indicadores (KPIs)
                </h2>

                {kpis.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-900 border border-neutral-800 rounded-xl">
                        <p className="text-neutral-500">Nenhum dado de KPI registrado nas últimas 4 semanas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {kpis.map((kpi: any) => {
                            const atingiuMeta = kpi.meta > 0 && kpi.acumuladoAtual >= kpi.meta

                            return (
                                <div key={kpi.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex flex-col gap-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-white text-lg">{kpi.nome}</h3>
                                            <p className="text-sm text-neutral-500">Meta: {kpi.meta} {kpi.unidade}</p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded flex items-center gap-2 ${atingiuMeta ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-300'}`}>
                                            {atingiuMeta && <CheckCircle2 className="w-4 h-4" />}
                                            <span className="font-bold">{kpi.acumuladoAtual} {kpi.unidade}</span>
                                        </div>
                                    </div>

                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={kpi.historico}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                                <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                                                <Tooltip cursor={{ stroke: '#525252' }} content={<KpiTooltip />} />
                                                <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
