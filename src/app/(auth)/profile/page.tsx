import { ProfilePictureSectionWrapper } from "./profile-picture-section-wrapper";
import { ThemeSection } from "./theme-section";
import { AccountActionsSection } from "./account-actions-section";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <ProfilePictureSectionWrapper />
          <ThemeSection />
          <AccountActionsSection />
        </div>
      </div>
    </div>
  );
}
