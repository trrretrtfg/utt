import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_KEY } from '../constants/config';

const AUTH_FUNCTION = 'zikra-username-auth';
const ROOM_FUNCTION = 'zikra-room-api';
const UPLOAD_FUNCTION = 'zikra-cloudinary-sign-upload';
const REGISTER_MEDIA_FUNCTION = 'zikra-cloudinary-register-media';
const DELIVER_MEDIA_FUNCTION = 'zikra-cloudinary-deliver-media';

let _onExpired = null;

const MESSAGES = {
  NETWORK: 'تعذّر الاتصال بالإنترنت. تحقق من الشبكة وأعد المحاولة.',
  SESSION_INVALID: 'انتهت الجلسة، سجّل الدخول من جديد.',
  BAD_CREDENTIALS: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
  USERNAME_TAKEN: 'اسم المستخدم مستخدم بالفعل.',
  ROOM_NAME_INVALID: 'اسم الغرفة يجب أن يكون بين حرفين و٦٠ حرفاً.',
  TITLE_REQUIRED: 'اكتب عنواناً للذكرى.',
  MEDIA_LIMIT: 'الحد الأقصى ١٠ صور للذكرى الواحدة.',
};

export class ApiError extends Error {
  constructor(message, code = 'SERVER_ERROR') {
    super(message || MESSAGES[code] || 'حدث خطأ غير متوقع. حاول مرة أخرى.');
    this.name = 'ApiError';
    this.code = code;
  }
}

function errorMessage(error) {
  const message = String(error?.message || '');
  if (/network|fetch|timeout|internet/i.test(message)) return MESSAGES.NETWORK;
  if (/JWT|invalid.*token|refresh token|not authenticated|unauthorized/i.test(message)) {
    if (_onExpired) _onExpired();
    return MESSAGES.SESSION_INVALID;
  }
  return message || 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

function unwrap(result) {
  if (result?.error) throw new ApiError(errorMessage(result.error), result.error.code);
  return result?.data;
}

async function invoke(name, body) {
  try {
    const result = await supabase.functions.invoke(name, { body });
    if (result.error) {
      let payload = null;
      try { payload = await result.error.context?.json?.(); } catch (error) { /* response may not be JSON */ }
      throw new ApiError(payload?.error || errorMessage(result.error), result.error.code);
    }
    if (result.data?.error) throw new ApiError(result.data.error);
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(errorMessage(error));
  }
}

async function query(builder) {
  try {
    const result = await builder;
    return unwrap(result);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(errorMessage(error));
  }
}

export function setSessionToken() {
  // Supabase Auth is the sole source of the access token; retained for old imports.
}
export function getSessionToken() {
  return null;
}
export function setOnSessionExpired(fn) {
  _onExpired = fn;
}

export async function activateSession(session) {
  if (!session?.access_token || !session?.refresh_token) throw new ApiError('بيانات جلسة الدخول غير مكتملة.');
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw new ApiError(errorMessage(error));
}

export async function login(username, password) {
  const data = await invoke(AUTH_FUNCTION, {
    action: 'login', username: String(username || '').trim().toLowerCase(), password,
  });
  if (!data?.session) throw new ApiError(data?.error || MESSAGES.BAD_CREDENTIALS, 'BAD_CREDENTIALS');
  await activateSession(data.session);
  const user = await getMe();
  const { data: active } = await supabase.auth.getSession();
  const session = active?.session || data.session;
  return { session, token: session.access_token, user };
}

export async function register(username, password, displayName) {
  const data = await invoke(AUTH_FUNCTION, {
    action: 'signup', username: String(username || '').trim().toLowerCase(), password,
    display_name: String(displayName || '').trim(),
  });
  if (!data?.session) throw new ApiError(data?.error || 'تم إنشاء الحساب. سجّل الدخول للمتابعة.');
  await activateSession(data.session);
  const user = await getMe();
  const legalDocs = await query(supabase.from('legal_documents')
    .select('id,version,content_hash').eq('status', 'published'));
  if (legalDocs?.length) {
    const acceptedAt = new Date().toISOString();
    const records = legalDocs.map((doc) => ({
      user_id: user.id, legal_document_id: doc.id,
      accepted_version: doc.version, accepted_content_hash: doc.content_hash,
      accepted_at: acceptedAt,
    }));
    await query(supabase.from('user_legal_acceptances').insert(records));
  }
  const { data: active } = await supabase.auth.getSession();
  const session = active?.session || data.session;
  return { session, token: session.access_token, user };
}

export async function getMe() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new ApiError(MESSAGES.SESSION_INVALID, 'SESSION_INVALID');
  const profile = await query(
    supabase.from('profiles').select('id,username,display_name,avatar_id,created_at').eq('id', authData.user.id).single(),
  );
  return { ...profile, email: authData.user.email };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new ApiError(errorMessage(error));
}

