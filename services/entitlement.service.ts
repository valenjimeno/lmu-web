import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type PlanFeatureRow = Database['public']['Tables']['plan_features']['Row'];

export const featureKeys = {
  teamsCreate: 'teams.create',
  teamsInvite: 'teams.invite',
  teamsShare: 'teams.share',
  sessionsImportBulk: 'sessions.import_bulk',
} as const;

export type FeatureKey = (typeof featureKeys)[keyof typeof featureKeys];
export type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

type FeatureConfig = {
  enabled: boolean;
  limitValue: number | null;
};

const defaultFeatureMatrix: Record<SubscriptionPlan, Record<FeatureKey, FeatureConfig>> = {
  lite: {
    [featureKeys.teamsCreate]: { enabled: false, limitValue: 0 },
    [featureKeys.teamsInvite]: { enabled: false, limitValue: 0 },
    [featureKeys.teamsShare]: { enabled: false, limitValue: 0 },
    [featureKeys.sessionsImportBulk]: { enabled: false, limitValue: 1 },
  },
  pro: {
    [featureKeys.teamsCreate]: { enabled: true, limitValue: 3 },
    [featureKeys.teamsInvite]: { enabled: true, limitValue: 25 },
    [featureKeys.teamsShare]: { enabled: true, limitValue: null },
    [featureKeys.sessionsImportBulk]: { enabled: true, limitValue: 24 },
  },
};

export type UserEntitlements = {
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  features: Record<FeatureKey, FeatureConfig>;
  canCreateTeams: boolean;
  canInviteToTeams: boolean;
  canShareWithTeam: boolean;
  canBulkImportSessions: boolean;
  maxTeamsOwned: number | null;
  maxTeamMembersPerTeam: number | null;
  maxSessionsPerBulkImport: number | null;
};

function cloneFeatureMatrix(plan: SubscriptionPlan): Record<FeatureKey, FeatureConfig> {
  return {
    [featureKeys.teamsCreate]: { ...defaultFeatureMatrix[plan][featureKeys.teamsCreate] },
    [featureKeys.teamsInvite]: { ...defaultFeatureMatrix[plan][featureKeys.teamsInvite] },
    [featureKeys.teamsShare]: { ...defaultFeatureMatrix[plan][featureKeys.teamsShare] },
    [featureKeys.sessionsImportBulk]: {
      ...defaultFeatureMatrix[plan][featureKeys.sessionsImportBulk],
    },
  };
}

function isMissingEntitlementsSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
  };

  if (
    (candidate.code !== 'PGRST205' && candidate.code !== 'PGRST204') ||
    typeof candidate.message !== 'string'
  ) {
    return false;
  }

  return (
    candidate.message.includes('subscriptions') ||
    candidate.message.includes('plan_features') ||
    candidate.message.includes('subscription_plan') ||
    candidate.message.includes('subscription_status')
  );
}

function buildEntitlements(
  subscription: Pick<SubscriptionRow, 'plan_code' | 'status'> | null,
  planFeatures: PlanFeatureRow[] = [],
): UserEntitlements {
  const plan = subscription?.plan_code ?? 'lite';
  const subscriptionStatus = subscription?.status ?? 'inactive';
  const features = cloneFeatureMatrix(plan);

  for (const feature of planFeatures) {
    if (!(feature.feature_key in features)) {
      continue;
    }

    const key = feature.feature_key as FeatureKey;
    features[key] = {
      enabled: feature.enabled,
      limitValue: feature.limit_value,
    };
  }

  return {
    plan,
    subscriptionStatus,
    features,
    canCreateTeams: features[featureKeys.teamsCreate].enabled,
    canInviteToTeams: features[featureKeys.teamsInvite].enabled,
    canShareWithTeam: features[featureKeys.teamsShare].enabled,
    canBulkImportSessions: features[featureKeys.sessionsImportBulk].enabled,
    maxTeamsOwned: features[featureKeys.teamsCreate].limitValue,
    maxTeamMembersPerTeam: features[featureKeys.teamsInvite].limitValue,
    maxSessionsPerBulkImport: features[featureKeys.sessionsImportBulk].limitValue,
  };
}

export async function getUserEntitlements(userId: string): Promise<UserEntitlements> {
  const supabase = await createClient();
  const subscriptionResult = await supabase
    .from('subscriptions')
    .select('plan_code, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (subscriptionResult.error) {
    if (isMissingEntitlementsSchemaError(subscriptionResult.error)) {
      return buildEntitlements(null);
    }

    throw subscriptionResult.error;
  }

  const subscription = (subscriptionResult.data ?? null) as Pick<
    SubscriptionRow,
    'plan_code' | 'status'
  > | null;
  const plan = subscription?.plan_code ?? 'lite';
  const planFeaturesResult = await supabase
    .from('plan_features')
    .select('plan_code, feature_key, enabled, limit_value, created_at, updated_at')
    .eq('plan_code', plan);

  if (planFeaturesResult.error) {
    if (isMissingEntitlementsSchemaError(planFeaturesResult.error)) {
      return buildEntitlements(subscription);
    }

    throw planFeaturesResult.error;
  }

  return buildEntitlements(subscription, (planFeaturesResult.data ?? []) as PlanFeatureRow[]);
}
