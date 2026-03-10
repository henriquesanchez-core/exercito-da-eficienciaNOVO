-- Exército da Eficiência - Schema Inicial

-- 1. Criação de Enums
CREATE TYPE perfil_usuario AS ENUM ('guardiao', 'coordenador');
CREATE TYPE setor_enum AS ENUM ('copy', 'mentor', 'ambos');
CREATE TYPE tipo_campo AS ENUM ('inteiro', 'decimal');
CREATE TYPE status_tarefa AS ENUM ('pendente', 'concluida', 'atrasada');
CREATE TYPE consolidacao_kpi AS ENUM ('soma', 'media');
CREATE TYPE tipo_ocorrencia AS ENUM ('problema', 'melhoria');
CREATE TYPE impacto_ocorrencia AS ENUM ('baixo', 'medio', 'alto', 'critico');
CREATE TYPE status_ocorrencia AS ENUM ('aberto', 'em_analise', 'resolvido', 'descartado');

-- 2. Tabela de Usuários (Profile associado ao auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    perfil perfil_usuario NOT NULL DEFAULT 'guardiao',
    setor setor_enum NOT NULL,
    squad TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de KPIs
CREATE TABLE public.kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    unidade TEXT NOT NULL,
    meta DECIMAL NOT NULL,
    setor setor_enum NOT NULL,
    consolidacao consolidacao_kpi NOT NULL DEFAULT 'soma',
    arquivado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ativar RLS
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de Templates de Tarefas
CREATE TABLE public.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    setor setor_enum NOT NULL,
    dias_semana TEXT[] NOT NULL, -- Ex: ['seg', 'ter', 'qua', 'qui', 'sex']
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ativar RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Tabela intermediária para múltiplos KPIs por tarefa
CREATE TABLE public.task_template_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
    kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
    UNIQUE(task_template_id, kpi_id)
);

-- Ativar RLS
ALTER TABLE public.task_template_kpis ENABLE ROW LEVEL SECURITY;

-- 5. Tabela de Campos da Tarefa
CREATE TABLE public.task_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_template_kpi_id UUID NOT NULL REFERENCES public.task_template_kpis(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo tipo_campo NOT NULL DEFAULT 'inteiro',
    obrigatorio BOOLEAN NOT NULL DEFAULT TRUE,
    ordem INTEGER NOT NULL DEFAULT 1
);

-- Ativar RLS
ALTER TABLE public.task_fields ENABLE ROW LEVEL SECURITY;

-- 6. Tabela de Instâncias de Tarefa (O que o Guardião executa)
CREATE TABLE public.task_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_template_id UUID NOT NULL REFERENCES public.task_templates(id),
    guardiao_id UUID NOT NULL REFERENCES public.profiles(id),
    data_referencia DATE NOT NULL,
    status status_tarefa NOT NULL DEFAULT 'pendente',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ativar RLS
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;

-- 7. Tabela de Relatórios de Tarefa (A resposta do Guardião)
CREATE TABLE public.task_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_instance_id UUID NOT NULL REFERENCES public.task_instances(id) ON DELETE CASCADE,
    guardiao_id UUID NOT NULL REFERENCES public.profiles(id),
    descricao TEXT NOT NULL,
    salvo_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ativar RLS
ALTER TABLE public.task_reports ENABLE ROW LEVEL SECURITY;

-- Tabela de Valores dos Campos
CREATE TABLE public.task_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_report_id UUID NOT NULL REFERENCES public.task_reports(id) ON DELETE CASCADE,
    task_field_id UUID NOT NULL REFERENCES public.task_fields(id) ON DELETE CASCADE,
    valor DECIMAL NOT NULL
);

-- Ativar RLS
ALTER TABLE public.task_field_values ENABLE ROW LEVEL SECURITY;

-- 8. Tabela de Ocorrências
CREATE TABLE public.occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardiao_id UUID NOT NULL REFERENCES public.profiles(id),
    tipo tipo_ocorrencia NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    impacto impacto_ocorrencia NOT NULL,
    setor setor_enum NOT NULL,
    status status_ocorrencia NOT NULL DEFAULT 'aberto',
    comentario_coordenador TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ativar RLS
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;


-- POLÍTICAS DE RLS (Row Level Security)

-- Guardião vê apenas seus dados. Coordenador vê tudo.
-- Uma função útil para verificar se o usuário atual é coordenador:
CREATE OR REPLACE FUNCTION public.is_coordenador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT perfil = 'coordenador' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: 
CREATE POLICY "Usuários veem o próprio perfil, Coordenador vê todos" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR is_coordenador());

CREATE POLICY "Apenas Coordenador pode inserir profiles" ON public.profiles FOR INSERT
  WITH CHECK (is_coordenador());

CREATE POLICY "Apenas Coordenador pode atualizar profiles" ON public.profiles FOR UPDATE
  USING (is_coordenador());

-- KPIs: Coordenador edita, todos leem.
CREATE POLICY "Todos autenticados leem KPIs" ON public.kpis FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordenador faz tudo em KPIs" ON public.kpis FOR ALL USING (is_coordenador());

-- Task Templates (e derivados): Coordenador edita, Guardiões (de seu setor) leem.
CREATE POLICY "Todos leem templates" ON public.task_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordenador edita templates" ON public.task_templates FOR ALL USING (is_coordenador());

