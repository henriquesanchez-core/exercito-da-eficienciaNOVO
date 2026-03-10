'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitOcorrencia(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const tipo = formData.get('tipo') as string
    const setor = formData.get('setor') as string
    const impacto = formData.get('impacto') as string
    const titulo = formData.get('titulo') as string
    const descricao = formData.get('descricao') as string

    if (!tipo || !setor || !impacto || !titulo || !descricao) {
        throw new Error('Todos os campos são obrigatórios.')
    }

    const { error } = await supabase.from('occurrences').insert({
        guardiao_id: user.id,
        tipo,
        setor,
        impacto,
        titulo,
        descricao
    })

    if (error) {
        console.error(error)
        throw new Error('Erro ao salvar ocorrência.')
    }

    revalidatePath('/guardiao/ocorrencias')
    return { success: true }
}

export async function getOcorrencias() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('guardiao_id', user.id)
        .order('criado_em', { ascending: false })

    if (error) {
        console.error(error)
        return []
    }

    return data
}
