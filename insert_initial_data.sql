-- Exército da Eficiência - População de Dados Iniciais (KPIs e Templates)

DO $$ 
DECLARE
  -- UUIDs KPIs Copy
  kpi_adiantada UUID := gen_random_uuid();
  kpi_prazo UUID := gen_random_uuid();
  kpi_atrasada UUID := gen_random_uuid();
  kpi_overdelivery UUID := gen_random_uuid();
  kpi_atrasos_prev UUID := gen_random_uuid();
  kpi_3_prazos UUID := gen_random_uuid();
  
  -- UUIDs KPIs Mentor
  kpi_atraso_processo UUID := gen_random_uuid();
  
  -- Variáveis auxiliares para Templates e Intermediárias
  t_id UUID;
  ttk_id UUID;
BEGIN

  ----------------------------------------------------------------------
  -- 1. KPIs
  ----------------------------------------------------------------------
  -- Copy
  INSERT INTO public.kpis (id, nome, unidade, setor, consolidacao, meta) VALUES
  (kpi_adiantada, 'Entregas Adiantadas', 'unidades', 'copy', 'soma', 0),
  (kpi_prazo, 'Entregas no Prazo Máximo', 'unidades', 'copy', 'soma', 0),
  (kpi_atrasada, 'Entregas Atrasadas', 'unidades', 'copy', 'soma', 0),
  (kpi_overdelivery, 'Overdeliverys Realizados', 'unidades', 'copy', 'soma', 0),
  (kpi_atrasos_prev, 'Atrasos Previstos na Semana', 'unidades', 'copy', 'soma', 0),
  (kpi_3_prazos, 'Clientes com 3 ou mais Prazos no Mesmo Dia', 'clientes', 'copy', 'soma', 0);
  
  -- Mentor
  INSERT INTO public.kpis (id, nome, unidade, setor, consolidacao, meta) VALUES
  (kpi_atraso_processo, 'Atraso de Processo', 'ocorrências', 'mentor', 'soma', 0);


  ----------------------------------------------------------------------
  -- 2. TEMPLATES COPY
  ----------------------------------------------------------------------

  -- 2.1 Roteiros em atraso e que vencem hoje
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Roteiros em atraso e que vencem hoje', 'copy', ARRAY['seg','ter','qua','qui','sex']);
  
  -- Link: Entregas Adiantadas
  ttk_id := gen_random_uuid();
  INSERT INTO public.task_template_kpis(id, task_template_id, kpi_id) VALUES (ttk_id, t_id, kpi_adiantada);
  INSERT INTO public.task_fields(task_template_kpi_id, nome, tipo, obrigatorio, ordem) 
  VALUES (ttk_id, 'Entregas adiantadas', 'inteiro', true, 1);
  
  -- Link: Entregas no Prazo Máximo
  ttk_id := gen_random_uuid();
  INSERT INTO public.task_template_kpis(id, task_template_id, kpi_id) VALUES (ttk_id, t_id, kpi_prazo);
  INSERT INTO public.task_fields(task_template_kpi_id, nome, tipo, obrigatorio, ordem) 
  VALUES (ttk_id, 'Entregas no prazo máximo', 'inteiro', true, 2);

  -- Link: Entregas Atrasadas
  ttk_id := gen_random_uuid();
  INSERT INTO public.task_template_kpis(id, task_template_id, kpi_id) VALUES (ttk_id, t_id, kpi_atrasada);
  INSERT INTO public.task_fields(task_template_kpi_id, nome, tipo, obrigatorio, ordem) 
  VALUES (ttk_id, 'Entregas atrasadas', 'inteiro', true, 3);
  
  -- Link: Overdeliverys Realizados
  ttk_id := gen_random_uuid();
  INSERT INTO public.task_template_kpis(id, task_template_id, kpi_id) VALUES (ttk_id, t_id, kpi_overdelivery);
  INSERT INTO public.task_fields(task_template_kpi_id, nome, tipo, obrigatorio, ordem) 
  VALUES (ttk_id, 'Overdeliverys feitos', 'inteiro', true, 4);

  -- 2.2 Atrasos previstos e acúmulo de prazo
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Atrasos previstos e acúmulo de prazo', 'copy', ARRAY['seg']);
  
  -- Link: Atrasos Previstos na Semana
  ttk_id := gen_random_uuid();
  INSERT INTO public.task_template_kpis(id, task_template_id, kpi_id) VALUES (ttk_id, t_id, kpi_atrasos_prev);
  INSERT INTO public.task_fields(task_template_kpi_id, nome, tipo, obrigatorio, ordem) 
  VALUES (ttk_id, 'Atrasos previstos na semana', 'inteiro', true, 1);

  -- Link: Clientes com 3 ou mais Prazos no Mesmo Dia
  ttk_id := gen_random_uuid();
  INSERT INTO public.task_template_kpis(id, task_template_id, kpi_id) VALUES (ttk_id, t_id, kpi_3_prazos);
  INSERT INTO public.task_fields(task_template_kpi_id, nome, tipo, obrigatorio, ordem) 
  VALUES (ttk_id, 'Clientes com 3 ou mais prazos no mesmo dia', 'inteiro', true, 2);

  -- 2.3 Mentorados no mesmo dia (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Mentorados no mesmo dia', 'copy', ARRAY['seg']);

  -- 2.4 Gestão de Overdelivery (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Gestão de Overdelivery', 'copy', ARRAY['seg']);

  -- 2.5 Check de entrega antes das 18h (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Check de entrega antes das 18h', 'copy', ARRAY['ter','qua','qui']);

  -- 2.6 Follow-Up de Overdelivery (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Follow-Up de Overdelivery', 'copy', ARRAY['qui']);

  -- 2.7 Mentorados na aba de produção (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Mentorados na aba de produção', 'copy', ARRAY['sex']);


  ----------------------------------------------------------------------
  -- 3. TEMPLATES MENTOR
  ----------------------------------------------------------------------

  -- 3.1 Gestão de Overdelivery
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Gestão de Overdelivery', 'mentor', ARRAY['seg']);
  
  -- Link: Atraso de Processo
  ttk_id := gen_random_uuid();
  INSERT INTO public.task_template_kpis(id, task_template_id, kpi_id) VALUES (ttk_id, t_id, kpi_atraso_processo);
  INSERT INTO public.task_fields(task_template_kpi_id, nome, tipo, obrigatorio, ordem) 
  VALUES (ttk_id, 'Atraso de processo', 'inteiro', true, 1);

  -- 3.2 Cobrar Check de Verificação de Carteira (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Cobrar Check de Verificação de Carteira', 'mentor', ARRAY['seg','qui']);

  -- 3.3 Check de Gravação e Edição (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Check de Gravação e Edição', 'mentor', ARRAY['seg','qui']);

  -- 3.4 Garantia de Pré-Call e Pós-call (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Garantia de Pré-Call e Pós-call', 'mentor', ARRAY['seg','qua','sex']);

  -- 3.5 Check de Mentorados na Etapa de Loop (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Check de Mentorados na Etapa de Loop', 'mentor', ARRAY['ter','qui']);

  -- 3.6 Auditar 5 de cada membro (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Auditar 5 de cada membro', 'mentor', ARRAY['ter','sex']);

  -- 3.7 Follow-Up se Subiu (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Follow-Up se Subiu', 'mentor', ARRAY['ter','sex']);

  -- 3.8 Follow-Up de Overdelivery (sem KPI)
  t_id := gen_random_uuid();
  INSERT INTO public.task_templates (id, nome, setor, dias_semana)
  VALUES (t_id, 'Follow-Up de Overdelivery', 'mentor', ARRAY['qui']);

END $$;
