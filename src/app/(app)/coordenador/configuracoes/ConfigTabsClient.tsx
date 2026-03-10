'use client'

import { useState } from 'react'
import { Plus, Archive, Edit2, ShieldAlert, CheckCircle2, XCircle, Power, Settings, Users, CheckSquare } from 'lucide-react'
import { saveKpi, archiveKpi, toggleUserStatus, toggleTemplateStatus, updateOcorrenciaStatus } from './actions'

export default function ConfigTabsClient({ kpis, templates, usuarios, ocorrencias }: any) {
    const [activeTab, setActiveTab] = useState<'kpis' | 'tarefas' | 'usuarios' | 'ocorrencias'>('kpis')

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Configurações Gerais</h1>
                <p className="text-neutral-400">Gerencie métricas, templates de execução e governança da equipe.</p>
            </header>

            {/* TABS HEADER */}
            <div className="flex space-x-2 border-b border-neutral-800">
                {[
                    { id: 'kpis', label: 'KPIs', icon: Settings },
                    { id: 'tarefas', label: 'Templates de Tarefas', icon: CheckSquare },
                    { id: 'usuarios', label: 'Usuários', icon: Users },
                    { id: 'ocorrencias', label: 'Gestão de Ocorrências', icon: ShieldAlert }
                ].map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative ${isActive ? 'text-amber-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                        </button>
                    )
                })}
            </div>

            {/* TABS CONTENT */}
            <div className="pt-2">
                {activeTab === 'kpis' && <TabKpis data={kpis} />}
                {activeTab === 'tarefas' && <TabTarefas data={templates} kpis={kpis.filter((k: any) => !k.arquivado)} />}
                {activeTab === 'usuarios' && <TabUsuarios data={usuarios} />}
                {activeTab === 'ocorrencias' && <TabOcorrencias data={ocorrencias} />}
            </div>
        </div>
    )
}

