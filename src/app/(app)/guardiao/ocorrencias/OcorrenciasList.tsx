'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, X, AlertOctagon, Lightbulb, MessageSquare } from 'lucide-react'
import { submitOcorrencia } from './actions'

type Ocorrencia = {
    id: string
    tipo: 'problema' | 'melhoria'
    titulo: string
    descricao: string
    impacto: 'baixo' | 'medio' | 'alto' | 'critico'
    setor: 'copy' | 'mentor' | 'ambos'
    status: 'aberto' | 'em_analise' | 'resolvido' | 'descartado'
    comentario_coordenador?: string
    criado_em: string
}

export default function OcorrenciasList({ initialData }: { initialData: Ocorrencia[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filterTipo, setFilterTipo] = useState<'todos' | 'problema' | 'melhoria'>('todos')
    const [filterStatus, setFilterStatus] = useState<string>('todos')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const filtered = initialData.filter(o =>
        (filterTipo === 'todos' || o.tipo === filterTipo) &&
        (filterStatus === 'todos' || o.status === filterStatus)
    )

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const formData = new FormData(e.currentTarget)
            await submitOcorrencia(formData)
            setIsModalOpen(false)
            window.location.reload()
        } catch (err: any) {
            alert("Erro ao enviar: " + err.message)
            setIsSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aberto': return <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs font-semibold uppercase tracking-wider">Aberto</span>
            case 'em_analise': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-xs font-semibold uppercase tracking-wider">Em Análise</span>
            case 'resolvido': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold uppercase tracking-wider">Resolvido</span>
            case 'descartado': return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-semibold uppercase tracking-wider">Descartado</span>
            default: return null
        }
    }

    const getImpactBadge = (impact: string) => {
        switch (impact) {
            case 'baixo': return 'bg-neutral-800 text-neutral-400'
            case 'medio': return 'bg-blue-500/10 text-blue-400'
            case 'alto': return 'bg-orange-500/10 text-orange-400'
            case 'critico': return 'bg-red-500/10 text-red-500 border border-red-500/20'
            default: return ''
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        className="bg-neutral-950 border border-neutral-800 text-sm rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value as any)}
                    >
                        <option value="todos">Todos os Tipos</option>
                        <option value="problema">Problema</option>
                        <option value="melhoria">Melhoria</option>
                    </select>
                    <select
                        className="bg-neutral-950 border border-neutral-800 text-sm rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="todos">Todos os Status</option>
                        <option value="aberto">Abertos</option>
                        <option value="em_analise">Em Análise</option>
                        <option value="resolvido">Resolvidos</option>
                        <option value="descartado">Descartados</option>
                    </select>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nova Ocorrência
                </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <h3 className="text-lg font-medium text-neutral-300 mb-2">Nenhum registro encontrado</h3>
                        <p className="text-neutral-500 text-sm">Você não tem nenhuma ocorrência ou melhoria registrada com os filtros atuais.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-800">
                        {filtered.map(o => (
                            <div key={o.id} className="p-5 hover:bg-neutral-800/50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-1 relative pl-10">
                                        <div className="absolute left-0 top-1 text-neutral-500">
                                            {o.tipo === 'problema' ? <AlertOctagon className="w-6 h-6 text-red-500/80" /> : <Lightbulb className="w-6 h-6 text-amber-500/80" />}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-semibold text-white">{o.titulo}</h4>
                                            {getStatusBadge(o.status)}
                                        </div>
                                        <p className="text-sm text-neutral-400 max-w-2xl">{o.descricao}</p>
                                        <div className="flex items-center gap-4 pt-2 text-xs">
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${getImpactBadge(o.impacto)}`}>
                                                Impacto: <span className="capitalize">{o.impacto}</span>
                                            </span>
                                            <span className="text-neutral-500">
                                                Setor: <strong className="capitalize font-medium text-neutral-300">{o.setor}</strong>
                                            </span>
                                            <span className="text-neutral-500">
                                                {format(parseISO(o.criado_em), "dd/MM/yyyy 'às' HH:mm")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {o.comentario_coordenador && (
                                    <div className="mt-4 ml-10 p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex gap-3">
                                        <MessageSquare className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">Feedback do Coordenador</span>
                                            <p className="text-sm text-neutral-300">{o.comentario_coordenador}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Nova Ocorrência */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
                            <h3 className="text-lg font-semibold text-white">Novo Registro</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-neutral-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-neutral-300">Tipo</label>
                                    <select name="tipo" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:ring-2 focus:ring-amber-500 focus:outline-none">
                                        <option value="problema">Problema</option>
                                        <option value="melhoria">Melhoria</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-neutral-300">Impacto</label>
                                    <select name="impacto" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:ring-2 focus:ring-amber-500 focus:outline-none">
                                        <option value="baixo">Baixo</option>
                                        <option value="medio">Médio</option>
                                        <option value="alto">Alto</option>
                                        <option value="critico">Crítico</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-neutral-300">Setor Afetado</label>
                                <select name="setor" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:ring-2 focus:ring-amber-500 focus:outline-none">
                                    <option value="copy">Copy</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="ambos">Ambos</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-neutral-300">Título</label>
                                <input
                                    type="text"
                                    name="titulo"
                                    required
                                    placeholder="Resumo do registro..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-neutral-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-neutral-300">Descrição Detalhada</label>
                                <textarea
                                    name="descricao"
                                    required
                                    rows={4}
                                    placeholder="Detalhe o contexto, como afeta a operação e possíveis ideias de solução..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-neutral-600"
                                />
                            </div>

                            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Salvar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
