import { StorageInfo } from "@/types/api";
import { useAppTranslations } from "@/hooks/use-app-translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HardDrive, Settings } from "lucide-react";
import { motion } from "framer-motion";

interface StorageManagementCardProps {
  storage: StorageInfo | null;
  onCleanupClick: () => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function StorageManagementCard({ storage, onCleanupClick }: StorageManagementCardProps) {
  const { t } = useAppTranslations("system");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t("storageTitle")}
          </CardTitle>
          <CardDescription>{t("storageDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("fieldTotalSize")}
            </Label>
            <Input
              readOnly
              value={storage ? formatBytes(storage.total_size_bytes) : "0 Bytes"}
              className="bg-muted font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("fieldTotalPartitions")}
              </Label>
              <Input
                readOnly
                value={storage?.total_partitions || 0}
                className="bg-muted font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("fieldLatestPartitionDate")}
              </Label>
              <Input
                readOnly
                value={storage?.partitions?.[0]?.date || "-"}
                className="bg-muted font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onCleanupClick}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t("btnCleanup")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
