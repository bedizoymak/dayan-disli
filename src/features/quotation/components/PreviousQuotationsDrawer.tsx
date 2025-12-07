import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";


interface Props {
  onSelect: (teklifNo: string) => void;
}

export function PreviousQuotationsDrawer({ onSelect }: Props) {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuotations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotations")
      .select("teklif_no, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) setQuotations(data);
    setLoading(false);
  };

  return (
    <Drawer onOpenChange={(open) => open && loadQuotations()}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-white border-slate-500"
        >
          <History className="w-4 h-4" />
          Eski Teklifler
        </Button>
      </DrawerTrigger>

      <DrawerContent className="bg-slate-900 border-t border-slate-700">
  {/* Accessibility fix 👇 */}
  <VisuallyHidden asChild>
    <h2>Geçmiş Teklifler</h2>
  </VisuallyHidden>

  <div className="p-4">
    <h2 className="text-lg font-semibold text-white mb-4">Son Teklifler</h2>

          <ScrollArea className="max-h-[50vh] pr-2">
            {loading && <p className="text-slate-400">Yükleniyor...</p>}

            {quotations.map((q) => (
              <Button
                key={q.teklif_no}
                variant="ghost"
                className="w-full justify-between bg-slate-800/40 hover:bg-slate-800 text-white mb-2"
                onClick={() => onSelect(q.teklif_no)}
              >
                <span>{q.teklif_no}</span>
                <span className="text-xs text-slate-400">
                  {format(new Date(q.created_at), "dd MMM yyyy", { locale: tr })}
                </span>
              </Button>
            ))}

            {!loading && quotations.length === 0 && (
              <p className="text-slate-400 text-sm">Kayıt bulunamadı.</p>
            )}
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
