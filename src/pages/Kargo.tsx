import { useState } from "react";
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

const customers = [
  { name: "AKKUŞLAR FORKLİFT", filename: "akkuslar" },
  { name: "PLM GEAR GÜÇ AKTARIM SİSTEMLERİ", filename: "PLMGear" },
  { name: "TEKNİK İSTİF MAKİNALARI", filename: "teknikistif" },
  { name: "HMS HACILAR MAKİNA SANAYİ", filename: "HMSHacılar" },
  { name: "HIRA PARTS", filename: "hira-parts" },
  { name: "GÜLNAR MAKİNE", filename: "gulnar-makine" },
  { name: "SALİH DEMİRKOL", filename: "salih-demirkol" },
  { name: "EVREN DİŞLİ", filename: "evren-disli" },
  { name: "TEKSAN HİDROLİK SİNCAN", filename: "teksan-hidrolik-sincan" },
  { name: "TEKSAN HİDROLİK OSTİM", filename: "teksan-hidrolik-ostim" },
  { name: "SUBOR (SAKARYA)", filename: "subor-sakarya" },
  { name: "ÖRNEK MAKİNA", filename: "ornek-makina" },
  { name: "ERMAS MÜHENDİSLİK", filename: "ermas-muhendislik" },
  { name: "FARMATÜRK İLAÇ MAKİNALARI", filename: "farmaturk-ilac-makinalari" },
  { name: "FIRAT HUDAY METRİK MAKİNA", filename: "firat-huday-metrik-makina" },
  { name: "BEKEM ÖZTEKNİK", filename: "bekem-ozteknik" },
  { name: "SABİT TAŞTEKİN", filename: "sabit-tastekin" },
  { name: "BAREL MAKİNA", filename: "barel-makina" },
  { name: "MET VİNÇ", filename: "met-vinc" },
  { name: "TAVİLLER HİDROLİK", filename: "taviller-hidrolik" }
];

// Türkçe karakterleri normalize eden fonksiyon
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

export default function Kargo() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedName, setSelectedName] = useState("");

  const handleViewPDF = () => {
    if (!selectedCustomer) return;
    window.open(`/kargolar/${selectedCustomer}.pdf`, "_blank");
  };

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
                <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>

                <CommandGroup>
                  {customers
                    .filter((c) => {
                      const searchWords = normalize(search)
                        .split(" ")
                        .filter(Boolean);

                      const customerName = normalize(c.name);

                      return searchWords.every((word) =>
                        customerName.includes(word)
                      );
                    })
                    .map((c) => (
                      <CommandItem
                        key={c.filename}
                        value={c.name}
                        onSelect={() => {
                          setSelectedCustomer(c.filename);
                          setSelectedName(c.name);
                          setOpen(false);
                        }}
                      >
                        {c.name}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleViewPDF}
          className="w-full"
          disabled={!selectedCustomer}
        >
          Kargo Gönderim Formunu Görüntüle
        </Button>
      </div>
    </div>
  );
}
