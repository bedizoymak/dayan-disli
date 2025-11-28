import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Add customer names here - the value should match the PDF filename (without .pdf)
const customers = [
  { name: "Müşteri A", filename: "musteri-a" },
  { name: "Müşteri B", filename: "musteri-b" },
  { name: "Müşteri C", filename: "musteri-c" },
];

const Kargo = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const handleViewPDF = () => {
    if (!selectedCustomer) return;
    window.open(`/kargolar/${selectedCustomer}.pdf`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground text-center">
          Kargo Formu Görüntüle
        </h1>

        <div className="space-y-4">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Müşteri Seçin" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {customers.map((customer) => (
                <SelectItem key={customer.filename} value={customer.filename}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleViewPDF}
            disabled={!selectedCustomer}
            className="w-full"
          >
            View Cargo Form
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Kargo;
