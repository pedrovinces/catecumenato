-- Catequese interativa: esquema genérico, reaproveitável para qualquer aula.
-- Projeto Supabase: catequese-interativa (sa-east-1)
-- Toda escrita sensível passa por funções com a chave do apresentador.
-- O gabarito do quiz fica em tabela sem acesso público e só aparece na sala depois de revelado.

create extension if not exists pgcrypto with schema extensions;

-- ---------- tabelas ----------

create table public.config_chave (
  id int primary key default 1 check (id = 1),
  chave_hash text not null
);

create table public.salas (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  aula text not null check (aula ~ '^[a-z0-9-]{2,40}$'),
  slide int not null default 0,
  etapa text not null default 'espera',
  item int not null default 0,
  quiz_ordem int,
  quiz_aberta_em timestamptz,
  quiz_tempo int,
  quiz_revelada boolean not null default false,
  quiz_correta int,
  quiz_valor numeric,
  quiz_comentario text,
  geracao int not null default 0,
  atualizado timestamptz not null default now()
);

create table public.jogadores (
  sala text not null references public.salas(id) on delete cascade,
  aparelho uuid not null,
  apelido text not null,
  foto text,
  cor smallint not null default 0,
  criado timestamptz not null default now(),
  primary key (sala, aparelho)
);

create table public.palavras (
  id bigint generated always as identity primary key,
  sala text not null references public.salas(id) on delete cascade,
  interacao text not null check (length(interacao) <= 40),
  palavra text not null,
  aparelho uuid not null,
  criado timestamptz not null default now()
);

create table public.votos (
  id bigint generated always as identity primary key,
  sala text not null references public.salas(id) on delete cascade,
  interacao text not null check (length(interacao) <= 40),
  item int not null default 0 check (item between 0 and 50),
  opcao int not null check (opcao between 0 and 9),
  aparelho uuid not null,
  criado timestamptz not null default now()
);

create table public.regua (
  id bigint generated always as identity primary key,
  sala text not null references public.salas(id) on delete cascade,
  interacao text not null check (length(interacao) <= 40),
  valor int not null check (valor between 0 and 1000),
  aparelho uuid not null,
  criado timestamptz not null default now()
);

create table public.mapa (
  id bigint generated always as identity primary key,
  sala text not null references public.salas(id) on delete cascade,
  interacao text not null check (length(interacao) <= 40),
  x real not null check (x between 0 and 1),
  y real not null check (y between 0 and 1),
  aparelho uuid not null,
  criado timestamptz not null default now()
);

create table public.toques (
  id bigint generated always as identity primary key,
  sala text not null references public.salas(id) on delete cascade,
  interacao text not null check (length(interacao) <= 40),
  item int not null check (item between 0 and 50),
  aparelho uuid not null,
  criado timestamptz not null default now(),
  unique (sala, interacao, item, aparelho)
);

create table public.mural (
  id bigint generated always as identity primary key,
  sala text not null references public.salas(id) on delete cascade,
  texto text not null,
  aparelho uuid not null,
  aprovada boolean not null default false,
  oculta boolean not null default false,
  respondida boolean not null default false,
  apoios int not null default 0,
  criado timestamptz not null default now()
);

create table public.mural_apoios (
  sala text not null references public.salas(id) on delete cascade,
  mural_id bigint not null references public.mural(id) on delete cascade,
  aparelho uuid not null,
  criado timestamptz not null default now(),
  primary key (mural_id, aparelho)
);

create table public.intencoes (
  id bigint generated always as identity primary key,
  sala text not null references public.salas(id) on delete cascade,
  nome text not null,
  aparelho uuid not null,
  criado timestamptz not null default now()
);

create table public.quiz_perguntas (
  aula text not null,
  ordem int not null,
  tipo text not null default 'multipla' check (tipo in ('multipla', 'numero')),
  texto text not null,
  opcoes jsonb not null default '[]'::jsonb,
  tempo int not null default 20 check (tempo between 5 and 120),
  numero_min int,
  numero_max int,
  primary key (aula, ordem)
);

create table public.quiz_gabarito (
  aula text not null,
  ordem int not null,
  correta int,
  valor numeric,
  comentario text,
  fonte text,
  primary key (aula, ordem),
  foreign key (aula, ordem) references public.quiz_perguntas(aula, ordem) on delete cascade
);

