import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ProductRow, EXCHANGE_RATES } from "../types";

export function formatName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(word =>
      word.charAt(0).toLocaleUpperCase("tr-TR") +
      word.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
}

export function useQuotationForm() {
  const { toast } = useToast();
  
  // Customer info state
  const [firma, setFirma] = useState("");
  const [ilgiliKisi, setIlgiliKisi] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [konu, setKonu] = useState("");
  
  // Active currency for all products
  const [activeCurrency, setActiveCurrency] = useState("TRY");
  
  // Product rows state
  const [products, setProducts] = useState<ProductRow[]>([
    { id: 1, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0, doviz: "TRY" }
  ]);
  
  // Footer fields state
  const [notlar, setNotlar] = useState("");
  const [opsiyon, setOpsiyon] = useState("");
  const [teslimSuresi, setTeslimSuresi] = useState("");
  const [odemeSekli, setOdemeSekli] = useState("");
  const [teslimYeri, setTeslimYeri] = useState("");
  
  // Counter & tracking state
  const [currentTeklifNo, setCurrentTeklifNo] = useState("");
  const [formChanged, setFormChanged] = useState(true); // Start as true so first action generates new number
  const [lastFinalizedTeklifNo, setLastFinalizedTeklifNo] = useState("");
  const formSnapshotRef = useRef<string>("");

  // Get form snapshot for change detection
  const getFormSnapshot = () => {
    return JSON.stringify({
      firma, ilgiliKisi, tel, email, konu,
      products, notlar, opsiyon, teslimSuresi, odemeSekli, teslimYeri, activeCurrency
    });
  };

  // Check if form has changed since last finalized quotation
  const checkFormChanged = () => {
    const currentSnapshot = getFormSnapshot();
    return currentSnapshot !== formSnapshotRef.current;
  };

  // Mark form as finalized (save snapshot)
  const markFormFinalized = () => {
    formSnapshotRef.current = getFormSnapshot();
    setFormChanged(false);
  };

  // Track form changes
  useEffect(() => {
    if (lastFinalizedTeklifNo && checkFormChanged()) {
      setFormChanged(true);
    }
  }, [firma, ilgiliKisi, tel, email, konu, products, notlar, opsiyon, teslimSuresi, odemeSekli, teslimYeri, activeCurrency, lastFinalizedTeklifNo]);

  // Currency conversion helper
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    const amountInTRY = amount * EXCHANGE_RATES[fromCurrency];
    return amountInTRY / EXCHANGE_RATES[toCurrency];
  };

  // Handle global currency change with conversion
  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === activeCurrency) return;

    const updatedProducts = products.map(p => ({
      ...p,
      birimFiyat: convertCurrency(p.birimFiyat, activeCurrency, newCurrency),
      doviz: newCurrency
    }));

    setProducts(updatedProducts);
    setActiveCurrency(newCurrency);
    setFormChanged(true);
  };

  const addRow = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts([...products, { id: newId, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0, doviz: activeCurrency }]);
    setFormChanged(true);
  };

  const removeRow = (id: number) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
      setFormChanged(true);
    }
  };

  const updateProduct = (id: number, field: keyof ProductRow, value: string | number) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    setFormChanged(true);
  };

  const calculateRowTotal = (row: ProductRow) => row.miktar * row.birimFiyat;
  const calculateSubtotal = () => products.reduce((sum, p) => sum + calculateRowTotal(p), 0);
  const calculateKDV = () => calculateSubtotal() * 0.20;
  const calculateTotal = () => calculateSubtotal() + calculateKDV();

  const formatCurrency = (amount: number, currency = activeCurrency) => {
    const symbols: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
    return `${symbols[currency] || "₺"}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get or generate teklif number
  const getOrGenerateTeklifNo = async (): Promise<string | null> => {
    // If form hasn't changed and we have a finalized number, reuse it
    if (!formChanged && lastFinalizedTeklifNo) {
      return lastFinalizedTeklifNo;
    }

    // Generate new number
    try {
      const { data, error } = await supabase.rpc("increment_monthly_counter");
      if (error || !data) {
        console.error("Counter error:", error);
        return null;
      }

      const formattedCounter = String(data).padStart(3, "0");
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const teklifNo = `TR-DAYAN-${yearMonth}${formattedCounter}`;
      
      return teklifNo;
    } catch (error) {
      console.error("Counter generation error:", error);
      return null;
    }
  };

  // Validation helper
  const hasRequiredFields = () => {
    return !!(firma && ilgiliKisi);
  };

  // Wrapper setters that mark form as changed
  const setFirmaWithChange = (value: string) => {
    setFirma(value);
    setFormChanged(true);
  };

  const setIlgiliKisiWithChange = (value: string) => {
    setIlgiliKisi(value);
    setFormChanged(true);
  };

  const setTelWithChange = (value: string) => {
    setTel(value);
    setFormChanged(true);
  };

  const setEmailWithChange = (value: string) => {
    setEmail(value);
    setFormChanged(true);
  };

  const setKonuWithChange = (value: string) => {
    setKonu(value);
    setFormChanged(true);
  };

  const setNotlarWithChange = (value: string) => {
    setNotlar(value);
    setFormChanged(true);
  };

  const setOpsiyonWithChange = (value: string) => {
    setOpsiyon(value);
    setFormChanged(true);
  };

  const setTeslimSuresiWithChange = (value: string) => {
    setTeslimSuresi(value);
    setFormChanged(true);
  };

  const setOdemeSekliWithChange = (value: string) => {
    setOdemeSekli(value);
    setFormChanged(true);
  };

  const setTeslimYeriWithChange = (value: string) => {
    setTeslimYeri(value);
    setFormChanged(true);
  };

  return {
    // Customer state
    firma,
    ilgiliKisi,
    tel,
    email,
    konu,
    setFirma: setFirmaWithChange,
    setIlgiliKisi: setIlgiliKisiWithChange,
    setTel: setTelWithChange,
    setEmail: setEmailWithChange,
    setKonu: setKonuWithChange,
    
    // Product state
    products,
    activeCurrency,
    addRow,
    removeRow,
    updateProduct,
    handleCurrencyChange,
    
    // Footer state
    notlar,
    opsiyon,
    teslimSuresi,
    odemeSekli,
    teslimYeri,
    setNotlar: setNotlarWithChange,
    setOpsiyon: setOpsiyonWithChange,
    setTeslimSuresi: setTeslimSuresiWithChange,
    setOdemeSekli: setOdemeSekliWithChange,
    setTeslimYeri: setTeslimYeriWithChange,
    
    // Calculations
    calculateRowTotal,
    calculateSubtotal,
    calculateKDV,
    calculateTotal,
    
    // Utilities
    formatCurrency,
    formatName,
    
    // Teklif number
    currentTeklifNo,
    setCurrentTeklifNo,
    formChanged,
    getOrGenerateTeklifNo,
    markFormFinalized,
    setLastFinalizedTeklifNo,
    
    // Validation
    hasRequiredFields,
  };
}