export async function updateProfile({ displayName = null, avatarId = null }) {
  const updates = {};
  if (displayName !== null) updates.display_name = String(displayName).trim();
  if (avatarId !== null) updates.avatar_id = avatarId;
  const { data: authData } = await supabase.auth.getUser();
  const profile = await query(
    supabase.from('profiles').update(updates).eq('id', authData.user.id)
      .select('id,username,display_name,avatar_id,created_at').single(),
  );
  return profile;
}

export async function changePassword(oldPassword, newPassword) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData?.user?.email) throw new ApiError(MESSAGES.SESSION_INVALID, 'SESSION_INVALID');
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: authData.user.email, password: oldPassword });
  if (verifyError) throw new ApiError('كلمة المرور الحالية غير صحيحة.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new ApiError(errorMessage(error));
  const { data: current } = await supabase.auth.getSession();
  if (current?.session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(current.session));
}

export const getLegal = () => query(
  supabase.from('legal_documents').select('id,document_type,version,content,content_hash,effective_at')
    .eq('status', 'published').order('effective_at', { ascending: false }),
);

function randomJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function roomAction(action, body = {}) {
  return invoke(ROOM_FUNCTION, { action, ...body });
}

export async function createRoom(name, description, allowAnonymous) {
  const result = await roomAction('create_room', {
    name: String(name).trim(), description: String(description || '').trim(),
    allow_anonymous_comments: !!allowAnonymous, join_code: randomJoinCode(),
  });
  return result;
}

export async function listMyRooms() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new ApiError(MESSAGES.SESSION_INVALID, 'SESSION_INVALID');
  const memberships = await query(
    supabase.from('room_members')
      .select('room_id,role,rooms!inner(id,owner_id,name,description,allow_anonymous_comments,is_archived,created_at)')
      .eq('user_id', authData.user.id).eq('status', 'active')
      .order('joined_at', { ascending: false }),
  );
  const active = (memberships || []).filter((x) => x.rooms && !x.rooms.is_archived);
  return Promise.all(active.map(async (item) => {
    const room = item.rooms;
    const [membersResult, requestsResult] = await Promise.all([
      supabase.from('room_members').select('id', { count: 'exact', head: true }).eq('room_id', room.id).eq('status', 'active'),
      item.role === 'owner' || item.role === 'moderator'
        ? supabase.from('room_join_requests').select('id', { count: 'exact', head: true }).eq('room_id', room.id).eq('status', 'pending')
        : Promise.resolve({ count: 0, error: null }),
    ]);
    if (membersResult.error) throw new ApiError(errorMessage(membersResult.error));
    if (requestsResult.error) throw new ApiError(errorMessage(requestsResult.error));
    return {
      ...room, my_role: item.role,
      member_count: membersResult.count || 0,
      pending_count: requestsResult.count || 0,
    };
  }));
}

export async function getRoom(roomId) {
  const room = await query(supabase.from('rooms')
    .select('id,owner_id,name,description,allow_anonymous_comments,is_archived,created_at')
    .eq('id', roomId).single());
  const { data: authData } = await supabase.auth.getUser();
  const [membersRaw, myMembership] = await Promise.all([
    query(supabase.from('room_members')
      .select('user_id,role,status,profiles!room_members_user_id_fkey(id,username,display_name,avatar_id)')
      .eq('room_id', roomId).eq('status', 'active').order('joined_at', { ascending: true })),
    query(supabase.from('room_members').select('role').eq('room_id', roomId)
      .eq('user_id', authData.user.id).eq('status', 'active').maybeSingle()),
  ]);
  const role = myMembership?.role || (room.owner_id === authData.user.id ? 'owner' : 'member');
  const isManager = role === 'owner' || role === 'moderator';
  const requestResult = isManager ? await roomAction('list_requests', { room_id: roomId }) : { requests: [] };
  const requestsRaw = requestResult?.requests || [];
  const members = (membersRaw || []).map((m) => ({
    user_id: m.user_id, role: m.role, ...(m.profiles || {}),
  }));
  const requests = (requestsRaw || []).map((r) => ({
    ...r, ...(r.profile || {}), profile: r.profile || null,
  }));
  return { room: { ...room, my_role: role }, members, requests };
}

