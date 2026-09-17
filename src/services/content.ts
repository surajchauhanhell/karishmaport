import type { Tables, TableName } from '../types';
import { requireSupabase } from './supabase';
export async function list<K extends TableName>(table: K): Promise<Tables[K][]> {
  const rows: Tables[K][] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await requireSupabase()
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as Tables[K][]));
    if (!data || data.length < 1000) return rows;
  }
}
export async function save<K extends TableName>(table: K, value: Partial<Tables[K]>) {
  const { error } = await requireSupabase()
    .from(table)
    .upsert(value as Record<string, unknown>);
  if (error) throw error;
}
export async function remove(table: TableName, id: string) {
  const { error } = await requireSupabase().from(table).delete().eq('id', id);
  if (error) throw error;
}
export async function upload(file: File, bucket: string) {
  const isPdf = bucket === 'media-kit';
  const allowed = isPdf
    ? ['application/pdf']
    : ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!allowed.includes(file.type) || file.size > 8 * 1024 * 1024)
    throw new Error('Choose a supported image or PDF under 8 MB.');
  const ext = isPdf ? 'pdf' : file.type.split('/')[1];
  const path = `${crypto.randomUUID()}.${ext}`;
  const db = requireSupabase();
  const { error } = await db.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
