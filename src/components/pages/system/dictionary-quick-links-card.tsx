import { useAppTranslations } from "@/hooks/use-app-translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookText, Tag } from "lucide-react";
import Link from "next/link";
import { withLocalePrefix } from "@/components/app-locale";
import { motion } from "framer-motion";

interface DictionaryQuickLinksCardProps {
  locale: string;
}

export function DictionaryQuickLinksCard({ locale }: DictionaryQuickLinksCardProps) {
  const { t } = useAppTranslations("system");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="md:col-span-2"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookText className="h-5 w-5" />
            {t("dictionaryQuickTitle")}
          </CardTitle>
          <CardDescription>
            {t("dictionaryQuickDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button asChild variant="outline" className="h-11 justify-start">
              <Link href={withLocalePrefix("/system/dictionaries", locale as any)}>
                <BookText className="mr-2 h-4 w-4" />
                {t("dictionaryQuickEntries")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 justify-start">
              <Link
                href={withLocalePrefix(
                  "/system/dictionaries/types",
                  locale as any
                )}
              >
                <Tag className="mr-2 h-4 w-4" />
                {t("dictionaryQuickTypes")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