create table public.quiz_respostas (
  sala text not null references public.salas(id) on delete cascade,
  ordem int not null,
  aparelho uuid not null,
  opcao int,
  valor numeric,
  ms int not null,
  pontos int not null default 0,
  criado timestamptz not null default now(),
  primary key (sala, ordem, aparelho)
);

-- roteiro do orador (fala e rubrica por slide): lido somente com a chave, pela função orador_roteiro
create table public.roteiros (
  aula text primary key check (aula ~ '^[a-z0-9-]{2,40}$'),
  dados jsonb not null,
  atualizado timestamptz not null default now()
);

create index on public.palavras (sala, interacao);
create index on public.palavras (aparelho, criado);
create index on public.votos (sala, interacao);
create index on public.votos (aparelho, criado);
create index on public.regua (sala, interacao);
create index on public.regua (aparelho, criado);
create index on public.mapa (sala, interacao, aparelho);
create index on public.mapa (aparelho, criado);
create index on public.toques (aparelho, criado);
create index on public.mural (sala);
create index on public.mural (aparelho, criado);
create index on public.mural_apoios (aparelho, criado);
create index on public.intencoes (sala);
create index on public.intencoes (aparelho, criado);
create index on public.jogadores (sala, criado);

-- ---------- utilitários ----------

create or replace function public._norm(t text) returns text
language sql immutable set search_path = public as $$
  select translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')
$$;

create or replace function public._palavrao(t text) returns boolean
language sql immutable set search_path = public as $$
  select public._norm(t) ~ '(^|[^a-z])(porra|caralho|merda|bosta|foda|fodase|fodasse|puta|puto|putaria|cacete|buceta|boceta|cu|cuzao|viado|veado|fdp|pqp|vsf|tnc|krl|otario|idiota|imbecil|babaca|arrombado|desgraca|desgracado|piroca|pau|rola|corno|vagabundo|vagabunda|safado|safada|xoxota|xereca|retardado|bicha|sapatao|macaco)([^a-z]|$)'
$$;

create or replace function public._chave_ok(p_chave text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.config_chave
    where chave_hash = extensions.crypt(coalesce(p_chave, ''), chave_hash)
  )
$$;

create or replace function public._exigir_chave(p_chave text) returns void
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then
    raise exception 'chave invalida';
  end if;
end $$;

-- ---------- gatilhos de validação, moderação e limite de envio ----------

create or replace function public._antes_palavra() returns trigger
language plpgsql security definer set search_path = public as $$
declare w text := btrim(regexp_replace(coalesce(new.palavra, ''), '\s+', ' ', 'g'));
begin
  if length(w) < 2 or length(w) > 24 then raise exception 'tamanho invalido'; end if;
  if w ~ '[0-9@/]' or w ~* '(http|www)' then raise exception 'palavra nao aceita'; end if;
  if array_length(string_to_array(w, ' '), 1) > 3 then raise exception 'palavra nao aceita'; end if;
  if public._palavrao(w) then raise exception 'palavra nao aceita'; end if;
  if (select count(*) from public.palavras where aparelho = new.aparelho and criado > now() - interval '1 minute') >= 12 then
    raise exception 'muitos envios';
  end if;
  new.palavra := w;
  new.criado := now();
  return new;
end $$;

create or replace function public._limite_generico() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; lim int := coalesce(nullif(TG_ARGV[0], '')::int, 30);
begin
  execute format('select count(*) from public.%I where aparelho = $1 and criado > now() - interval ''1 minute''', TG_TABLE_NAME)
    into n using new.aparelho;
  if n >= lim then raise exception 'muitos envios'; end if;
  new.criado := now();
  return new;
end $$;

create or replace function public._antes_mapa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.mapa where sala = new.sala and interacao = new.interacao and aparelho = new.aparelho) >= 3 then
    raise exception 'limite de toques';
  end if;
  return new;
end $$;

create or replace function public._antes_mural() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text := btrim(regexp_replace(coalesce(new.texto, ''), '\s+', ' ', 'g'));
begin
  if length(t) < 5 or length(t) > 240 then raise exception 'tamanho invalido'; end if;
  if t ~* '(http|www\.|://)' then raise exception 'texto nao aceito'; end if;
  if public._palavrao(t) then raise exception 'texto nao aceito'; end if;
  if (select count(*) from public.mural where aparelho = new.aparelho and criado > now() - interval '1 minute') >= 4 then
    raise exception 'muitos envios';
  end if;
  new.texto := t;
  new.aprovada := false; new.oculta := false; new.respondida := false; new.apoios := 0;
  new.criado := now();
  return new;