export async function joinRoom(code) {
  const result = await roomAction('join_room', { join_code: String(code || '').trim().toUpperCase() });
  return { room_name: result?.room?.name || result?.room_name || 'الغرفة' };
}

export async function listMyRequests() {
  const { data: authData } = await supabase.auth.getUser();
  return query(supabase.from('room_join_requests')
    .select('id,room_id,status,created_at')
    .eq('user_id', authData.user.id).order('created_at', { ascending: false }))
    .then((rows) => (rows || []).map((r) => ({ ...r, room_name: 'غرفة' })));
}
export const cancelRequest = (id) => roomAction('cancel_request', { request_id: id });
export const reviewRequest = (id, decision) => roomAction('review_request', { request_id: id, decision });
export const removeMember = (roomId, userId) => roomAction('remove_member', { room_id: roomId, user_id: userId });
function parseCaption(caption) {
  const value = String(caption || '');
  const parts = value.split('\n\n');
  return { title: parts[0] || '', description: parts.slice(1).join('\n\n') };
}

function mapMemory(row, currentUserId) {
  const parsed = parseCaption(row.caption);
  const media = (row.memory_media || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const reactions = row.memory_reactions || [];
  const comments = row.comments || [];
  return {
    ...row, ...parsed,
    room_name: row.rooms?.name || '',
    allow_anonymous: !!row.rooms?.allow_anonymous_comments,
    author: row.profiles || null,
    author_name: row.profiles?.display_name || '',
    author_avatar_id: row.profiles?.avatar_id || null,
    media,
    like_count: reactions.length,
    liked: !!reactions.find((r) => r.user_id === currentUserId),
    comment_count: comments.filter((c) => !c.deleted_at).length,
    comments: comments.filter((c) => !c.deleted_at).map((c) => ({ ...c, author: c.is_anonymous ? null : (c.profiles || null),
      is_mine: c.author_id === currentUserId,
      author_name: c.is_anonymous ? 'مجهول' : (c.profiles?.display_name || 'مستخدم') })),
  };
}

const MEMORY_SELECT = 'id,room_id,author_id,caption,created_at,updated_at,is_pinned,audio_id,rooms(name,allow_anonymous_comments),profiles!memories_author_id_fkey(id,username,display_name,avatar_id),memory_media(id,width,height,sort_order,media_type,created_at),memory_reactions(id,user_id,reaction)';

async function attachVisibleComments(rows, currentUserId) {
  const ids = (rows || []).map((row) => row.id);
  if (!ids.length) return rows;
  const comments = await query(supabase.from('memory_comments_visible')
    .select('id,memory_id,author_id,body,is_anonymous,created_at')
    .in('memory_id', ids).order('created_at', { ascending: true }));
  const authorIds = [...new Set((comments || []).map((comment) => comment.author_id).filter(Boolean))];
  const profiles = authorIds.length
    ? await query(supabase.from('profiles').select('id,display_name,avatar_id').in('id', authorIds))
    : [];
  const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const byMemory = new Map();
  (comments || []).forEach((comment) => {
    const entry = {
      ...comment,
      profiles: comment.author_id ? (byId.get(comment.author_id) || null) : null,
      is_mine: !!comment.author_id && comment.author_id === currentUserId,
    };
    if (!byMemory.has(comment.memory_id)) byMemory.set(comment.memory_id, []);
    byMemory.get(comment.memory_id).push(entry);
  });
  return rows.map((row) => ({ ...row, comments: byMemory.get(row.id) || [] }));
}

export async function listMemories({ roomId = null, limit = 30, before = null } = {}) {
  const { data: authData } = await supabase.auth.getUser();
  let builder = supabase.from('memories').select(MEMORY_SELECT)
    .is('deleted_at', null).order('created_at', { ascending: false }).limit(limit);
  if (roomId) builder = builder.eq('room_id', roomId);
  if (before) builder = builder.lt('created_at', before);
  const rows = await query(builder);
  return (rows || []).map((r) => mapMemory(r, authData?.user?.id));
}

export async function getMemory(id) {
  const { data: authData } = await supabase.auth.getUser();
  const row = await query(supabase.from('memories').select(MEMORY_SELECT).eq('id', id).is('deleted_at', null).single());
  const withComments = await attachVisibleComments([row], authData?.user?.id);
  const memory = mapMemory(withComments[0], authData?.user?.id);
  const membership = await query(supabase.from('room_members').select('role')
    .eq('room_id', row.room_id).eq('user_id', authData.user.id).eq('status', 'active').maybeSingle());
  memory.my_role = membership?.role || (row.author_id === authData.user.id ? 'member' : null);
  memory.author_is_me = row.author_id === authData.user.id;
  return memory;
}

export async function createMemory(roomId, title, description) {
  const { data: authData } = await supabase.auth.getUser();
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) throw new ApiError(MESSAGES.TITLE_REQUIRED);
  const separator = String(description || '').trim() ? '\n\n' : '';
  const cleanDescription = String(description || '').trim().slice(0, Math.max(0, 3000 - cleanTitle.length - separator.length));
  const caption = [cleanTitle, cleanDescription].filter(Boolean).join('\n\n');
  return query(supabase.from('memories').insert({
    room_id: roomId, author_id: authData.user.id, caption,
  }).select('id,room_id,author_id,caption,created_at').single());
}

