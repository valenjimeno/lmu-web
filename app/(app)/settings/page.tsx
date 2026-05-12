import { AvatarUploader } from '@/components/features/profile/avatar-uploader';
import { ProfileCard } from '@/components/features/profile/profile-card';

export default function SettingsPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ProfileCard />
      <AvatarUploader />
    </section>
  );
}