end $$;

create or replace function public._antes_intencao() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text := btrim(regexp_replace(coalesce(new.nome, ''), '\s+', ' ', 'g'));
begin
  if length(t) < 2 or length(t) > 30 then raise exception 'tamanho invalido'; end if;
  if public._norm(t) !~ '^[a-z'' -]+$' then raise exception 'use somente letras'; end if;
  if array_length(string_to_array(t, ' '), 1) > 3 then raise exception 'texto nao aceito'; end if;
  if public._palavrao(t) then raise exception 'texto nao aceito'; end if;
  if (select count(*) from public.intencoes where aparelho = new.aparelho and criado > now() - interval '1 minute') >= 6 then
    raise exception 'muitos envios';
  end if;
  new.nome := t;
  new.criado := now();
  return new;
end $$;

create or replace function public._depois_apoio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.mural set apoios = apoios + 1 where id = new.mural_id;
  return new;
end $$;

create trigger t_palavra before insert on public.palavras for each row execute function public._antes_palavra();
create trigger t_votos before insert on public.votos for each row execute function public._limite_generico('40');
create trigger t_regua before insert on public.regua for each row execute function public._limite_generico('30');
create trigger t_mapa_lim before insert on public.mapa for each row execute function public._limite_generico('20');
create trigger t_mapa before insert on public.mapa for each row execute function public._antes_mapa();
create trigger t_toques before insert on public.toques for each row execute function public._limite_generico('40');
create trigger t_mural before insert on public.mural for each row execute function public._antes_mural();
create trigger t_apoio_lim before insert on public.mural_apoios for each row execute function public._limite_generico('30');
create trigger t_apoio after insert on public.mural_apoios for each row execute function public._depois_apoio();
create trigger t_intencao before insert on public.intencoes for each row execute function public._antes_intencao();

-- ---------- funções públicas (celular e telão) ----------

create or replace function public.agora() returns timestamptz
language sql stable set search_path = public as $$ select now() $$;

