'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  GroupScheduleScheme,
  SportType,
  TournamentCategory,
  TournamentFormat,
  TournamentRules,
  TournamentTemplate,
} from '@/types/tournament';

type DatabaseRow = Record<string, unknown>;

const supabase = createClient();

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    if (typeof value.message === 'string') return value.message;
  }
  return String(error);
}

function repositoryError(context: string, error: unknown): Error {
  return new Error(`${context}: ${errorMessage(error)}`);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asRules(value: unknown): TournamentRules {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    pointsPerSet: asNumber(raw.pointsPerSet, 21),
    maxSets: asNumber(raw.maxSets, 3),
    deuceMargin: asNumber(raw.deuceMargin, 2),
    maxPointCap: typeof raw.maxPointCap === 'number' ? raw.maxPointCap : undefined,
    customPadelScoring: raw.customPadelScoring === true,
  };
}

function templateFromRow(row: DatabaseRow): TournamentTemplate {
  return {
    id: asString(row.id),
    name: asString(row.name),
    description: asString(row.description),
    sport: asString(row.sport, 'BADMINTON') as SportType,
    format: asString(row.format, 'KNOCKOUT') as TournamentFormat,
    category: asString(row.category, 'OPEN_DOUBLES') as TournamentCategory,
    rules: asRules(row.rules),
    participantCount: typeof row.participant_count === 'number' ? row.participant_count : null,
    courts: asStringArray(row.courts),
    groupScheduleScheme:
      row.group_schedule_scheme === 'SPLIT_WAVE' || row.group_schedule_scheme === 'ROLLING_ROUND'
        ? (row.group_schedule_scheme as GroupScheduleScheme)
        : null,
    scheduleStartTime: asString(row.schedule_start_time, '08:00 WIB'),
    slotDurationMinutes: asNumber(row.slot_duration_minutes, 45),
    isBuiltin: row.is_builtin === true,
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

export async function loadTemplatesFromSupabase(): Promise<TournamentTemplate[]> {
  const result = await supabase
    .from('tournament_templates')
    .select('*')
    .order('is_builtin', { ascending: false })
    .order('created_at', { ascending: true });

  if (result.error) {
    throw repositoryError('Gagal memuat template turnamen', result.error);
  }

  return ((result.data || []) as DatabaseRow[]).map(templateFromRow);
}

function templateRow(template: TournamentTemplate) {
  return {
    id: template.id,
    name: template.name.trim(),
    description: template.description.trim(),
    sport: template.sport,
    format: template.format,
    category: template.category,
    rules: template.rules,
    participant_count:
      typeof template.participantCount === 'number' && template.participantCount > 0
        ? template.participantCount
        : null,
    courts: template.courts,
    group_schedule_scheme: template.groupScheduleScheme || null,
    schedule_start_time: template.scheduleStartTime.trim() || '08:00 WIB',
    slot_duration_minutes: Math.max(5, template.slotDurationMinutes || 45),
    is_builtin: template.isBuiltin,
  };
}

export async function saveTemplateToSupabase(template: TournamentTemplate): Promise<void> {
  const result = await supabase.from('tournament_templates').upsert(templateRow(template));
  if (result.error) {
    throw repositoryError('Gagal menyimpan template turnamen', result.error);
  }
}

export async function deleteTemplateFromSupabase(templateId: string): Promise<void> {
  const result = await supabase
    .from('tournament_templates')
    .delete()
    .eq('id', templateId)
    .eq('is_builtin', false); // pengaman: template bawaan tidak dapat dihapus
  if (result.error) {
    throw repositoryError('Gagal menghapus template turnamen', result.error);
  }
}
