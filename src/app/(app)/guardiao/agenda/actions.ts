'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, format, isSaturday, isSunday, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function getWeeklyAgenda() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Calcular início (segunda) e fim (sexta) da semana atual
    // date-fns considera type 0: domingo, 1: segunda.
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 1 }) // Segunda
    const end = addDays(start, 4) // Sexta

    const startStr = format(start, 'yyyy-MM-dd')
    // No Supabase vamos buscar instâncias cuja data_referencia esteja entre start e end, 
    // e sejam do currentUser
    const { data: tasks, error } = await supabase
        .from('task_instances')
        .select(`
      id,
      data_referencia,
      status,
      task_templates (
         id,
         nome,
         setor,
         task_template_kpis (
            kpis ( nome ),
            task_fields (
               id,
               nome,
               tipo,
               obrigatorio,
               ordem
            )
         )
      )
    `)
        .eq('guardiao_id', user.id)
        .gte('data_referencia', startStr)
        .lte('data_referencia', format(end, 'yyyy-MM-dd'))
        .order('data_referencia', { ascending: true })

    if (error) {
        console.error("Erro ao buscar agenda:", error)
        throw new Error('Erro ao carregar tarefas.')
    }

    // Estatísticas
    const total = tasks?.length || 0
    const concluídas = tasks?.filter(t => t.status === 'concluida').length || 0
    const pendentes = tasks?.filter(t => t.status === 'pendente').length || 0
    const atrasadas = tasks?.filter(t => t.status === 'atrasada').length || 0

    const percentual = total === 0 ? 0 : Math.round((concluídas / total) * 100)

    const weekLabel = `Semana de ${format(start, "dd 'de' MMMM", { locale: ptBR })} a ${format(end, "dd 'de' MMMM", { locale: ptBR })}`

    return {
        tasks: tasks || [],
        stats: {
            total,
            concluídas,
            pendentes,
            atrasadas,
            percentual,
            weekLabel
        }
    }
}

export async function submitTaskReport(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const instanceId = formData.get('instanceId') as string
    const descricao = formData.get('descricao') as string

    if (!instanceId || !descricao) {
        throw new Error('Dados incompletos')
    }

    // 1. Inserir Report
    const { data: report, error: reportError } = await supabase
        .from('task_reports')
        .insert({
            task_instance_id: instanceId,
            guardiao_id: user.id,
            descricao
        })
        .select()
        .single()

    if (reportError) {
        console.error(reportError)
        throw new Error('Falha ao salvar relatório.')
    }

    // 2. Inserir Fields
    // O formData contém chaves tipo `field_UUID` para cada valor preenchido
    const fieldsValues = []
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('field_')) {
            const fieldId = key.replace('field_', '')
            fieldsValues.push({
                task_report_id: report.id,
                task_field_id: fieldId,
                valor: parseFloat(value as string)
            })
        }
    }

    if (fieldsValues.length > 0) {
        const { error: valsError } = await supabase
            .from('task_field_values')
            .insert(fieldsValues)

        if (valsError) {
            console.error(valsError)
            throw new Error('Falha ao salvar valores de KPI.')
        }
    }

    // 3. Atualizar status da instância para concluida
    const { error: updateError } = await supabase
        .from('task_instances')
        .update({ status: 'concluida' })
        .eq('id', instanceId)
        .eq('guardiao_id', user.id)

    if (updateError) {
        console.error(updateError)
        throw new Error('Falha ao atualizar status da tarefa.')
    }

    return { success: true }
}
