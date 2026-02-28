import { useAppTranslations } from "@/hooks/use-app-translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

interface SecuritySettingsCardProps {
  onChangePasswordClick: () => void;
}

export function SecuritySettingsCard({ onChangePasswordClick }: SecuritySettingsCardProps) {
  const { t } = useAppTranslations("system");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="md:col-span-2"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("securityTitle")}
          </CardTitle>
          <CardDescription>{t("securityDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <p className="font-medium text-sm">{t("fieldPassword")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("securityDescription")}
              </p>
            </div>
            <Button onClick={onChangePasswordClick}>
              {t("btnChangePassword")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
