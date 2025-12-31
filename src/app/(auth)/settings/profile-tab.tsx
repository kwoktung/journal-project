import { ProfilePictureSectionWrapper } from "@/app/(auth)/profile/profile-picture-section-wrapper";
import { ThemeSection } from "@/app/(auth)/profile/theme-section";
import { AccountActionsSection } from "@/app/(auth)/profile/account-actions-section";

export const ProfileTab = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <ProfilePictureSectionWrapper />
      <ThemeSection />
      <AccountActionsSection />
    </div>
  );
};