export async function deleteMemory(id) {
  return query(supabase.from('memories').update({ deleted_at: new Date().toISOString() }).eq('id', id).select('id').single());
}

export async function toggleLike(memoryId) {
  const { data: authData } = await supabase.auth.getUser();
  const existing = await query(supabase.from('memory_reactions').select('id')
    .eq('memory_id', memoryId).eq('user_id', authData.user.id).eq('reaction', 'heart').maybeSingle());
  if (existing) {
    await query(supabase.from('memory_reactions').delete().eq('id', existing.id));
  } else {
    await query(supabase.from('memory_reactions').insert({ memory_id: memoryId, user_id: authData.user.id, reaction: 'heart' }));
  }
  const rows = await query(supabase.from('memory_reactions').select('id,user_id').eq('memory_id', memoryId));
  return { liked: !existing, count: rows?.length || 0 };
}

export async function addComment(memoryId, body, anonymous) {
  const { data: authData } = await supabase.auth.getUser();
  const memory = await query(supabase.from('memories').select('room_id,rooms(allow_anonymous_comments)').eq('id', memoryId).single());
  const isAnonymous = !!anonymous && !!memory?.rooms?.allow_anonymous_comments;
  return query(supabase.from('memory_comments').insert({
    memory_id: memoryId, author_id: authData.user.id, body: String(body || '').trim(), is_anonymous: isAnonymous,
  }).select('id').single());
}

export async function deleteComment(id) {
  return query(supabase.from('memory_comments').update({ deleted_at: new Date().toISOString() }).eq('id', id).select('id').single());
}

export async function listNotifications() {
  const rows = await query(supabase.from('notifications')
    .select('id,room_id,type,payload,read_at,created_at').order('created_at', { ascending: false }).limit(100));
  const items = rows || [];
  return { items, unread: items.filter((x) => !x.read_at).length };
}
export async function unreadCount() {
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  if (error) throw new ApiError(errorMessage(error));
  return count || 0;
}
export async function markAllRead() {
  const { data: authData } = await supabase.auth.getUser();
  return query(supabase.from('notifications').update({ read_at: new Date().toISOString() })
    .eq('user_id', authData.user.id).is('read_at', null));
}
export const markRead = (id) => query(supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id));

export async function signMedia(ids) {
  const uniqueIds = [...new Set(ids || [])];
  const entries = await Promise.all(uniqueIds.map(async (mediaId) => {
    const data = await invoke(DELIVER_MEDIA_FUNCTION, { media_id: mediaId });
    return [mediaId, data.url];
  }));
  return { urls: Object.fromEntries(entries) };
}

export async function requestUploadUrls(memoryId) {
  return invoke(UPLOAD_FUNCTION, { memory_id: memoryId });
}

export async function registerUploadedMedia(memoryId, upload, sortOrder) {
  return invoke(REGISTER_MEDIA_FUNCTION, {
    memory_id: memoryId,
    sort_order: sortOrder,
    upload: {
      asset_id: upload.asset_id, public_id: upload.public_id, version: upload.version,
      bytes: upload.bytes, width: upload.width, height: upload.height,
      format: upload.format, resource_type: upload.resource_type, type: upload.type,
    },
  });
}
