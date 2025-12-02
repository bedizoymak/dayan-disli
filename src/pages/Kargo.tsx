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
import { supabase } from "@/integrations/supabase/client";
import { generateKargoPdf } from "@/utils/generateKargoPdf";

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

function slugifyForPdf(text: string) {
  return normalize(text)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Kargo() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [, setSelectedCustomerSlug] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      const { data, error } = await supabase
        .from("customers_full" as never)
        .select("id, short_name")
        .order("short_name", { ascending: true });

      if (!error && data) {
        setCustomers(data as unknown as Customer[]);
      }
    };

    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    normalize(c.short_name).includes(normalize(search))
  );

  const handleGeneratePDF = async () => {
    if (!selectedCustomerId) return;

    const { data, error } = await supabase
      .from("customers_full" as never)
      .select("name, short_name, address, phone")
      .eq("id", selectedCustomerId)
      .single();

    if (error || !data) {
      console.error("Supabase error:", error);
      return;
    }

    const customerData = data as unknown as { name: string; short_name: string; address: string; phone?: string };
    const pdfBytes = await generateKargoPdf(customerData);
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Kargo Gönderim Formu</h1>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedName || "Müşteri Seçin"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Ara..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

              <CommandGroup>
                {filteredCustomers.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.short_name}
                    onSelect={() => {
                      const slug = slugifyForPdf(c.short_name);
                      setSelectedCustomerSlug(slug);
                      setSelectedName(c.short_name);
                      setSelectedCustomerId(c.id);
                      setOpen(false);
                    }}
                  >
                    {c.short_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleGeneratePDF}
        className="w-full mt-4"
        disabled={!selectedCustomerId}
      >
        PDF Oluştur
      </Button>
    </div>
  );
}
