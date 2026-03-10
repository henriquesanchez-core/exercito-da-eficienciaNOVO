'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'

export async function getDashboardCoordenadorData() {
    const supabase = await createClient()

    // Período de 4 semanas (atual + 3 anteriores)
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
    const previousWeekS = weeks[2]?.start
    const previousWeekE = weeks[2]?.end

    // Buscar todos os Guardiões
    const { data: guardioes } = await supabase
        .from('profiles')
        .select('id, nome, setor, squad')
        .eq('perfil', 'guardiao')
        .eq('ativo', true)

    const activeGuardioes = guardioes || []

    // 1. DADOS DE ASSERTIVIDADE DOS GUARDIÕES (Semana Atual)
    const statsGuardioes = await Promise.all(activeGuardioes.map(async (g) => {
        // Tarefas da semana atual
        const { data: insts } = await supabase
            .from('task_instances')
            .select('id, status, task_reports(descricao)')
            .eq('guardiao_id', g.id)
            .gte('data_referencia', currentWeekS)
            .lte('data_referencia', currentWeekE)

        const tasks: any[] = insts || []
        const total = tasks.length
        const concluidas = tasks.filter(t => t.status === 'concluida').length
        const atrasadas = tasks.filter(t => t.status === 'atrasada').length

        const aderencia = total === 0 ? 0 : Math.round((concluidas / total) * 100)

        let completas = 0
        tasks.filter(t => t.status === 'concluida').forEach(t => {
            if (t.task_reports && t.task_reports.length > 0 && t.task_reports[0].descricao) completas++
        })
        const taxaRelatorios = concluidas === 0 ? 0 : Math.round((completas / concluidas) * 100)

        // Ocorrências abertas deste guardião
        const { count: ocorrenciasAbertas } = await supabase
            .from('occurrences')
            .select('*', { count: 'exact', head: true })
            .eq('guardiao_id', g.id)
            .eq('status', 'aberto')

        return {
            ...g,
            aderencia,
            atrasadas,
            taxaRelatorios,
            ocorrenciasAbertas: ocorrenciasAbertas || 0
        }
    }))

    // Ordenar por menor aderência primeiro
    statsGuardioes.sort((a, b) => a.aderencia - b.aderencia)

    // 2. DADOS DE KPIS
    const { data: rawKpiValues } = await supabase
        .from('task_field_values')
        .select(`
       valor,
       task_fields (
          task_template_kpis (
             kpis ( id, nome, meta, unidade, setor, consolidacao, arquivado )
          )
       ),
       task_reports!inner (
          guardiao_id,
          task_instances!inner (
             data_referencia
          )
       )
    `)
        .gte('task_reports.task_instances.data_referencia', startDate)
        .lte('task_reports.task_instances.data_referencia', endDate)

    const { data: allKpis } = await supabase.from('kpis').select('*').eq('arquivado', false)
    const kpisStats = new Map()

    if (allKpis) {
        allKpis.forEach(kpi => {
            kpisStats.set(kpi.id, {
                ...kpi,
                historico: weeks.map(w => ({ name: w.label, start: w.start, end: w.end, val: 0, count: 0 })),
                acumuladoAtual: 0,
                valorAnterior: 0
            })
        })
    }

    if (rawKpiValues) {
        rawKpiValues.forEach((r: any) => {
            const kpi = r.task_fields?.task_template_kpis?.kpis
            if (!kpi || kpi.arquivado) return

            const dateRef = r.task_reports?.task_instances?.data_referencia
            const val = Number(r.valor)

            const stat = kpisStats.get(kpi.id)
            if (!stat) return

            const wk = stat.historico.find((w: any) => dateRef >= w.start && dateRef <= w.end)
            if (wk) {
                wk.val += val
                wk.count += 1
            }

            if (dateRef >= currentWeekS && dateRef <= currentWeekE) {
                stat.acumuladoAtual += val
            }
            if (previousWeekS && dateRef >= previousWeekS && dateRef <= previousWeekE) {
                stat.valorAnterior += val
            }
        })
    }

    // Processar consolidação (média vs soma) e Variação
    const processedKpis = Array.from(kpisStats.values()).map(k => {
        k.historico = k.historico.map((h: any) => {
            let finalVal = h.val
            if (k.consolidacao === 'media' && h.count > 0) {
                // Numero de usuarios unicos que preencheram na semana seria o ideal,
                // mas como aproximação basica para media: dividimos pelo numero de task instances?
                // Como o requisito dita: "média dos Guardiões do setor", a média de X unidades / Guardiao
                // Vou usar count (qts vezes o kpi foi preenchido). Se cada guardiao preenche 1 vez na semana, bate.
                finalVal = Number((h.val / h.count).toFixed(2))
            }
            return { ...h, val: finalVal }
        })

        let current = k.acumuladoAtual
        let prev = k.valorAnterior

        if (k.consolidacao === 'media') {
            const currentCount = k.historico[3].count
            const prevCount = k.historico[2].count
            current = currentCount > 0 ? Number((current / currentCount).toFixed(2)) : 0
            prev = prevCount > 0 ? Number((prev / prevCount).toFixed(2)) : 0
        }

        k.acumuladoAtual = current
        let variacao = 0
        if (prev > 0) {
            variacao = Math.round(((current - prev) / prev) * 100)
        } else if (current > 0) {
            variacao = 100
        }

        k.variacao = variacao
        return k
    })

    return {
        kpis: processedKpis,
        guardioes: statsGuardioes
    }
}
