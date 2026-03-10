import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jszbqcmqumpapvftcmeo.supabase.co'
const supabaseKey = 'sb_publishable_ROJdqyydKZv8ggypakOVdg_BHHLF-sQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
    console.log('Criando usuario na Auth API...')
    const { data, error } = await supabase.auth.signUp({
        email: 'henrique.sanchez@coreeducacao.com',
        password: 'Ric1706$',
        options: {
            data: {
                nome: 'Henrique Sanchez',
            }
        }
    })

    if (error) {
        console.error('Erro ao criar usuário:', error.message)
        return
    }

    console.log('Usuário criado com sucesso na Auth API!')
    console.log('ID do Usuário:', data.user?.id)

    // Tentar inserir no public.profiles (Pode falhar por RLS, mas testamos)
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: data.user?.id,
            nome: 'Henrique Sanchez',
            email: 'henrique.sanchez@coreeducacao.com',
            perfil: 'coordenador',
            setor: 'ambos'
        })

    if (profileError) {
        console.error('Erro ao inserir profile (Esperado devido ao RLS):', profileError.message)
        console.log('\nPor favor, execute o painel SQL fornecido ao usuário para concluir.')
    } else {
        console.log('Profile inserido com sucesso!')
    }
}

createAdmin()
