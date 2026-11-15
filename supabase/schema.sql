-- =====================================================================
-- ZIKRA (ذِكرى) — قاعدة البيانات الكاملة
-- شغّل هذا الملف كاملاً مرة واحدة في Supabase → SQL Editor (مشروع جديد).
-- المبدأ: RLS مفعّل على كل الجداول بدون أي policy، وكل الوصول عبر دوال RPC.
-- الدخول مخصص (اسم مستخدم + كلمة مرور) ولا يعتمد على Supabase Auth.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1) الجداول
-- ---------------------------------------------------------------------

create table public.app_users (
  id                uuid primary key default gen_random_uuid(),
  username          text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  password_hash     text not null,
  display_name      text not null check (char_length(display_name) between 2 and 32),
  avatar_id         text not null default 'avatar_01' check (avatar_id ~ '^avatar_(0[1-9]|1[0-2])$'),
  role              text not null default 'user' check (role in ('user','admin')),
  terms_accepted_at timestamptz,
  created_at        timestamptz not null default now()
);

create table public.app_sessions (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index app_sessions_user_idx on public.app_sessions(user_id, created_at desc);

create table public.rate_events (
  id         bigserial primary key,
  key        text not null,
  created_at timestamptz not null default now()
);
create index rate_events_key_idx on public.rate_events(key, created_at desc);

create table public.legal_documents (
  id            uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('terms','privacy')),
  version       text not null,
  content       text not null,
  status        text not null default 'published' check (status in ('draft','published','archived')),
  created_at    timestamptz not null default now()
);

create table public.rooms (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid not null references public.app_users(id) on delete cascade,
  name                      text not null check (char_length(name) between 2 and 60),
  description               text not null default '' check (char_length(description) <= 500),
  allow_anonymous_comments  boolean not null default false,
  join_code_hash            text not null unique,
  is_archived               boolean not null default false,
  created_at                timestamptz not null default now()
);

