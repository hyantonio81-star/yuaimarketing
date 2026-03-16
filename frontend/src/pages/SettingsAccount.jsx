import { User, Mail, Shield } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SettingsAccount() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <User className="w-7 h-7 text-primary" />
          {t("settings.accountTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("settings.accountDesc")}</p>
      </header>

      <SectionCard title={t("settings.profile")} className="mb-6">
        <div className="flex items-center gap-3 text-foreground">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("settings.email")}</p>
            <p className="font-medium">{user?.email ?? "—"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("settings.security")} className="mb-6">
        <div className="flex items-center gap-3 text-foreground">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("settings.twoFactor")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{t("settings.twoFactorDesc")}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
