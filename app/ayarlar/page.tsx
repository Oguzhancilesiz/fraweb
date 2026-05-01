import type { Metadata } from "next";
import { ProfileSettingsClient } from "@/components/profile/ProfileSettingsClient";

export const metadata: Metadata = {
  title: "Profil ayarları",
  description: "Hesap ve profil bilgileri.",
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsClient />;
}
