import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar papel do usuário e redirecionar
  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil, ativo')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.ativo) {
    // Se não tem profile ainda (SQL não rodado) ou inativo, manda pro login com aviso
    redirect('/login?message=Profile not found or inactive')
  }

  if (profile.perfil === 'coordenador') {
    redirect('/coordenador/dashboard')
  } else {
    redirect('/guardiao/agenda')
  }
}
