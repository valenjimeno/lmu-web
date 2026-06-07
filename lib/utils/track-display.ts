export function getTrackDisplayName(track: { name: string; official_name?: string | null }) {
  return track.official_name?.trim() || track.name;
}
