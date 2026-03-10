'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')

    // Buscar papel do usuário e redirecionar
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('perfil, ativo')
            .eq('id', userData.user.id)
            .single()

        if (profile) {
            if (!profile.ativo) {
                await supabase.auth.signOut()
                return redirect('/login?message=User is inactive')
            }
            if (profile.perfil === 'coordenador') {
                return redirect('/coordenador/dashboard')
            } else {
                return redirect('/guardiao/agenda')
            }
        }
    }

    return redirect('/')
}
