import { useState, useEffect } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { generateKargoPdf } from "@/utils/generateKargoPdf";
import { useLanguage } from "@/contexts/LanguageContext";
import { Package, ChevronDown, FileText, Loader2, Search } from "lucide-react";

type Customer = {
  id: number;
  short_name: string;
  name?: string;
  address?: string;
  phone?: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

export default function Kargo() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedShortName, setSelectedShortName] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPhone, setSelectedPhone] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("customers_full")
        .select("id, short_name, name")
        .order("short_name", { ascending: true });

      if (!error && data) setCustomers(data);
      setLoading(false);
    };

    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    normalize(c.short_name).includes(normalize(search)) ||
    normalize(c.name || "").includes(normalize(search))
  );

  const handleCustomerSelect = async (c: Customer) => {
    setSelectedShortName(c.short_name);
    setSelectedCustomerId(c.id);
    setOpen(false);

    const { data } = await supabase
      .from("customers_full")
      .select("name, address, phone")
      .eq("id", c.id)
      .single();

    setSelectedName(data?.name || c.short_name);
    setSelectedAddress(data?.address || "");
    setSelectedPhone(data?.phone || "");
  };

  const handleGeneratePDF = async () => {
    if (!selectedCustomerId) return;
    setGenerating(true);

    const { data } = await supabase
      .from("customers_full")
      .select("name, short_name, address, phone")
      .eq("id", selectedCustomerId)
      .single();

    const pdfBytes = await generateKargoPdf(data);
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Dropdown */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Müşteri Seçimi</CardTitle>
              <CardDescription className="text-slate-400">
                Kargo göndermek istediğiniz müşteriyi seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-slate-900/50 border-slate-600 text-slate-200 h-12"
                  >
                    {selectedShortName || "Müşteri Seçin"}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700">
                  <Command>
                    <CommandInput
                      placeholder="Ara..."
                      value={search}
                      onValueChange={setSearch}
                      className="text-white"
                    />
                    <CommandList>
                      <CommandEmpty className="text-slate-400 py-4 text-center">
                        Sonuç bulunamadı
                      </CommandEmpty>

                      <CommandGroup>
                        {filteredCustomers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.short_name}
                            onSelect={() => handleCustomerSelect(c)}
                            className="text-slate-200"
                          >
                            {c.short_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedName && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-sm text-slate-400">Seçilen Müşteri</p>
                  <p className="text-white font-medium">{selectedName}</p>

                  {selectedAddress && (
                    <p className="text-slate-400 text-sm mt-2 whitespace-pre-line">
                      {selectedAddress}
                    </p>
                  )}

                  {selectedPhone && (
                    <p className="text-blue-400 text-sm mt-1">
                      Tel: {selectedPhone}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleGeneratePDF}
                  disabled={!selectedCustomerId || generating}
                  className="bg-blue-600 hover:bg-blue-500 text-white h-12"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF Oluştur
                    </>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