// -----------------------------------------------------
// TAB KPIS
// -----------------------------------------------------
function TabKpis({ data }: { data: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editing, setEditing] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await saveKpi(new FormData(e.currentTarget))
            setIsModalOpen(false)
        } catch (err: any) {
            alert("Erro: " + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleArchive = async (id: string) => {
        if (confirm('Tem certeza que deseja arquivar este KPI? Ele deixará de aparecer em novos dashboards.')) {
            await archiveKpi(id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Indicadores Chave (KPIs)</h2>
                <button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> Novo KPI
                </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-neutral-400">
                    <thead className="bg-neutral-950 border-b border-neutral-800 uppercase text-xs font-semibold text-neutral-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Nome do KPI</th>
                            <th className="px-6 py-4">Setor</th>
                            <th className="px-6 py-4">Unidade / Meta</th>
                            <th className="px-6 py-4">Consolidação</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {data.map(k => (
                            <tr key={k.id} className="hover:bg-neutral-800/20 transition-colors">
                                <td className="px-6 py-4 font-bold text-white">{k.nome}</td>
                                <td className="px-6 py-4 capitalize font-semibold">{k.setor}</td>
                                <td className="px-6 py-4">{k.meta} {k.unidade}</td>
                                <td className="px-6 py-4 capitalize">{k.consolidacao}</td>
                                <td className="px-6 py-4">
                                    {k.arquivado ? <span className="text-red-500 font-bold text-xs uppercase bg-red-500/10 px-2 py-1 rounded">Arquivado</span> : <span className="text-emerald-500 font-bold text-xs uppercase bg-emerald-500/10 px-2 py-1 rounded">Ativo</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {!k.arquivado && (
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => { setEditing(k); setIsModalOpen(true); }} className="text-neutral-400 hover:text-amber-500 transition-colors" title="Editar Meta/Nome">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleArchive(k.id)} className="text-neutral-400 hover:text-red-500 transition-colors" title="Arquivar Definitivamente">
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal KPI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">{editing ? 'Editar KPI' : 'Criar Novo KPI'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            {editing && <input type="hidden" name="id" value={editing.id} />}
                            <div><label className="block text-sm font-medium text-neutral-300 mb-1.5">Nome do KPI</label><input required name="nome" defaultValue={editing?.nome} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none" placeholder="Ex: Entregas Adiantadas" /></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-neutral-300 mb-1.5">Unidade</label><input required name="unidade" defaultValue={editing?.unidade} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none" placeholder="unidades, reais..." /></div>
                                <div><label className="block text-sm font-medium text-neutral-300 mb-1.5">Meta (Número)</label><input required type="number" step="0.01" name="meta" defaultValue={editing?.meta} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none" /></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Setor</label>
                                    <select required name="setor" defaultValue={editing?.setor || 'copy'} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none">
                                        <option value="copy">Copy</option><option value="mentor">Mentor</option><option value="ambos">Ambos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Consolidação</label>
                                    <select required name="consolidacao" defaultValue={editing?.consolidacao || 'soma'} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none">
                                        <option value="soma">Soma (Acumulado)</option><option value="media">Média</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 mt-6 border-t border-neutral-800 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-50">{isSubmitting ? 'Salvando...' : 'Salvar KPI'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// -----------------------------------------------------
// TAB TAREFAS
// -----------------------------------------------------
function TabTarefas({ data, kpis }: { data: any[], kpis: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    // Implementação do Form omitida aqui pois seria muito extensa. O Coordenador pode usar o SQL Editor neste momento para templates super complexos.
    // Faremos uma versão super simplificada de apenas desativar/ativar e aviso.

    const handleToggleStatus = async (id: string, st: boolean) => {
        await toggleTemplateStatus(id, st)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Templates de Tarefas Semanais</h2>
                <button onClick={() => alert("Para adicionar templates complexos use o database manager por enquanto. MVP limitation.")} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> Novo Template
                </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden p-6">
                <p className="text-sm text-amber-500 mb-6 font-medium">⚠️ Alterações e criações de templates só passam a valer na virada do cronjob na segunda-feira. A semana atual não é afetada.</p>

                <div className="space-y-4">
                    {data.map(t => (
                        <div key={t.id} className={`p-4 rounded-xl border flex items-center justify-between ${t.ativo ? 'border-neutral-700 bg-neutral-800/30' : 'border-red-900/30 bg-red-900/10 opacity-70'}`}>
                            <div>
                                <h4 className="font-bold text-white text-base">{t.nome} <span className="text-xs uppercase ml-2 bg-neutral-800 px-2 py-0.5 rounded text-neutral-400">{t.setor}</span></h4>
                                <p className="text-sm text-neutral-500 mt-1">
                                    Dias: <span className="font-bold uppercase tracking-wider">{t.dias_semana.join(', ')}</span>
                                    {t.task_template_kpis?.length > 0 && <span className="ml-4 tracking-wider text-amber-500/70 font-semibold text-xs border border-amber-500/30 px-2 py-0.5 rounded">Possui KPIs</span>}
                                </p>
                            </div>
                            <div>
                                {t.ativo ? (
                                    <button onClick={() => handleToggleStatus(t.id, false)} className="text-red-400 text-sm font-bold flex items-center gap-1 hover:text-red-300 bg-red-500/10 px-3 py-2 rounded-lg"><Power className="w-4 h-4" /> inativar</button>
                                ) : (
                                    <button onClick={() => handleToggleStatus(t.id, true)} className="text-emerald-400 text-sm font-bold flex items-center gap-1 hover:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg"><CheckCircle2 className="w-4 h-4" /> ativar</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// -----------------------------------------------------
// TAB USUARIOS
// -----------------------------------------------------
function TabUsuarios({ data }: { data: any[] }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Membros do Exército</h2>
                <button onClick={() => alert("Por segurança de credenciais, convite/criação será feita pela Auth API no futuro. Edite os status por aqui.")} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> Novo Usuário
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map(u => (
                    <div key={u.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-colors relative">
                        {!u.ativo && <div className="absolute inset-0 bg-neutral-950/60 rounded-xl z-0 pointer-events-none" />}
                        <div className="relative z-10 mb-4">
                            <h3 className="font-bold text-white text-lg truncate">{u.nome}</h3>
                            <p className="text-xs text-neutral-500">{u.email}</p>

                            <div className="flex gap-2 mt-4">
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-neutral-800 text-neutral-300 rounded">{u.perfil}</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-neutral-800 text-neutral-300 rounded">{u.setor}</span>
                            </div>
                        </div>
                        <div className="relative z-10 mt-auto pt-4 border-t border-neutral-800 flex justify-end">
                            {u.ativo ? (
                                <button onClick={() => toggleUserStatus(u.id, false)} className="text-red-500 font-bold text-xs uppercase hover:underline">Revogar Acesso</button>
                            ) : (
                                <button onClick={() => toggleUserStatus(u.id, true)} className="text-emerald-500 font-bold text-xs uppercase hover:underline">Reativar Acesso</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


// -----------------------------------------------------
// TAB OCORRÊNCIAS
// -----------------------------------------------------
function TabOcorrencias({ data }: { data: any[] }) {
    const [selectedOcorrencia, setSelectedOcorrencia] = useState<any | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleUpdateOcorrencia = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            const formData = new FormData(e.currentTarget)
            await updateOcorrenciaStatus(selectedOcorrencia.id, formData.get('status') as string, formData.get('comentario') as string)
            setSelectedOcorrencia(null)
        } catch (err: any) {
            alert("Erro: " + err.message)
        } finally {
            setIsUpdating(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aberto': return <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-[10px] font-semibold uppercase tracking-wider">Aberto</span>
            case 'em_analise': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px] font-semibold uppercase tracking-wider">Em Análise</span>
            case 'resolvido': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-semibold uppercase tracking-wider">Resolvido</span>
            case 'descartado': return <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] font-semibold uppercase tracking-wider">Descartado</span>
            default: return null
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Todas as Ocorrências Globais</h2>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800">
                {data.map(o => (
                    <div key={o.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-800/50 transition-colors">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                {getStatusBadge(o.status)}
                                <span className="font-bold text-white text-base">{o.titulo}</span>
                            </div>
                            <p className="text-sm text-neutral-500 mb-2 truncate max-w-2xl">{o.descricao}</p>
                            <div className="flex gap-4 text-xs font-semibold text-neutral-400">
                                <span>Por: <span className="text-amber-500">{o.profiles?.nome}</span></span>
                                <span className="uppercase text-[10px]">Impacto: {o.impacto}</span>
                                <span className="uppercase text-[10px]">Setor: {o.setor}</span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedOcorrencia(o)} className="text-xs font-semibold px-4 py-2 bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 whitespace-nowrap shadow-sm">
                            Ver Detalhes
                        </button>
                    </div>
                ))}
            </div>

            {selectedOcorrencia && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
                            <h3 className="text-lg font-semibold text-white">Gestão da Ocorrência</h3>
                            <button onClick={() => setSelectedOcorrencia(null)} className="text-neutral-400 hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateOcorrencia} className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                                <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2">Relatado por {selectedOcorrencia.profiles?.nome}</p>
                                <div className="flex items-start justify-between">
                                    <h4 className="text-sm font-bold text-white leading-tight">{selectedOcorrencia.titulo}</h4>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-400 px-2 py-1 rounded">{selectedOcorrencia.tipo}</span>
                                </div>
                                <p className="text-sm text-neutral-400 whitespace-pre-wrap">{selectedOcorrencia.descricao}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-neutral-300">Novo Status</label>
                                <select name="status" defaultValue={selectedOcorrencia.status} required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-3 text-sm text-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none">
                                    <option value="aberto">Aberto</option>
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
                                    defaultValue={selectedOcorrencia.comentario_coordenador || ''}
                                    rows={4}
                                    placeholder="Adicione um feedback que o Guardião poderá ler..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                                <button type="button" onClick={() => setSelectedOcorrencia(null)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800">Cancelar</button>
                                <button type="submit" disabled={isUpdating} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-50">{isUpdating ? 'Salvando...' : 'Salvar Alterações'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