create table public.room_members (
  room_id   uuid not null references public.rooms(id) on delete cascade,
  user_id   uuid not null references public.app_users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','moderator','member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index room_members_user_idx on public.room_members(user_id);

create table public.room_join_requests (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  user_id     uuid not null references public.app_users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at  timestamptz not null default now(),
  reviewed_by uuid references public.app_users(id) on delete set null,
  reviewed_at timestamptz
);
create unique index room_join_requests_pending_uq
  on public.room_join_requests(room_id, user_id) where status = 'pending';
create index room_join_requests_user_idx on public.room_join_requests(user_id, created_at desc);

create table public.memories (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  author_id   uuid not null references public.app_users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 2900),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index memories_room_idx on public.memories(room_id, created_at desc) where deleted_at is null;

create table public.memory_media (
  id          uuid primary key default gen_random_uuid(),
  memory_id   uuid not null references public.memories(id) on delete cascade,
  path        text not null unique,
  thumb_path  text not null unique,
  width       integer not null check (width between 1 and 20000),
  height      integer not null check (height between 1 and 20000),
  bytes       integer not null check (bytes between 1 and 10485760),
  sort_order  integer not null default 0 check (sort_order between 0 and 1000),
  created_at  timestamptz not null default now()
);
create index memory_media_memory_idx on public.memory_media(memory_id, sort_order);

create table public.memory_comments (
  id           uuid primary key default gen_random_uuid(),
  memory_id    uuid not null references public.memories(id) on delete cascade,
  author_id    uuid not null references public.app_users(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 1000),
  is_anonymous boolean not null default false,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index memory_comments_memory_idx on public.memory_comments(memory_id, created_at);

create table public.memory_reactions (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid not null references public.memories(id) on delete cascade,
  user_id    uuid not null references public.app_users(id) on delete cascade,
  reaction   text not null default 'heart' check (reaction = 'heart'),
  created_at timestamptz not null default now(),
  unique (memory_id, user_id, reaction)
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  room_id    uuid references public.rooms(id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- RLS مفعّل على كل الجداول بدون policies = لا وصول مباشر بالمفتاح العام
alter table public.app_users          enable row level security;
alter table public.app_sessions       enable row level security;
alter table public.rate_events        enable row level security;
alter table public.legal_documents    enable row level security;
alter table public.rooms              enable row level security;
alter table public.room_members       enable row level security;
alter table public.room_join_requests enable row level security;
alter table public.memories           enable row level security;
alter table public.memory_media       enable row level security;
alter table public.memory_comments    enable row level security;
alter table public.memory_reactions   enable row level security;
alter table public.notifications      enable row level security;

-- ---------------------------------------------------------------------
-- 2) دوال داخلية (لا تُمنح للمفتاح العام)
-- ---------------------------------------------------------------------

-- التحقق من الجلسة
create or replace function public._uid(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select user_id into v from app_sessions where token = p_token and expires_at > now();
  if v is null then raise exception 'SESSION_INVALID'; end if;
  return v;
end $$;

-- التحقق من صلاحية الإدارة
create or replace function public._require_admin(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid; r text;
begin
  v := public._uid(p_token);
  select role into r from app_users where id = v;
  if r <> 'admin' then raise exception 'FORBIDDEN'; end if;
  return v;
end $$;

-- بيانات المستخدم الآمنة للإرجاع (لا تُرجع password_hash أبداً)
create or replace function public._me(p_id uuid)
returns json language sql security definer set search_path = public as $$
  select json_build_object('id', id, 'username', username, 'display_name', display_name,
                           'avatar_id', avatar_id, 'role', role)
  from app_users where id = p_id;
$$;

-- حدّ المحاولات: يرمي TOO_MANY_ATTEMPTS إذا تجاوز العدد ضمن النافذة
create or replace function public._rate_check(p_key text, p_max integer, p_window interval)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from rate_events where key = p_key and created_at > now() - p_window) >= p_max then
    raise exception 'TOO_MANY_ATTEMPTS';
  end if;
end $$;

create or replace function public._rate_hit(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into rate_events(key) values (p_key);
  delete from rate_events where created_at < now() - interval '1 day' and random() < 0.05;
end $$;

-- دور المستخدم داخل الغرفة (null إن لم يكن عضواً)
create or replace function public._role(p_room uuid, p_uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from room_members where room_id = p_room and user_id = p_uid;
$$;

-- يتأكد أن المستخدم عضو في غرفة غير مؤرشفة ويُرجع دوره
create or replace function public._require_member(p_room uuid, p_uid uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v text;
begin
  select m.role into v from room_members m join rooms r on r.id = m.room_id
   where m.room_id = p_room and m.user_id = p_uid and not r.is_archived;
  if v is null then raise exception 'NOT_MEMBER'; end if;
  return v;
end $$;

create or replace function public._require_manager(p_room uuid, p_uid uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v text;
begin
  v := public._require_member(p_room, p_uid);
  if v not in ('owner','moderator') then raise exception 'FORBIDDEN'; end if;
  return v;
end $$;

create or replace function public._notify(p_user uuid, p_room uuid, p_type text, p_payload jsonb)
returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, room_id, type, payload) values (p_user, p_room, p_type, p_payload);
$$;

-- رمز دعوة عشوائي (10 أحرف بلا أحرف ملتبسة)
create or replace function public._gen_code()
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(10);
  r text := '';
  i integer;
begin
  for i in 0..9 loop
    r := r || substr(chars, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return r;
end $$;

create or replace function public._code_hash(p_code text)
returns text language sql immutable security definer set search_path = public, extensions as $$
  select encode(extensions.digest(upper(trim(p_code)), 'sha256'), 'hex');
$$;

-- يُنشئ رمزاً جديداً غير مكرر ويُرجع (الرمز، البصمة)
create or replace function public._new_unique_code()
returns text language plpgsql security definer set search_path = public, extensions as $$
declare c text; n integer := 0;
begin
  loop
    c := public._gen_code();
    exit when not exists (select 1 from rooms where join_code_hash = public._code_hash(c));
    n := n + 1;
    if n > 20 then raise exception 'CODE_GENERATION_FAILED'; end if;
  end loop;
  return c;
end $$;

-- تمثيل الذكرى (JSON) كما تراه الواجهة
create or replace function public._memory_json(p_id uuid, p_uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', m.id,
    'room_id', m.room_id,
    'room_name', r.name,
    'title', m.title,
    'description', m.description,
    'created_at', m.created_at,
    'author', jsonb_build_object('id', u.id, 'display_name', u.display_name, 'avatar_id', u.avatar_id),
    'media', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'width', x.width, 'height', x.height, 'sort_order', x.sort_order)
                                        order by x.sort_order, x.created_at)
                         from memory_media x where x.memory_id = m.id), '[]'::jsonb),
    'like_count', (select count(*) from memory_reactions z where z.memory_id = m.id),
    'liked', exists (select 1 from memory_reactions z where z.memory_id = m.id and z.user_id = p_uid),
    'comment_count', (select count(*) from memory_comments c where c.memory_id = m.id and c.deleted_at is null)
  )
  from memories m
  join rooms r on r.id = m.room_id
  join app_users u on u.id = m.author_id
  where m.id = p_id;
$$;

create or replace function public._room_json(p_room uuid, p_uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'description', r.description,
    'owner_id', r.owner_id,
    'allow_anonymous_comments', r.allow_anonymous_comments,
    'created_at', r.created_at,
    'my_role', (select role from room_members where room_id = r.id and user_id = p_uid),
    'member_count', (select count(*) from room_members where room_id = r.id),
    'pending_count', case
        when (select role from room_members where room_id = r.id and user_id = p_uid) in ('owner','moderator')
        then (select count(*) from room_join_requests q where q.room_id = r.id and q.status = 'pending')
        else 0 end
  )
  from rooms r where r.id = p_room;
$$;

-- ---------------------------------------------------------------------
-- 3) الحساب والجلسات
-- ---------------------------------------------------------------------

create or replace function public.register(p_username text, p_password text, p_display_name text, p_accept_terms boolean default false)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_name text := lower(trim(coalesce(p_username, '')));
  v_disp text := trim(coalesce(p_display_name, ''));
  v_id uuid; v_token uuid;
begin
  if p_accept_terms is not true then raise exception 'TERMS_REQUIRED'; end if;
  if v_name !~ '^[a-z0-9_]{3,20}$' then raise exception 'USERNAME_INVALID'; end if;
  if char_length(v_disp) < 2 or char_length(v_disp) > 32 then raise exception 'DISPLAY_NAME_INVALID'; end if;
  if p_password is null or char_length(p_password) < 8 then raise exception 'PASSWORD_TOO_SHORT'; end if;
  if char_length(p_password) > 72 then raise exception 'PASSWORD_TOO_LONG'; end if;
  if exists (select 1 from app_users where username = v_name) then raise exception 'USERNAME_TAKEN'; end if;

  begin
    insert into app_users (username, password_hash, display_name, terms_accepted_at)
    values (v_name, crypt(p_password, gen_salt('bf')), v_disp, now())
    returning id into v_id;
  exception when unique_violation then
    raise exception 'USERNAME_TAKEN';
  end;

  insert into app_sessions (user_id) values (v_id) returning token into v_token;
  return json_build_object('token', v_token, 'user', public._me(v_id));
end $$;

-- ملاحظة: فشل الدخول يُرجع {error} بدل رمي استثناء، حتى يُحفظ سجل المحاولة.
create or replace function public.login(p_username text, p_password text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_name text := lower(trim(coalesce(p_username, '')));
  v_id uuid; v_token uuid;
begin
  perform public._rate_check('login:' || v_name, 8, interval '15 minutes');

  select id into v_id from app_users
   where username = v_name and password_hash = crypt(coalesce(p_password, ''), password_hash);

  if v_id is null then
    perform public._rate_hit('login:' || v_name);
    return json_build_object('error', 'BAD_CREDENTIALS');
  end if;

  delete from rate_events where key = 'login:' || v_name;
  delete from app_sessions where user_id = v_id and expires_at <= now();
  delete from app_sessions where token in (
    select token from app_sessions where user_id = v_id order by created_at desc offset 9
  );
  insert into app_sessions (user_id) values (v_id) returning token into v_token;
  return json_build_object('token', v_token, 'user', public._me(v_id));
end $$;

create or replace function public.get_me(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  return public._me(public._uid(p_token));
end $$;

create or replace function public.logout(p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from app_sessions where token = p_token;
end $$;

create or replace function public.update_profile(p_token uuid, p_display_name text default null, p_avatar_id text default null)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; v_disp text;
begin
  v := public._uid(p_token);
  if p_display_name is not null then
    v_disp := trim(p_display_name);
    if char_length(v_disp) < 2 or char_length(v_disp) > 32 then raise exception 'DISPLAY_NAME_INVALID'; end if;
    update app_users set display_name = v_disp where id = v;
  end if;
  if p_avatar_id is not null then
    if p_avatar_id !~ '^avatar_(0[1-9]|1[0-2])$' then raise exception 'AVATAR_INVALID'; end if;
    update app_users set avatar_id = p_avatar_id where id = v;
  end if;
  return public._me(v);
end $$;

create or replace function public.change_password(p_token uuid, p_old text, p_new text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v uuid;
begin
  v := public._uid(p_token);
  perform public._rate_check('pwd:' || v::text, 8, interval '15 minutes');
  if not exists (select 1 from app_users where id = v and password_hash = crypt(coalesce(p_old, ''), password_hash)) then
    perform public._rate_hit('pwd:' || v::text);
    raise exception 'OLD_PASSWORD_WRONG';
  end if;
  if p_new is null or char_length(p_new) < 8 then raise exception 'PASSWORD_TOO_SHORT'; end if;
  if char_length(p_new) > 72 then raise exception 'PASSWORD_TOO_LONG'; end if;
  update app_users set password_hash = crypt(p_new, gen_salt('bf')) where id = v;
  delete from app_sessions where user_id = v and token <> p_token;
end $$;

create or replace function public.get_legal()
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('document_type', document_type, 'version', version, 'content', content)
                           order by document_type desc), '[]'::json)
  from legal_documents where status = 'published';
$$;

-- ---------------------------------------------------------------------
-- 4) الغرف
-- ---------------------------------------------------------------------

create or replace function public.create_room(p_token uuid, p_name text, p_description text default '', p_allow_anonymous boolean default false)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v uuid; v_name text := trim(coalesce(p_name, '')); v_desc text := trim(coalesce(p_description, '')); v_code text; v_room uuid;
begin
  v := public._uid(p_token);
  if char_length(v_name) < 2 or char_length(v_name) > 60 then raise exception 'ROOM_NAME_INVALID'; end if;
  if char_length(v_desc) > 500 then raise exception 'ROOM_DESCRIPTION_INVALID'; end if;
  v_code := public._new_unique_code();
  insert into rooms (owner_id, name, description, allow_anonymous_comments, join_code_hash)
  values (v, v_name, v_desc, coalesce(p_allow_anonymous, false), public._code_hash(v_code))
  returning id into v_room;
  insert into room_members (room_id, user_id, role) values (v_room, v, 'owner');
  return json_build_object('room', public._room_json(v_room, v), 'join_code', v_code);
end $$;

create or replace function public.list_my_rooms(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  return coalesce((
    select json_agg(public._room_json(r.id, v) order by r.created_at desc)
      from rooms r join room_members m on m.room_id = r.id and m.user_id = v
     where not r.is_archived
  ), '[]'::json);
end $$;

create or replace function public.get_room(p_token uuid, p_room uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; v_role text;
begin
  v := public._uid(p_token);
  v_role := public._require_member(p_room, v);
  return json_build_object(
    'room', public._room_json(p_room, v),
    'members', coalesce((
      select json_agg(json_build_object('user_id', u.id, 'username', u.username, 'display_name', u.display_name,
                                        'avatar_id', u.avatar_id, 'role', m.role, 'joined_at', m.joined_at)
                      order by (m.role = 'owner') desc, (m.role = 'moderator') desc, m.joined_at)
        from room_members m join app_users u on u.id = m.user_id where m.room_id = p_room
    ), '[]'::json),
    'requests', case when v_role in ('owner','moderator') then coalesce((
      select json_agg(json_build_object('id', q.id, 'user_id', u.id, 'username', u.username, 'display_name', u.display_name,
                                        'avatar_id', u.avatar_id, 'created_at', q.created_at) order by q.created_at)
        from room_join_requests q join app_users u on u.id = q.user_id
       where q.room_id = p_room and q.status = 'pending'
    ), '[]'::json) else '[]'::json end
  );
end $$;

-- الانضمام برمز: ينشئ طلباً معلّقاً ينتظر موافقة مدير الغرفة
create or replace function public.join_room(p_token uuid, p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v uuid; v_room rooms%rowtype; v_user text; v_mgr uuid;
begin
  v := public._uid(p_token);
  perform public._rate_check('join:' || v::text, 10, interval '15 minutes');

  select * into v_room from rooms
   where join_code_hash = public._code_hash(coalesce(p_code, '')) and not is_archived;
  if v_room.id is null then
    perform public._rate_hit('join:' || v::text);
    return json_build_object('error', 'CODE_INVALID');
  end if;

  if exists (select 1 from room_members where room_id = v_room.id and user_id = v) then
    raise exception 'ALREADY_MEMBER';
  end if;
  if exists (select 1 from room_join_requests where room_id = v_room.id and user_id = v and status = 'pending') then
    raise exception 'REQUEST_PENDING';
  end if;

  insert into room_join_requests (room_id, user_id) values (v_room.id, v);
  select display_name into v_user from app_users where id = v;
  for v_mgr in select user_id from room_members where room_id = v_room.id and role in ('owner','moderator') loop
    perform public._notify(v_mgr, v_room.id, 'room_join_request',
      jsonb_build_object('text', 'طلب انضمام جديد من ' || v_user || ' إلى غرفة «' || v_room.name || '».'));
  end loop;
  return json_build_object('status', 'pending', 'room_name', v_room.name);
end $$;

create or replace function public.list_my_requests(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  return coalesce((
    select json_agg(json_build_object('id', q.id, 'room_id', q.room_id, 'room_name', r.name,
                                      'status', q.status, 'created_at', q.created_at) order by q.created_at desc)
      from (select * from room_join_requests where user_id = v order by created_at desc limit 30) q
      join rooms r on r.id = q.room_id
  ), '[]'::json);
end $$;

create or replace function public.cancel_request(p_token uuid, p_request uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  update room_join_requests set status = 'cancelled', reviewed_at = now()
   where id = p_request and user_id = v and status = 'pending';
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
end $$;

create or replace function public.review_request(p_token uuid, p_request uuid, p_decision text)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; q room_join_requests%rowtype; v_room_name text;
begin
  v := public._uid(p_token);
  if p_decision not in ('approved','rejected') then raise exception 'FORBIDDEN'; end if;
  select * into q from room_join_requests where id = p_request and status = 'pending' for update;
  if q.id is null then raise exception 'REQUEST_NOT_FOUND'; end if;
  perform public._require_manager(q.room_id, v);
  select name into v_room_name from rooms where id = q.room_id;

  update room_join_requests set status = p_decision, reviewed_by = v, reviewed_at = now() where id = q.id;
  if p_decision = 'approved' then
    insert into room_members (room_id, user_id, role) values (q.room_id, q.user_id, 'member') on conflict do nothing;
    perform public._notify(q.user_id, q.room_id, 'room_join_approved',
      jsonb_build_object('text', 'تم قبول طلب انضمامك إلى غرفة «' || v_room_name || '».'));
  else
    perform public._notify(q.user_id, q.room_id, 'room_join_rejected',
      jsonb_build_object('text', 'لم تتم الموافقة على طلب انضمامك إلى غرفة «' || v_room_name || '».'));
  end if;
  return json_build_object('status', p_decision);
end $$;

create or replace function public.remove_member(p_token uuid, p_room uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v uuid; v_role text; v_target text; v_room_name text;
begin
  v := public._uid(p_token);
  v_role := public._require_manager(p_room, v);
  v_target := public._role(p_room, p_user);
  if v_target is null then raise exception 'NOT_MEMBER'; end if;
  if v_target = 'owner' then raise exception 'CANNOT_REMOVE_OWNER'; end if;
  if p_user = v then raise exception 'FORBIDDEN'; end if;
  if v_target = 'moderator' and v_role <> 'owner' then raise exception 'FORBIDDEN'; end if;
  delete from room_members where room_id = p_room and user_id = p_user;
  select name into v_room_name from rooms where id = p_room;
  perform public._notify(p_user, p_room, 'room_member_removed',
    jsonb_build_object('text', 'تمت إزالتك من غرفة «' || v_room_name || '».'));
end $$;

create or replace function public.leave_room(p_token uuid, p_room uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v uuid; v_role text;
begin
  v := public._uid(p_token);
  v_role := public._require_member(p_room, v);
  if v_role = 'owner' then raise exception 'OWNER_CANNOT_LEAVE'; end if;
  delete from room_members where room_id = p_room and user_id = v;
end $$;

create or replace function public.regenerate_join_code(p_token uuid, p_room uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v uuid; v_code text;
begin
  v := public._uid(p_token);
  perform public._require_manager(p_room, v);
  v_code := public._new_unique_code();
  update rooms set join_code_hash = public._code_hash(v_code) where id = p_room;
  return json_build_object('join_code', v_code);
end $$;

-- ---------------------------------------------------------------------
-- 5) الذكريات والصور
-- ---------------------------------------------------------------------

create or replace function public.create_memory(p_token uuid, p_room uuid, p_title text, p_description text default '')
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; v_title text := trim(coalesce(p_title, '')); v_desc text := trim(coalesce(p_description, '')); v_id uuid;
begin
  v := public._uid(p_token);
  perform public._require_member(p_room, v);
  if char_length(v_title) < 1 or char_length(v_title) > 100 then raise exception 'TITLE_REQUIRED'; end if;
  if char_length(v_desc) > 2900 then raise exception 'DESCRIPTION_TOO_LONG'; end if;
  insert into memories (room_id, author_id, title, description) values (p_room, v, v_title, v_desc) returning id into v_id;
  return json_build_object('id', v_id);
end $$;

create or replace function public.add_media(p_token uuid, p_memory uuid, p_path text, p_thumb_path text,
                                            p_width integer, p_height integer, p_bytes integer, p_sort integer default 0)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; m memories%rowtype; v_prefix text; v_id uuid;
begin
  v := public._uid(p_token);
  select * into m from memories where id = p_memory and deleted_at is null;
  if m.id is null or m.author_id <> v then raise exception 'MEMORY_NOT_FOUND'; end if;
  perform public._require_member(m.room_id, v);
  v_prefix := m.room_id::text || '/' || m.id::text || '/';
  if p_path !~ ('^' || v_prefix || '[0-9a-f-]{36}\.jpg$')
     or p_thumb_path !~ ('^' || v_prefix || '[0-9a-f-]{36}_t\.jpg$') then
    raise exception 'MEDIA_INVALID';
  end if;
  if (select count(*) from memory_media where memory_id = p_memory) >= 10 then raise exception 'MEDIA_LIMIT'; end if;
  begin
    insert into memory_media (memory_id, path, thumb_path, width, height, bytes, sort_order)
    values (p_memory, p_path, p_thumb_path, p_width, p_height, p_bytes, greatest(0, least(coalesce(p_sort, 0), 1000)))
    returning id into v_id;
  exception when check_violation or unique_violation then
    raise exception 'MEDIA_INVALID';
  end;
  return json_build_object('id', v_id);
end $$;

create or replace function public.list_memories(p_token uuid, p_room uuid default null, p_limit integer default 30, p_before timestamptz default null)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  if p_room is not null then perform public._require_member(p_room, v); end if;
  return coalesce((
    select json_agg(public._memory_json(t.id, v) order by t.created_at desc)
      from (
        select m.id, m.created_at
          from memories m
          join room_members rm on rm.room_id = m.room_id and rm.user_id = v
          join rooms r on r.id = m.room_id and not r.is_archived
         where m.deleted_at is null
           and (p_room is null or m.room_id = p_room)
           and (p_before is null or m.created_at < p_before)
           and exists (select 1 from memory_media x where x.memory_id = m.id)
         order by m.created_at desc
         limit least(greatest(coalesce(p_limit, 30), 1), 60)
      ) t
  ), '[]'::json);
end $$;

create or replace function public.get_memory(p_token uuid, p_memory uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; m memories%rowtype;
begin
  v := public._uid(p_token);
  select * into m from memories where id = p_memory and deleted_at is null;
  if m.id is null then raise exception 'MEMORY_NOT_FOUND'; end if;
  perform public._require_member(m.room_id, v);
  return (public._memory_json(p_memory, v) || jsonb_build_object(
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'body', c.body, 'created_at', c.created_at,
               'is_anonymous', c.is_anonymous, 'is_mine', c.author_id = v,
               'author', case when c.is_anonymous then null
                         else jsonb_build_object('id', u.id, 'display_name', u.display_name, 'avatar_id', u.avatar_id) end
             ) order by c.created_at)
        from memory_comments c join app_users u on u.id = c.author_id
       where c.memory_id = p_memory and c.deleted_at is null
    ), '[]'::jsonb),
    'my_role', public._role(m.room_id, v),
    'allow_anonymous', (select allow_anonymous_comments from rooms where id = m.room_id),
    'author_is_me', m.author_id = v
  ))::json;
end $$;

create or replace function public.delete_memory(p_token uuid, p_memory uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v uuid; m memories%rowtype; v_role text;
begin
  v := public._uid(p_token);
  select * into m from memories where id = p_memory and deleted_at is null;
  if m.id is null then raise exception 'MEMORY_NOT_FOUND'; end if;
  v_role := public._require_member(m.room_id, v);
  if m.author_id <> v and v_role not in ('owner','moderator') then raise exception 'FORBIDDEN'; end if;
  update memories set deleted_at = now() where id = p_memory;
end $$;

create or replace function public.toggle_like(p_token uuid, p_memory uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; m memories%rowtype; v_liked boolean;
begin
  v := public._uid(p_token);
  select * into m from memories where id = p_memory and deleted_at is null;
  if m.id is null then raise exception 'MEMORY_NOT_FOUND'; end if;
  perform public._require_member(m.room_id, v);
  if exists (select 1 from memory_reactions where memory_id = p_memory and user_id = v and reaction = 'heart') then
    delete from memory_reactions where memory_id = p_memory and user_id = v and reaction = 'heart';
    v_liked := false;
  else
    insert into memory_reactions (memory_id, user_id) values (p_memory, v) on conflict do nothing;
    v_liked := true;
  end if;
  return json_build_object('liked', v_liked,
                           'count', (select count(*) from memory_reactions where memory_id = p_memory));
end $$;

create or replace function public.add_comment(p_token uuid, p_memory uuid, p_body text, p_anonymous boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; m memories%rowtype; r rooms%rowtype; v_body text := trim(coalesce(p_body, '')); v_id uuid; v_name text; v_text text;
begin
  v := public._uid(p_token);
  select * into m from memories where id = p_memory and deleted_at is null;
  if m.id is null then raise exception 'MEMORY_NOT_FOUND'; end if;
  perform public._require_member(m.room_id, v);
  select * into r from rooms where id = m.room_id;
  if char_length(v_body) < 1 then raise exception 'COMMENT_EMPTY'; end if;
  if char_length(v_body) > 1000 then raise exception 'COMMENT_TOO_LONG'; end if;
  if coalesce(p_anonymous, false) and not r.allow_anonymous_comments then raise exception 'ANON_NOT_ALLOWED'; end if;

  insert into memory_comments (memory_id, author_id, body, is_anonymous)
  values (p_memory, v, v_body, coalesce(p_anonymous, false)) returning id into v_id;

  if m.author_id <> v then
    select display_name into v_name from app_users where id = v;
    v_text := case when coalesce(p_anonymous, false)
                   then 'علّق شخص على ذكرى «' || m.title || '».'
                   else 'علّق ' || v_name || ' على ذكرى «' || m.title || '».' end;
    perform public._notify(m.author_id, m.room_id, 'memory_comment', jsonb_build_object('text', v_text, 'memory_id', m.id));
  end if;
  return json_build_object('id', v_id);
end $$;

create or replace function public.delete_comment(p_token uuid, p_comment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v uuid; c memory_comments%rowtype; v_room uuid; v_role text;
begin
  v := public._uid(p_token);
  select * into c from memory_comments where id = p_comment and deleted_at is null;
  if c.id is null then raise exception 'COMMENT_NOT_FOUND'; end if;
  select room_id into v_room from memories where id = c.memory_id;
  v_role := public._require_member(v_room, v);
  if c.author_id <> v and v_role not in ('owner','moderator') then raise exception 'FORBIDDEN'; end if;
  update memory_comments set deleted_at = now() where id = p_comment;
end $$;

-- ---------------------------------------------------------------------
-- 6) الإشعارات
-- ---------------------------------------------------------------------

create or replace function public.list_notifications(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  return json_build_object(
    'items', coalesce((
      select json_agg(json_build_object('id', n.id, 'room_id', n.room_id, 'type', n.type, 'payload', n.payload,
                                        'read_at', n.read_at, 'created_at', n.created_at) order by n.created_at desc)
        from (select * from notifications where user_id = v order by created_at desc limit 80) n
    ), '[]'::json),
    'unread', (select count(*) from notifications where user_id = v and read_at is null)
  );
end $$;

create or replace function public.unread_count(p_token uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  return (select count(*)::integer from notifications where user_id = v and read_at is null);
end $$;

create or replace function public.mark_all_read(p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  update notifications set read_at = now() where user_id = v and read_at is null;
end $$;

create or replace function public.mark_read(p_token uuid, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  update notifications set read_at = now() where id = p_id and user_id = v and read_at is null;
end $$;

-- ---------------------------------------------------------------------
-- 7) دوال خاصة بالـ Edge Function (service_role فقط — لا تُمنح للتطبيق)
-- ---------------------------------------------------------------------

-- هل يحق لصاحب الجلسة رفع صور لهذه الذكرى؟ تُرجع غرفة الذكرى
create or replace function public.media_authorize_upload(p_token uuid, p_memory uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v uuid; m memories%rowtype;
begin
  v := public._uid(p_token);
  select * into m from memories where id = p_memory and deleted_at is null;
  if m.id is null or m.author_id <> v then raise exception 'MEMORY_NOT_FOUND'; end if;
  perform public._require_member(m.room_id, v);
  return json_build_object('room_id', m.room_id, 'memory_id', m.id,
                           'existing', (select count(*) from memory_media where memory_id = m.id));
end $$;

-- مسارات الصور المسموح لصاحب الجلسة قراءتها (عضو في غرفة الذكرى)
create or replace function public.media_resolve(p_token uuid, p_ids uuid[])
returns json language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  v := public._uid(p_token);
  return coalesce((
    select json_agg(json_build_object('id', x.id, 'path', x.path, 'thumb_path', x.thumb_path))
      from memory_media x
      join memories m on m.id = x.memory_id and m.deleted_at is null
      join room_members rm on rm.room_id = m.room_id and rm.user_id = v
      join rooms r on r.id = m.room_id and not r.is_archived
     where x.id = any (p_ids)
  ), '[]'::json);
end $$;

-- ---------------------------------------------------------------------
-- 8) الصلاحيات
-- ---------------------------------------------------------------------

-- لا وصول مباشر للجداول بالمفتاح العام
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

do $$
declare f record;
begin
  for f in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
  loop
    if f.proname like '\_%' or f.proname like 'media\_%' then
      -- داخلية: لا تنفيذ للمفتاح العام (دوال media_* للـ Edge Function فقط)
      execute format('revoke all on function public.%I(%s) from public, anon, authenticated', f.proname, f.args);
      if f.proname like 'media\_%' then
        execute format('grant execute on function public.%I(%s) to service_role', f.proname, f.args);
      end if;
    else
      execute format('revoke all on function public.%I(%s) from public', f.proname, f.args);
      execute format('grant execute on function public.%I(%s) to anon', f.proname, f.args);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9) تخزين الصور (حاوية خاصة؛ الرفع والقراءة بروابط موقّعة عبر Edge Function)
-- ---------------------------------------------------------------------

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('zikra-media', 'zikra-media', false, 10485760, array['image/jpeg'])
    on conflict (id) do update
      set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg'];
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 10) الشروط وسياسة الخصوصية (نصوص مبدئية — راجعها وعدّلها قبل النشر)
-- ---------------------------------------------------------------------

insert into public.legal_documents (document_type, version, content) values
('terms', '1.0',
 'مرحباً بك في ذِكرى. باستخدامك التطبيق فإنك توافق على ما يلي:' || E'\n\n' ||
 '١. أنت مسؤول عن المحتوى الذي ترفعه، ولا يجوز رفع محتوى مخالف للقانون أو ينتهك خصوصية الآخرين أو حقوقهم.' || E'\n' ||
 '٢. الغرف خاصة، ولا يطّلع على ذكرياتك إلا أعضاء الغرفة الذين وافق مدير الغرفة على انضمامهم.' || E'\n' ||
 '٣. رمز الدعوة بمثابة مفتاح للغرفة، فشاركه فقط مع من تثق بهم.' || E'\n' ||
 '٤. يحق لمدير الغرفة إزالة الأعضاء والمحتوى المخالف.' || E'\n' ||
 '٥. نحتفظ بحق إيقاف أي حساب يسيء استخدام الخدمة.'),
('privacy', '1.0',
 'نحترم خصوصيتك. هذه هي المعلومات التي نحفظها:' || E'\n\n' ||
 '١. بيانات الحساب: اسم المستخدم والاسم الظاهر والأفتار. كلمة المرور تُحفظ مشفّرة ولا يمكن لأحد قراءتها.' || E'\n' ||
 '٢. الذكريات: العناوين والتفاصيل والصور والتعليقات والإعجابات، وتُحفظ على خوادم آمنة وتظهر لأعضاء الغرفة فقط.' || E'\n' ||
 '٣. الصور محفوظة في مساحة خاصة وتُعرض بروابط مؤقتة للأعضاء المصرّح لهم فقط.' || E'\n' ||
 '٤. لا نبيع بياناتك ولا نشاركها مع أطراف إعلانية.' || E'\n' ||
 '٥. يمكنك حذف ذكرياتك في أي وقت من داخل التطبيق.');
