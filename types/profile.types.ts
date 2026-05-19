export type Profile = {
  id: string;
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type ProfileCompletion = {
  profile: Profile | null;
  isComplete: boolean;
};