CREATE POLICY "Todos leem kpis de template" ON public.task_template_kpis FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordenador edita kpis de template" ON public.task_template_kpis FOR ALL USING (is_coordenador());

CREATE POLICY "Todos leem fields de template" ON public.task_fields FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordenador edita fields" ON public.task_fields FOR ALL USING (is_coordenador());

-- Task Instances: Guardião vê as dele, Coordenador vê todas.
CREATE POLICY "Guardião vê suas instâncias, Coordenador vê todas" ON public.task_instances FOR SELECT
  USING (guardiao_id = auth.uid() OR is_coordenador());

CREATE POLICY "Sistema insere instâncias (Coordenador ou Cron)" ON public.task_instances FOR INSERT
  WITH CHECK (true); -- Permitimos inserção pelo sistema

CREATE POLICY "Guardião atuliza sua instância (status), Coordenador todas" ON public.task_instances FOR UPDATE
  USING (guardiao_id = auth.uid() OR is_coordenador());

-- Task Reports & Values
CREATE POLICY "Guardião lê/insere seus reports, Coordenador lê todos" ON public.task_reports FOR SELECT
  USING (guardiao_id = auth.uid() OR is_coordenador());

CREATE POLICY "Guardião insere seus reports" ON public.task_reports FOR INSERT
  WITH CHECK (guardiao_id = auth.uid());

CREATE POLICY "Leitura de valores de fields" ON public.task_field_values FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.task_reports r WHERE r.id = task_report_id AND (r.guardiao_id = auth.uid() OR is_coordenador()))
  );

CREATE POLICY "Inserção de valores" ON public.task_field_values FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.task_reports r WHERE r.id = task_report_id AND r.guardiao_id = auth.uid())
  );

-- Occurrences
CREATE POLICY "Guardião lê/insere suas ocorrências, Coordenador lê todas" ON public.occurrences FOR SELECT
  USING (guardiao_id = auth.uid() OR is_coordenador());

CREATE POLICY "Guardião insere ocorrências" ON public.occurrences FOR INSERT
  WITH CHECK (guardiao_id = auth.uid());

CREATE POLICY "Coordenador atualiza ocorrências (status/comentários)" ON public.occurrences FOR UPDATE
  USING (is_coordenador());

-- Cron Jobs e Procedures

-- Procedure para gerar tasks da semana 
CREATE OR REPLACE FUNCTION public.generate_weekly_tasks()
RETURNS VOID AS $$
DECLARE
  dia_atual TEXT;
  hoje DATE;
  inicio_semana DATE;
  p RECORD;
  tt RECORD;
  t_date DATE;
  dia_idx INT;
  dias_array TEXT[] := ARRAY['dom','seg','ter','qua','qui','sex','sab'];
BEGIN
  hoje := CURRENT_DATE;
  -- data de domingo da semana atual ou algo similar. Vamos gerar para a semana toda (segunda a sexta).
  -- a task é de segunda. Então se rodar na segunda, current_date é segunda.
  
  -- Para cada perfil ativo (guardião)
  FOR p IN SELECT id, setor FROM public.profiles WHERE ativo = true AND perfil = 'guardiao'
  LOOP
    -- Para cada template ativo do setor do guardião ou 'ambos'
    FOR tt IN SELECT id, dias_semana FROM public.task_templates WHERE ativo = true AND (setor = p.setor OR setor = 'ambos')
    LOOP
      -- Criar uma task_instance para cada dia da semana mencionado no array
      FOREACH dia_atual IN ARRAY tt.dias_semana
      LOOP
        -- Calcular qual a data exata daquela semana correspondente ao dia
        -- 'seg' = 1, 'ter' = 2, 'qua' = 3, 'qui' = 4, 'sex' = 5
        CASE dia_atual
          WHEN 'seg' THEN dia_idx := 1;
          WHEN 'ter' THEN dia_idx := 2;
          WHEN 'qua' THEN dia_idx := 3;
          WHEN 'qui' THEN dia_idx := 4;
          WHEN 'sex' THEN dia_idx := 5;
          ELSE dia_idx := 1;
        END CASE;
        
        -- DATE_TRUNC('week', hoje) retorna segunda-feira.
        t_date := (DATE_TRUNC('week', hoje) + (dia_idx - 1) * INTERVAL '1 day')::DATE;
        
        -- Inserir se não existir
        INSERT INTO public.task_instances (task_template_id, guardiao_id, data_referencia, status)
        SELECT tt.id, p.id, t_date, 'pendente'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.task_instances 
          WHERE task_template_id = tt.id AND guardiao_id = p.id AND data_referencia = t_date
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Procedure para marcar atrasadas
CREATE OR REPLACE FUNCTION public.mark_overdue_tasks()
RETURNS VOID AS $$
BEGIN
  UPDATE public.task_instances
  SET status = 'atrasada'
  WHERE status = 'pendente' AND data_referencia < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Para agendar os Cron Jobs no Supabase (Rodar via SQL Editor caso a extensão pg_cron esteja ativa):
-- select cron.schedule('generate_weekly_tasks_job', '0 0 * * 1', 'SELECT public.generate_weekly_tasks()');
-- select cron.schedule('mark_overdue_tasks_job', '1 0 * * *', 'SELECT public.mark_overdue_tasks()');
