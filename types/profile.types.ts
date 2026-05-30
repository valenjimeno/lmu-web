export type Profile = {
  id: string;
  activeTeamId?: string | null;
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
};

export type ProfileCompletion = {
  profile: Profile | null;
  isComplete: boolean;
};
