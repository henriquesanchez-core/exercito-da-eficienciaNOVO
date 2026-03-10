'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'

export async function getDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Período de 4 semanas (atual + 3 anteriores)
    const today = new Date()
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weeks: { label: string; start: string; end: string }[] = []

    // Array de Data Inicio da Semana
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

    // Buscar todas as instâncias das últimas 4 semanas
    const { data: instances } = await supabase
        .from('task_instances')
        .select(`
      id, status, data_referencia,
      task_templates (
         id, nome, setor,
         task_template_kpis (
             kpi_id
         )
      ),
      task_reports (
         id, descricao,
         task_field_values ( valor )
      )
    `)
        .eq('guardiao_id', user.id)
        .gte('data_referencia', startDate)
        .lte('data_referencia', endDate)

    const tasks: any[] = instances || []

    // Calcular Assertividade por Semana
    const assertividadePorSemana = weeks.map(w => {
        const weekTasks = tasks.filter(t => t.data_referencia >= w.start && t.data_referencia <= w.end)
        const total = weekTasks.length
        const concluidas = weekTasks.filter(t => t.status === 'concluida').length
        const _percent = total === 0 ? 0 : Math.round((concluidas / total) * 100)
        return { name: w.label, aderencia: _percent, concluídas: concluidas, total }
    })

    // Estatísticas Globais (4 semanas)
    const totalGeral = tasks.length
    const concluidasGeral = tasks.filter(t => t.status === 'concluida').length
    const atrasadasGeral = tasks.filter(t => t.status === 'atrasada').length
    const aderenciaGeral = totalGeral === 0 ? 0 : Math.round((concluidasGeral / totalGeral) * 100)

    // Taxa de relatórios completos: concluidas que tem task_reports e preencheram kpis (se houver kpis requeridos, nossa regra já obriga)
    let completas = 0
    tasks.filter(t => t.status === 'concluida').forEach(t => {
        if (t.task_reports && t.task_reports.length > 0 && t.task_reports[0].descricao) completas++
    })
    const taxaRelatorios = concluidasGeral === 0 ? 0 : Math.round((completas / concluidasGeral) * 100)

    // Bloco 2 - KPIs Individuais
    const myKpisMap = new Map()

    // Quais KPIs esse guardiao toca? Todos associados aos templates que ele executou
    const kpiIds = new Set<string>()
    tasks.forEach(t => {
        t.task_templates?.task_template_kpis?.forEach((ttk: any) => kpiIds.add(ttk.kpi_id))
    })

    // Buscar definicao dos KPIs
    const kpiDefs: any[] = []
    if (kpiIds.size > 0) {
        const { data: kps } = await supabase.from('kpis').select('*').in('id', Array.from(kpiIds))
        if (kps) kps.forEach(k => kpiDefs.push(k))
    }

    // Agora vamos calcular o histórico de cada KPI nas ultimas 4 semanas
    // Re-buscar os fields de report para esse guardiao
    // task_instances -> reports -> values 
    const kpiData = kpiDefs.map(kpi => {
        // Identificar quais fields pertencem a este kpi. É complexo via JS se nao tivermos a relação, mas a temos:
        // As task_instances tem t.task_templates.task_template_kpis == ttk_id onde kpi_id = kpi.id
        // O que nos dá os valores. Na verdade, precisamos saber quais fields pertencem a este KPI.
        // Vamos fazer uma sub-query simplificada buscando todo o grafico do Guardiao

        return null
    }).filter(Boolean)

    // Melhor para KPIs: Fazer uma consulta direta agregando por KPI e semana
    // Como `task_field_values` aponta pra `task_fields` e `task_fields` pra `task_template_kpis`
    const { data: rawKpiValues } = await supabase
        .from('task_field_values')
        .select(`
       valor,
       task_fields (
          id,
          task_template_kpis (
             kpi_id,
             kpis ( nome, meta, unidade )
          )
       ),
       task_reports!inner (
          guardiao_id,
          task_instances!inner (
             data_referencia
          )
       )
    `)
        .eq('task_reports.guardiao_id', user.id)
        .gte('task_reports.task_instances.data_referencia', startDate)
        .lte('task_reports.task_instances.data_referencia', endDate)

    // Agrupar rawKpiValues por KPI_id
    const kpisStats = new Map()
    if (rawKpiValues) {
        rawKpiValues.forEach((r: any) => {
            const kpi = r.task_fields?.task_template_kpis?.kpis
            const kpiId = r.task_fields?.task_template_kpis?.kpi_id
            const dateRef = r.task_reports?.task_instances?.data_referencia
            const val = r.valor

            if (!kpi || !kpiId) return

            if (!kpisStats.has(kpiId)) {
                kpisStats.set(kpiId, {
                    id: kpiId,
                    nome: kpi.nome,
                    meta: kpi.meta,
                    unidade: kpi.unidade,
                    historico: weeks.map(w => ({ name: w.label, start: w.start, end: w.end, val: 0 })),
                    acumuladoAtual: 0
                })
            }

            const stat = kpisStats.get(kpiId)

            // Em qual semana esta data cai?
            const wk = stat.historico.find((w: any) => dateRef >= w.start && dateRef <= w.end)
            if (wk) {
                wk.val += val // Acumulando valor numérico
            }

            // Se for da semana atual (última da lista)
            if (dateRef >= weeks[3].start && dateRef <= weeks[3].end) {
                stat.acumuladoAtual += val
            }
        })
    }

    return {
        assertividade: {
            aderenciaGeral,
            atrasadasGeral,
            taxaRelatorios,
            grafico: assertividadePorSemana
        },
        kpis: Array.from(kpisStats.values())
    }
}
