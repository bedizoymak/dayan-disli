import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabaseClient";

// Türkçe karakterleri normalize eden fonksiyon (arama için)
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/İ/g, "i");
}

// Müşteri ismini PDF dosya adı için slug'a çeviren fonksiyon
// Örn: "H.M.S HACILAR MAKİNA SANAYİ" -> "hms-hacilar-makina-sanayi"
function slugifyForPdf(name: string) {
  return normalize(name)
    .replace(/\./g, "") // nokta kaldır
    .replace(/\s+/g, "-") // boşlukları - yap
    .replace(/[^a-z0-9-]/g, ""); // kalan özel karakterleri sil
}

type Customer = {
  id: number;
  name: string;
};

export default function Kargo() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomerSlug, setSelectedCustomerSlug] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("customers_full")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Supabase customers_full error:", error);
        setLoadError("Müşteri listesi yüklenirken hata oluştu.");
        setCustomers([]);
      } else {
        setCustomers(data || []);
      }

      setLoading(false);
    };

    loadCustomers();
  }, []);

  const handleViewPDF = () => {
    if (!selectedCustomerSlug) return;
    window.open(`/kargolar/${selectedCustomerSlug}.pdf`, "_blank");
  };

  // Arama filtresi
  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;

    const searchWords = normalize(search)
      .split(" ")
      .filter(Boolean);

    const customerName = normalize(c.name);

    return searchWords.every((word) => customerName.includes(word));
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center">Kargo Formu Görüntüle</h1>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {selectedName || "Müşteri Seçin"}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-full p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Müşteri ara..."
                onValueChange={(text) => setSearch(text)}
              />
              <CommandList>
                {loading && (
                  <CommandEmpty>Müşteriler yükleniyor...</CommandEmpty>
                )}

                {!loading && loadError && (
                  <CommandEmpty>{loadError}</CommandEmpty>
                )}

                {!loading && !loadError && filteredCustomers.length === 0 && (
                  <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                )}

                {!loading && !loadError && filteredCustomers.length > 0 && (
                  <CommandGroup>
                    {filteredCustomers.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
                          const slug = slugifyForPdf(c.name);
                          setSelectedCustomerSlug(slug);
                          setSelectedName(c.name);
                          setOpen(false);
                        }}
                      >
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleViewPDF}
          className="w-full"
          disabled={!selectedCustomerSlug}
        >
          Kargo Gönderim Formunu Görüntüle
        </Button>
      </div>
    </div>
  );
}
