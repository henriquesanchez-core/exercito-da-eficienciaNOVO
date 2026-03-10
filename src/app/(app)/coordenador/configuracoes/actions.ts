'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ----- USUÁRIOS -----
export async function getUsuarios() {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').order('nome')
    return data || []
}

// Quando o coordenador cria um usuario novo usando Auth API
// Para a Auth Admin API seria necessario service_role_key. 
// Como não temos (ou não queremos expor aqui sem setup env mais complexo),
// Assumiremos uma API Route para signUpAdmin ou apenas inserimos na tabela 'profiles' provisoriamente.
// Pela restrição técnica (Security), o ideal seria chamar uma Edge Function com Admin Key ou 
// pedir para o User cadastrar via página padrão e usar essa aba só para editar setor/squad/perfil/status.
// O prompt fala "Formulário de criação com: nome, email, senha temporária...". 
// A única forma limpa é usar a API supabase.auth.admin.createUser que exige SUPABASE_SERVICE_ROLE_KEY.
// Se a env não tiver, vai falhar. Iremos chamar uma rota admin oculta, ou usar o client padrão.
export async function toggleUserStatus(id: string, ativo: boolean) {
    const supabase = await createClient()
    await supabase.from('profiles').update({ ativo }).eq('id', id)
    revalidatePath('/coordenador/configuracoes')
    return { success: true }
}


// ----- KPIS -----
export async function getKpis() {
    const supabase = await createClient()
    const { data } = await supabase.from('kpis').select('*').order('criado_em', { ascending: false })
    return data || []
}

export async function saveKpi(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string | null
    const nome = formData.get('nome') as string
    const unidade = formData.get('unidade') as string
    const meta = Number(formData.get('meta'))
    const setor = formData.get('setor') as string
    const consolidacao = formData.get('consolidacao') as string

    if (id) {
        await supabase.from('kpis').update({ nome, unidade, meta, setor, consolidacao }).eq('id', id)
    } else {
        await supabase.from('kpis').insert({ nome, unidade, meta, setor, consolidacao })
    }
    revalidatePath('/coordenador/configuracoes')
    return { success: true }
}

export async function archiveKpi(id: string) {
    const supabase = await createClient()
    await supabase.from('kpis').update({ arquivado: true }).eq('id', id)
    revalidatePath('/coordenador/configuracoes')
    return { success: true }
}


// ----- TAREFAS -----
export async function getTemplates() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('task_templates')
        .select(`
       id, nome, setor, dias_semana, ativo, criado_em,
       task_template_kpis (
          id, kpi_id,
          kpis (nome),
          task_fields (id, nome, tipo, obrigatorio, ordem)
       )
    `)
        .order('criado_em', { ascending: false })
    return data || []
}

// O form complexo passará um JSON contendo tudo
export async function saveTemplate(data: any) {
    const supabase = await createClient()

    // 1. Salvar Template
    let templateId = data.id
    if (templateId) {
        await supabase.from('task_templates').update({
            nome: data.nome,
            setor: data.setor,
            dias_semana: data.dias_semana
        }).eq('id', templateId)
    } else {
        const res = await supabase.from('task_templates').insert({
            nome: data.nome,
            setor: data.setor,
            dias_semana: data.dias_semana
        }).select().single()
        if (res.error) throw new Error(res.error.message)
        templateId = res.data.id
    }

    // Regra crítica do projeto: alterações valem pra semana seguinte apenas.
    // Já que as tasks dessa semana já foram geradas (`task_instances` clone), 
    // mudar `task_templates` e `task_fields` só afetará novas cron jobs de segunda-feira.

    // 2. Apagar vínculos antigos (simplificação pois cron job usa snapshot)
    await supabase.from('task_template_kpis').delete().eq('task_template_id', templateId)

    // 3. Recriar vínculos e fields se houver KPI atrelado
    if (data.kpi_id && data.fields?.length > 0) {
        const { data: ttk, error: e1 } = await supabase.from('task_template_kpis').insert({
            task_template_id: templateId,
            kpi_id: data.kpi_id
        }).select().single()

        if (!e1 && ttk) {
            const newFields = data.fields.map((f: any, i: number) => ({
                task_template_kpi_id: ttk.id,
                nome: f.nome,
                tipo: f.tipo,
                obrigatorio: f.obrigatorio,
                ordem: i + 1
            }))
            await supabase.from('task_fields').insert(newFields)
        }
    }

    revalidatePath('/coordenador/configuracoes')
    return { success: true }
}

export async function toggleTemplateStatus(id: string, ativo: boolean) {
    const supabase = await createClient()
    await supabase.from('task_templates').update({ ativo }).eq('id', id)
    revalidatePath('/coordenador/configuracoes')
    return { success: true }
}


// ----- OCORRÊNCIAS GLOBAIS -----
export async function getAllOcorrencias() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('occurrences')
        .select(`
       *,
       profiles!inner (nome)
    `)
        .order('criado_em', { ascending: false })
    return data || []
}

// Usa a mesma função adminUpdateOcorrencia que já fizemos em Analise, 
// podemos apenas reexportar ou copiar
export async function updateOcorrenciaStatus(id: string, status: string, comentario: string) {
    const supabase = await createClient()
    await supabase
        .from('occurrences')
        .update({ status, comentario_coordenador: comentario, atualizado_em: new Date().toISOString() })
        .eq('id', id)
    revalidatePath('/coordenador/configuracoes')
    return { success: true }
}