create or replace function public.chave_valida(p_chave text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select public._chave_ok(p_chave)
$$;

create or replace function public.jogador_entrar(p_sala text, p_aparelho uuid, p_apelido text, p_foto text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  a text := btrim(regexp_replace(coalesce(p_apelido, ''), '\s+', ' ', 'g'));
  base text; k int := 1; v_cor int;
begin
  if not exists (select 1 from public.salas where id = p_sala) then
    return jsonb_build_object('ok', false, 'erro', 'O encontro ainda não começou. Aguarde o início.');
  end if;
  if length(a) < 2 or length(a) > 16 then
    return jsonb_build_object('ok', false, 'erro', 'Use de 2 a 16 caracteres.');
  end if;
  if public._norm(a) !~ '^[a-z0-9 ''.-]+$' then
    return jsonb_build_object('ok', false, 'erro', 'Use letras e números.');
  end if;
  if public._palavrao(a) then
    return jsonb_build_object('ok', false, 'erro', 'Apelido não aceito.');
  end if;
  if p_foto is null or p_foto = '' then
    return jsonb_build_object('ok', false, 'erro', 'Tire a selfie para entrar: é ela que identifica você no telão.');
  end if;
  if p_foto not like 'data:image/jpeg;base64,%' or length(p_foto) > 70000 then
    return jsonb_build_object('ok', false, 'erro', 'Foto inválida. Tente outra.');
  end if;

  base := a;
  while exists (select 1 from public.jogadores where sala = p_sala and lower(apelido) = lower(a) and aparelho <> p_aparelho) loop
    k := k + 1; a := left(base, 13) || ' ' || k;
  end loop;

  if exists (select 1 from public.jogadores where sala = p_sala and aparelho = p_aparelho) then
    update public.jogadores set apelido = a, foto = p_foto where sala = p_sala and aparelho = p_aparelho returning cor into v_cor;
  else
    if (select count(*) from public.jogadores where sala = p_sala) >= 400 then
      return jsonb_build_object('ok', false, 'erro', 'Sala cheia.');
    end if;
    if (select count(*) from public.jogadores where sala = p_sala and criado > now() - interval '10 seconds') >= 40 then
      return jsonb_build_object('ok', false, 'erro', 'Muitas entradas ao mesmo tempo. Tente de novo em instantes.');
    end if;
    v_cor := (select count(*) from public.jogadores where sala = p_sala) % 8;
    insert into public.jogadores (sala, aparelho, apelido, foto, cor) values (p_sala, p_aparelho, a, p_foto, v_cor);
  end if;
  return jsonb_build_object('ok', true, 'apelido', a, 'cor', v_cor);
end $$;

create or replace function public.quiz_responder(p_sala text, p_aparelho uuid, p_opcao int, p_valor numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.salas; q public.quiz_perguntas; g public.quiz_gabarito;
  v_ms int; v_pts int := 0; n int;
begin
  select * into s from public.salas where id = p_sala;
  if s.id is null or s.etapa <> 'quiz' or s.quiz_ordem is null or s.quiz_aberta_em is null or s.quiz_revelada then
    return jsonb_build_object('ok', false, 'erro', 'fechada');
  end if;
  if now() > s.quiz_aberta_em + make_interval(secs => s.quiz_tempo + 1.5) then
    return jsonb_build_object('ok', false, 'erro', 'tempo');
  end if;
  if not exists (select 1 from public.jogadores where sala = p_sala and aparelho = p_aparelho) then
    return jsonb_build_object('ok', false, 'erro', 'cadastro');
  end if;
  select * into q from public.quiz_perguntas where aula = s.aula and ordem = s.quiz_ordem;
  select * into g from public.quiz_gabarito where aula = s.aula and ordem = s.quiz_ordem;
  v_ms := least(greatest(0, (extract(epoch from (now() - s.quiz_aberta_em)) * 1000)::int), s.quiz_tempo * 1000);
  if q.tipo = 'multipla' then
    if p_opcao is null or p_opcao < 0 or p_opcao >= jsonb_array_length(q.opcoes) then
      return jsonb_build_object('ok', false, 'erro', 'opcao');
    end if;
    if p_opcao = g.correta then
      v_pts := greatest(500, round(1000 * (1 - 0.5 * v_ms::numeric / (s.quiz_tempo * 1000)))::int);
    end if;
  else
    if p_valor is null then return jsonb_build_object('ok', false, 'erro', 'valor'); end if;
  end if;
  insert into public.quiz_respostas (sala, ordem, aparelho, opcao, valor, ms, pontos)
  values (p_sala, s.quiz_ordem, p_aparelho, p_opcao, p_valor, v_ms, v_pts)
  on conflict do nothing;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n = 1, 'repetida', n = 0);
end $$;

create or replace function public.quiz_painel(p_sala text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.salas; q public.quiz_perguntas; v jsonb; c jsonb := null; n int;
begin
  select * into s from public.salas where id = p_sala;
  if s.id is null or s.quiz_ordem is null then return jsonb_build_object('respostas', 0); end if;
  select * into q from public.quiz_perguntas where aula = s.aula and ordem = s.quiz_ordem;
  select count(*) into n from public.quiz_respostas where sala = p_sala and ordem = s.quiz_ordem;
  if s.quiz_revelada and q.tipo = 'multipla' then
    select jsonb_agg(cnt order by i) into c from (
      select i, (select count(*) from public.quiz_respostas r where r.sala = p_sala and r.ordem = s.quiz_ordem and r.opcao = i) cnt
      from generate_series(0, jsonb_array_length(q.opcoes) - 1) i
    ) x;
  end if;
  return jsonb_build_object('ordem', s.quiz_ordem, 'respostas', n, 'contagem', c,
    'jogadores', (select count(*) from public.jogadores where sala = p_sala));
end $$;

create or replace function public.ranking(p_sala text, p_limite int default 10)
returns table (posicao int, aparelho uuid, apelido text, foto text, cor int,
               pontos_quiz int, bonus int, total int, acertos int, distancia numeric, ms_total int)
language sql stable security definer set search_path = public as $$
  with s as (select * from public.salas where id = p_sala),
  part as (
    select u.aparelho, count(distinct u.k) n from (
      select aparelho, 'p:' || interacao k from public.palavras where sala = p_sala
      union all select aparelho, 'v:' || interacao from public.votos where sala = p_sala
      union all select aparelho, 'r:' || interacao from public.regua where sala = p_sala
      union all select aparelho, 'm:' || interacao from public.mapa where sala = p_sala
      union all select aparelho, 't:' || interacao from public.toques where sala = p_sala
    ) u group by u.aparelho
  ),
  qz as (
    select r.aparelho,
      sum(r.pontos)::int pts,
      (count(*) filter (where r.pontos > 0))::int acertos,
      coalesce(sum(r.ms) filter (where r.pontos > 0), 0)::int ms_total,
      min(abs(r.valor - g.valor)) filter (where q.tipo = 'numero') dist
    from public.quiz_respostas r
    cross join s
    join public.quiz_perguntas q on q.aula = s.aula and q.ordem = r.ordem
    left join public.quiz_gabarito g on g.aula = s.aula and g.ordem = r.ordem
    where r.sala = p_sala
      and not coalesce(r.ordem = s.quiz_ordem and not s.quiz_revelada, false)
    group by r.aparelho
  ),
  base as (
    select j.aparelho, j.apelido, j.foto, j.cor::int cor,
      coalesce(qz.pts, 0) pq, coalesce(part.n, 0)::int * 50 bonus,
      coalesce(qz.acertos, 0) acertos, qz.dist, coalesce(qz.ms_total, 0) ms
    from public.jogadores j
    left join qz on qz.aparelho = j.aparelho
    left join part on part.aparelho = j.aparelho
    where j.sala = p_sala
  )
  select (row_number() over (order by pq + bonus desc, dist asc nulls last, ms asc, apelido))::int,
    aparelho, apelido, foto, cor, pq, bonus, pq + bonus, acertos, dist, ms
  from base
  order by 1
  limit coalesce(p_limite, 10)
$$;

create or replace function public.meu_placar(p_sala text, p_aparelho uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.salas; r record; n int; ult int; resp boolean;
begin
  select * into s from public.salas where id = p_sala;
  select * into r from public.ranking(p_sala, 100000) x where x.aparelho = p_aparelho;
  select count(*) into n from public.jogadores where sala = p_sala;
  if s.quiz_ordem is not null then
    select pontos into ult from public.quiz_respostas where sala = p_sala and ordem = s.quiz_ordem and aparelho = p_aparelho;
    resp := found;
  end if;
  return jsonb_build_object(
    'posicao', r.posicao, 'total', coalesce(r.total, 0), 'bonus', coalesce(r.bonus, 0),
    'acertos', coalesce(r.acertos, 0), 'jogadores', n,
    'respondeu', coalesce(resp, false),
    'ultima', case when s.quiz_revelada then ult else null end);
end $$;

-- ---------- funções do apresentador (exigem a chave) ----------

create or replace function public.sala_garantir(p_chave text, p_sala text, p_aula text) returns public.salas
language plpgsql security definer set search_path = public, extensions as $$
declare r public.salas;
begin
  perform public._exigir_chave(p_chave);
  insert into public.salas (id, aula) values (p_sala, p_aula)
  on conflict (id) do update set aula = excluded.aula
  returning * into r;
  return r;
end $$;

create or replace function public.mudar(p_chave text, p_sala text, p_slide int, p_etapa text, p_item int) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  update public.salas set
    slide = coalesce(p_slide, slide),
    etapa = coalesce(p_etapa, etapa),
    item = coalesce(p_item, item),
    atualizado = now()
  where id = p_sala;
end $$;

create or replace function public.quiz_preparar(p_chave text, p_sala text, p_ordem int, p_slide int) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  update public.salas s set
    etapa = 'quiz', slide = coalesce(p_slide, s.slide), item = 0,
    quiz_ordem = p_ordem, quiz_aberta_em = null,
    quiz_tempo = (select q.tempo from public.quiz_perguntas q where q.aula = s.aula and q.ordem = p_ordem),
    quiz_revelada = false, quiz_correta = null, quiz_valor = null, quiz_comentario = null,
    atualizado = now()
  where s.id = p_sala;
end $$;

create or replace function public.quiz_abrir(p_chave text, p_sala text) returns timestamptz
language plpgsql security definer set search_path = public, extensions as $$
declare t timestamptz := now();
begin
  perform public._exigir_chave(p_chave);
  update public.salas set quiz_aberta_em = t, quiz_revelada = false, atualizado = t
  where id = p_sala and quiz_ordem is not null;
  return t;
end $$;

create or replace function public.quiz_revelar(p_chave text, p_sala text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare g public.quiz_gabarito;
begin
  perform public._exigir_chave(p_chave);
  select gb.* into g from public.quiz_gabarito gb join public.salas s on s.aula = gb.aula and s.quiz_ordem = gb.ordem where s.id = p_sala;
  update public.salas set quiz_revelada = true, quiz_correta = g.correta, quiz_valor = g.valor,
    quiz_comentario = g.comentario, atualizado = now()
  where id = p_sala;
  return jsonb_build_object('correta', g.correta, 'valor', g.valor, 'comentario', g.comentario, 'fonte', g.fonte);
end $$;

create or replace function public.mural_pendentes(p_chave text, p_sala text) returns setof public.mural
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  return query select * from public.mural where sala = p_sala order by criado desc limit 300;
end $$;

create or replace function public.mural_moderar(p_chave text, p_id bigint, p_acao text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  if p_acao = 'aprovar' then
    update public.mural set aprovada = true, oculta = false where id = p_id;
  elsif p_acao = 'ocultar' then
    update public.mural set oculta = true where id = p_id;
  elsif p_acao = 'respondida' then
    update public.mural set respondida = not respondida where id = p_id;
  else
    raise exception 'acao invalida';
  end if;
end $$;

create or replace function public.sala_limpar(p_chave text, p_sala text) returns text
language plpgsql security definer set search_path = public, extensions as $$
-- Recomeça a sala sem apagar linhas: os dados vão para uma sala de arquivo e as fotos são descartadas.
-- A geração sobe uma unidade: telão, painel e celulares abertos percebem e recomeçam sozinhos.
declare arq text := left(p_sala, 20) || '-arq-' || to_char(now(), 'YYYYMMDDHH24MISS');
begin
  perform public._exigir_chave(p_chave);
  insert into public.salas (id, aula, etapa) select arq, aula, 'arquivada' from public.salas where id = p_sala;
  update public.jogadores set foto = null, sala = arq where sala = p_sala;
  update public.palavras set sala = arq where sala = p_sala;
  update public.votos set sala = arq where sala = p_sala;
  update public.regua set sala = arq where sala = p_sala;
  update public.mapa set sala = arq where sala = p_sala;
  update public.toques set sala = arq where sala = p_sala;
  update public.mural_apoios set sala = arq where sala = p_sala;
  update public.mural set sala = arq where sala = p_sala;
  update public.quiz_respostas set sala = arq where sala = p_sala;
  update public.intencoes set nome = '', sala = arq where sala = p_sala;
  update public.salas set slide = 0, etapa = 'espera', item = 0, quiz_ordem = null, quiz_aberta_em = null,
    quiz_revelada = false, quiz_correta = null, quiz_valor = null, quiz_comentario = null,
    geracao = geracao + 1, atualizado = now()
  where id = p_sala;
  return arq;
end $$;

create or replace function public.sala_encerrar(p_chave text, p_sala text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
-- Fim do encontro: descarta as selfies e sobrescreve os nomes das intenções.
declare f int; i int;
begin
  perform public._exigir_chave(p_chave);
  update public.jogadores set foto = null where sala = p_sala and foto is not null;
  get diagnostics f = row_count;
  update public.intencoes set nome = '' where sala = p_sala and nome <> '';
  get diagnostics i = row_count;
  return jsonb_build_object('fotos_apagadas', f, 'intencoes_apagadas', i);
end $$;

-- comando remoto do painel do apresentador para o telão
alter table public.salas add column if not exists comando text;
alter table public.salas add column if not exists comando_seq int not null default 0;

create or replace function public.comandar(p_chave text, p_sala text, p_comando text) returns int
language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  perform public._exigir_chave(p_chave);
  if p_comando !~ '^(avancar|voltar|ir:[0-9]{1,3}|qr|recarregar|teste|musica|preto|mudo:[01]|volume:[0-9]{1,3}|ajuste:[0-9]{2,3}:-?[0-9]{1,2}:-?[0-9]{1,2}|quiz:(abrir|revelar)|passagem:([0-9]{1,2}|fechar)|formato:(auto|169|43|43c))$' then
    raise exception 'comando invalido';
  end if;
  update public.salas set comando = p_comando, comando_seq = comando_seq + 1, atualizado = now()
  where id = p_sala returning comando_seq into n;
  return n;
end $$;

-- ---------- pulso do telão: reserva para quando a presença em tempo real falhar ----------

create table public.palco_estado (
  sala text primary key references public.salas(id) on delete cascade,
  meta jsonb not null default '{}'::jsonb,
  visto timestamptz not null default now()
);

create or replace function public.palco_pulso(p_chave text, p_sala text, p_meta jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  if p_meta is null or length(p_meta::text) > 4000 then raise exception 'meta invalida'; end if;
  insert into public.palco_estado (sala, meta, visto) values (p_sala, p_meta, now())
  on conflict (sala) do update set meta = excluded.meta, visto = now();
end $$;

create or replace function public.orador_estado(p_chave text, p_sala text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  return (select jsonb_build_object('meta', e.meta, 'visto', e.visto, 'agora', now()) from public.palco_estado e where e.sala = p_sala);
end $$;

-- ---------- painel do orador (exigem a chave) ----------

create or replace function public.orador_roteiro(p_chave text, p_aula text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  return (select r.dados from public.roteiros r where r.aula = p_aula);
end $$;

create or replace function public.orador_gabarito(p_chave text, p_aula text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  perform public._exigir_chave(p_chave);
  return coalesce((select jsonb_agg(jsonb_build_object('ordem', g.ordem, 'correta', g.correta, 'valor', g.valor,
      'comentario', g.comentario, 'fonte', g.fonte) order by g.ordem)
    from public.quiz_gabarito g where g.aula = p_aula), '[]'::jsonb);
end $$;

/* respostas da pergunta da vez (com acerto), placar ao vivo incluindo a pergunta em andamento e acerto por pergunta */
create or replace function public.orador_monitor(p_chave text, p_sala text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  s public.salas; q public.quiz_perguntas; g public.quiz_gabarito;
  v_resp jsonb := '[]'::jsonb; v_rank jsonb; v_hist jsonb; n int;
begin
  perform public._exigir_chave(p_chave);
  select * into s from public.salas where id = p_sala;
  if s.id is null then return null; end if;
  select count(*) into n from public.jogadores where sala = p_sala;
  if s.quiz_ordem is not null then
    select * into q from public.quiz_perguntas where aula = s.aula and ordem = s.quiz_ordem;
    select * into g from public.quiz_gabarito where aula = s.aula and ordem = s.quiz_ordem;
    select coalesce(jsonb_agg(jsonb_build_object('a', r.aparelho, 'o', r.opcao, 'v', r.valor, 'ms', r.ms, 'pts', r.pontos,
        'ok', case when q.tipo = 'multipla' then r.opcao = g.correta else r.valor = g.valor end) order by r.criado), '[]'::jsonb)
      into v_resp from public.quiz_respostas r where r.sala = p_sala and r.ordem = s.quiz_ordem;
  end if;

  with part as (
    select u.aparelho, count(distinct u.k) n from (
      select aparelho, 'p:' || interacao k from public.palavras where sala = p_sala
      union all select aparelho, 'v:' || interacao from public.votos where sala = p_sala
      union all select aparelho, 'r:' || interacao from public.regua where sala = p_sala
      union all select aparelho, 'm:' || interacao from public.mapa where sala = p_sala
      union all select aparelho, 't:' || interacao from public.toques where sala = p_sala
    ) u group by u.aparelho
  ),
  qz as (
    select r.aparelho, sum(r.pontos)::int pts,
      (count(*) filter (where r.pontos > 0))::int acertos,
      (count(*) filter (where qq.tipo = 'multipla'))::int respondidas,
      coalesce(sum(r.ms) filter (where r.pontos > 0), 0)::int ms,
      min(abs(r.valor - gg.valor)) filter (where qq.tipo = 'numero') dist
    from public.quiz_respostas r
    join public.quiz_perguntas qq on qq.aula = s.aula and qq.ordem = r.ordem
    left join public.quiz_gabarito gg on gg.aula = s.aula and gg.ordem = r.ordem
    where r.sala = p_sala
    group by r.aparelho
  ),
  base as (
    select j.aparelho, j.apelido, j.cor::int cor, coalesce(qz.pts, 0) pq, coalesce(part.n, 0)::int * 50 bonus,
      coalesce(qz.acertos, 0) acertos, coalesce(qz.respondidas, 0) respondidas, qz.dist, coalesce(qz.ms, 0) ms
    from public.jogadores j
    left join qz on qz.aparelho = j.aparelho
    left join part on part.aparelho = j.aparelho
    where j.sala = p_sala
  ),
  ord as (
    select row_number() over (order by pq + bonus desc, dist asc nulls last, ms asc, apelido)::int pos, * from base
  )
  select coalesce(jsonb_agg(jsonb_build_object('pos', pos, 'a', aparelho, 'apelido', apelido, 'cor', cor,
      'total', pq + bonus, 'quiz', pq, 'bonus', bonus, 'acertos', acertos, 'respondidas', respondidas, 'dist', dist) order by pos), '[]'::jsonb)
    into v_rank from ord where pos <= 12;

  select coalesce(jsonb_agg(jsonb_build_object('ordem', h.ordem, 'n', h.n, 'ok', h.ok) order by h.ordem), '[]'::jsonb)
    into v_hist
    from (select r.ordem, count(*)::int n, (count(*) filter (where r.pontos > 0))::int ok
          from public.quiz_respostas r where r.sala = p_sala group by r.ordem) h;

  return jsonb_build_object('ordem', s.quiz_ordem, 'tipo', q.tipo, 'correta', g.correta, 'valor', g.valor,
    'comentario', g.comentario, 'fonte', g.fonte, 'aberta_em', s.quiz_aberta_em, 'tempo', s.quiz_tempo,
    'revelada', s.quiz_revelada, 'jogadores', n, 'respostas', v_resp, 'ranking', v_rank, 'historico', v_hist);
end $$;

-- ---------- segurança por linha ----------

alter table public.config_chave enable row level security;
alter table public.salas enable row level security;
alter table public.jogadores enable row level security;
alter table public.palavras enable row level security;
alter table public.votos enable row level security;
alter table public.regua enable row level security;
alter table public.mapa enable row level security;
alter table public.toques enable row level security;
alter table public.mural enable row level security;
alter table public.mural_apoios enable row level security;
alter table public.intencoes enable row level security;
alter table public.quiz_perguntas enable row level security;
alter table public.quiz_gabarito enable row level security;
alter table public.quiz_respostas enable row level security;
alter table public.roteiros enable row level security;
alter table public.palco_estado enable row level security;

create policy ler on public.salas for select to anon, authenticated using (true);
create policy ler on public.jogadores for select to anon, authenticated using (true);
create policy ler on public.quiz_perguntas for select to anon, authenticated using (true);

create policy ler on public.palavras for select to anon, authenticated using (true);
create policy enviar on public.palavras for insert to anon, authenticated with check (true);
create policy ler on public.votos for select to anon, authenticated using (true);
create policy enviar on public.votos for insert to anon, authenticated with check (true);
create policy ler on public.regua for select to anon, authenticated using (true);
create policy enviar on public.regua for insert to anon, authenticated with check (true);
create policy ler on public.mapa for select to anon, authenticated using (true);
create policy enviar on public.mapa for insert to anon, authenticated with check (true);
create policy ler on public.toques for select to anon, authenticated using (true);
create policy enviar on public.toques for insert to anon, authenticated with check (true);

create policy ler on public.mural for select to anon, authenticated using (aprovada and not oculta);
create policy enviar on public.mural for insert to anon, authenticated
  with check (not aprovada and not oculta and not respondida and apoios = 0);
create policy ler on public.mural_apoios for select to anon, authenticated using (true);
create policy enviar on public.mural_apoios for insert to anon, authenticated
  with check (exists (select 1 from public.mural m where m.id = mural_id and m.aprovada and not m.oculta));

create policy ler on public.intencoes for select to anon, authenticated using (criado > now() - interval '8 hours');
create policy enviar on public.intencoes for insert to anon, authenticated with check (true);

-- ---------- privilégios ----------
-- As regras de linha acima são o controle principal; os privilégios abaixo são a segunda camada.

revoke update, truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert on public.salas, public.jogadores, public.quiz_perguntas, public.quiz_gabarito, public.quiz_respostas, public.config_chave from anon, authenticated;
revoke select on public.quiz_gabarito, public.quiz_respostas, public.config_chave from anon, authenticated;
revoke all on public.roteiros, public.palco_estado from anon, authenticated;
revoke execute on function public._chave_ok(text), public._exigir_chave(text),
  public._antes_palavra(), public._limite_generico(), public._antes_mapa(), public._antes_mural(),
  public._antes_intencao(), public._depois_apoio(), public._norm(text), public._palavrao(text)
from public, anon, authenticated;

-- chave do apresentador (troque o texto e rode uma vez):
-- insert into public.config_chave (id, chave_hash) values (1, extensions.crypt('NOVA-CHAVE', extensions.gen_salt('bf', 8)))
-- on conflict (id) do update set chave_hash = excluded.chave_hash;

-- ---------- tempo real ----------

alter publication supabase_realtime add table
  public.salas, public.jogadores, public.palavras, public.votos, public.regua,
  public.mapa, public.toques, public.mural, public.intencoes;
