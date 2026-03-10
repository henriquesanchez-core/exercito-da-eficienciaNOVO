'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'

export async function getAnaliseOptions() {
    const supabase = await createClient()
    const { data: guardioes } = await supabase
        .from('profiles')
        .select('id, nome, setor, squad, ativo')
        .eq('perfil', 'guardiao')
        .order('nome')

    return guardioes || []
}

export async function getAnaliseData(guardiaoId: string) {
    const supabase = await createClient()

    // Precisamos retornar: 
    // - Assertividade (grafico 4 sem)
    // - Tarefas da semana atual 
    // - KPIs Individuais (4 sem)
    // - Ocorrencias Abertas

    const today = new Date()
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weeks: { label: string; start: string; end: string }[] = []

    for (let i = 3; i >= 0; i--) {
        const s = subWeeks(currentWeekStart, i)
        const e = endOfWeek(s, { weekStartsOn: 1 })
        weeks.push({
            label: `Semana ${format(s, 'dd/MM')}`,
            start: format(s, 'yyyy-MM-dd'),
            end: format(e, 'yyyy-MM-dd')
        })
    }

    const startDate = weeks[0].start
    const endDate = weeks[3].end
    const currentWeekS = weeks[3].start
    const currentWeekE = weeks[3].end

    // Tarefas de todo período para assertividade + KPIs
    const { data: instances } = await supabase
        .from('task_instances')
        .select(`
      id, status, data_referencia,
      task_templates (
         id, nome, setor,
         task_template_kpis (
             kpi_id,
             task_fields(id, nome)
         )
      ),
      task_reports (
         id, descricao, salvo_em,
         task_field_values ( valor, task_field_id )
      )
    `)
        .eq('guardiao_id', guardiaoId)
        .gte('data_referencia', startDate)
        .lte('data_referencia', endDate)
        .order('data_referencia', { ascending: false })

    const tasks: any[] = instances || []

    // Tarefas Específicas da Semana Atual (para o Bloco 2)
    const tarefasSemanaAtual = tasks.filter(t => t.data_referencia >= currentWeekS && t.data_referencia <= currentWeekE)

    // Assertividade
    const assertividadePorSemana = weeks.map(w => {
        const weekTasks = tasks.filter(t => t.data_referencia >= w.start && t.data_referencia <= w.end)
        const total = weekTasks.length
        const concluidas = weekTasks.filter(t => t.status === 'concluida').length
        const _percent = total === 0 ? 0 : Math.round((concluidas / total) * 100)
        return { name: w.label, aderencia: _percent, total, concluidas, pendentes: total - concluidas }
    })

    const totalGeral = tasks.length
    const concluidasGeral = tasks.filter(t => t.status === 'concluida').length
    const atrasadasGeral = tasks.filter(t => t.status === 'atrasada').length
    const pendentesGeral = tasks.filter(t => t.status === 'pendente').length
    const aderenciaGeral = totalGeral === 0 ? 0 : Math.round((concluidasGeral / totalGeral) * 100)

    // KPIs
    const { data: rawKpiValues } = await supabase
        .from('task_field_values')
        .select(`
       valor,
       task_fields (
          task_template_kpis (
             kpi_id,
             kpis ( id, nome, meta, unidade )
          )
       ),
       task_reports!inner (
          guardiao_id,
          task_instances!inner ( data_referencia )
       )
    `)
        .eq('task_reports.guardiao_id', guardiaoId)
        .gte('task_reports.task_instances.data_referencia', startDate)
        .lte('task_reports.task_instances.data_referencia', endDate)

    const kpisStats = new Map()
    if (rawKpiValues) {
        rawKpiValues.forEach((r: any) => {
            const kpi = r.task_fields?.task_template_kpis?.kpis
            if (!kpi) return

            const dateRef = r.task_reports?.task_instances?.data_referencia
            const val = Number(r.valor)

            if (!kpisStats.has(kpi.id)) {
                kpisStats.set(kpi.id, {
                    ...kpi,
                    historico: weeks.map(w => ({ name: w.label, start: w.start, end: w.end, val: 0 })),
                    acumuladoAtual: 0
                })
            }

            const stat = kpisStats.get(kpi.id)
            const wk = stat.historico.find((w: any) => dateRef >= w.start && dateRef <= w.end)
            if (wk) wk.val += val

            if (dateRef >= currentWeekS && dateRef <= currentWeekE) {
                stat.acumuladoAtual += val
            }
        })
    }

    // Ocorrências Abertas
    const { data: ocorrencias } = await supabase
        .from('occurrences')
        .select('*')
        .eq('guardiao_id', guardiaoId)
        .eq('status', 'aberto')
        .order('criado_em', { ascending: false })

    return {
        assertividade: {
            aderenciaGeral,
            atrasadasGeral,
            pendentesGeral,
            concluidasGeral,
            totalGeral,
            grafico: assertividadePorSemana
        },
        tarefasSemanaAtual,
        kpis: Array.from(kpisStats.values()),
        ocorrencias: ocorrencias || []
    }
}

export async function adminUpdateOcorrencia(id: string, status: string, comentario: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verifica se é coord? O RLS já bloqueia, mas vamos logar.
    const { error } = await supabase
        .from('occurrences')
        .update({
            status,
            comentario_coordenador: comentario,
            atualizado_em: new Date().toISOString()
        })
        .eq('id', id)

    if (error) throw new Error('Falha ao atualizar ocorrência: ' + error.message)
    return { success: true }
}
