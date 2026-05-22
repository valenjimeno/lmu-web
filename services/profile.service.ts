import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { Profile, ProfileCompletion } from '@/types/profile.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

function normalizeNullableText(value: unknown, maxLength: number) {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function splitFullName(fullName: string | null) {
  const normalized = fullName?.trim() ?? '';

  if (!normalized) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  const [firstName, ...rest] = normalized.split(/\s+/);

  return {
    firstName: firstName ?? null,
    lastName: rest.length > 0 ? rest.join(' ') : null,
  };
}

function mapProfile(row: ProfileRow | null): Profile | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nickname: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
  };
}

function buildProfileCompletion(profile: Profile | null): ProfileCompletion {
  return {
    profile,
    isComplete: Boolean(
      profile?.firstName?.trim() && profile?.lastName?.trim() && profile?.nickname?.trim(),
    ),
  };
}

function resolvePreferredDriverName(user: User, profile: Profile | null) {
  const splitProfileFullName =
    profile?.firstName?.trim() && profile?.lastName?.trim()
      ? `${profile.firstName.trim()} ${profile.lastName.trim()}`
      : undefined;
  const storedProfileFullName = profile?.fullName?.trim() || undefined;
  const metadataFullName =
    typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()
        ? user.user_metadata.name.trim()
        : undefined;

  return splitProfileFullName ?? storedProfileFullName ?? metadataFullName;
}

export async function getProfilePageData(userId: string) {
  const supabase = await createClient();
  const profileResult = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  return {
    profile: mapProfile(profileResult.data as ProfileRow | null),
  };
}

export async function getProfileCompletion(userId: string): Promise<ProfileCompletion> {
  const { profile } = await getProfilePageData(userId);

  return buildProfileCompletion(profile);
}

export async function ensureProfileForUser(user: User) {
  const supabase = await createClient();
  const existingProfileResult = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfileResult.error) {
    throw existingProfileResult.error;
  }

  if (existingProfileResult.data) {
    return mapProfile(existingProfileResult.data as ProfileRow);
  }

  const rawDisplayName = normalizeNullableText(user.user_metadata?.display_name, 80);
  const rawFullName = normalizeNullableText(
    user.user_metadata?.full_name ?? user.user_metadata?.name,
    120,
  );
  const fallbackNickname = normalizeNullableText(user.email?.split('@')[0], 80);
  const nickname = rawDisplayName ?? fallbackNickname;
  const fullName = rawFullName ?? nickname;
  const { firstName, lastName } = splitFullName(fullName);

  const insertResult = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? null,
      display_name: nickname,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      preferences: {},
    })
    .select('id, display_name, first_name, last_name, full_name')
    .single();

  if (insertResult.error) {
    throw insertResult.error;
  }

  return mapProfile(insertResult.data as ProfileRow);
}

export const getAuthenticatedAppContext = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await ensureProfileForUser(user);

  return {
    user,
    profile,
    profileCompletion: buildProfileCompletion(profile),
    preferredDriverName: resolvePreferredDriverName(user, profile),
  };
});

export function buildPreferredDriverNames(...values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}
