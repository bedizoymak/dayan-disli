import { useState, useEffect } from "react";
import { CalculatorLayout } from "../components/CalculatorLayout";
import { computeWeight, MATERIAL_DENSITIES, WeightResult } from "../utils/weight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Scale, Package } from "lucide-react";

const materialOptions = [
  { value: "steel", label: "Çelik", density: MATERIAL_DENSITIES.steel },
  { value: "stainlessSteel", label: "Paslanmaz Çelik", density: MATERIAL_DENSITIES.stainlessSteel },
  { value: "aluminum", label: "Alüminyum", density: MATERIAL_DENSITIES.aluminum },
  { value: "brass", label: "Pirinç", density: MATERIAL_DENSITIES.brass },
  { value: "bronze", label: "Bronz", density: MATERIAL_DENSITIES.bronze },
  { value: "copper", label: "Bakır", density: MATERIAL_DENSITIES.copper },
  { value: "cast_iron", label: "Dökme Demir", density: MATERIAL_DENSITIES.cast_iron },
  { value: "titanium", label: "Titanyum", density: MATERIAL_DENSITIES.titanium },
  { value: "custom", label: "Özel", density: 7.85 },
];

export default function WeightCalculation() {
  const [diameter, setDiameter] = useState<string>("50");
  const [length, setLength] = useState<string>("100");
  const [material, setMaterial] = useState<string>("steel");
  const [customDensity, setCustomDensity] = useState<string>("7.85");
  const [result, setResult] = useState<WeightResult | null>(null);

  useEffect(() => {
    const diaVal = parseFloat(diameter);
    const lenVal = parseFloat(length);
    const selectedMaterial = materialOptions.find((m) => m.value === material);
    const density =
      material === "custom"
        ? parseFloat(customDensity)
        : selectedMaterial?.density || 7.85;

    if (!isNaN(diaVal) && !isNaN(lenVal) && !isNaN(density) && diaVal > 0 && lenVal > 0) {
      const calculated = computeWeight(diaVal, lenVal, density);
      setResult(calculated);
    } else {
      setResult(null);
    }
  }, [diameter, length, material, customDensity]);

  const currentDensity =
    material === "custom"
      ? parseFloat(customDensity) || 0
      : materialOptions.find((m) => m.value === material)?.density || 7.85;

  return (
    <CalculatorLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Ağırlık Hesaplama</h1>
          </div>
          <p className="text-slate-400">
            Silindirik parçalar için tahmini ağırlık hesaplama
          </p>
        </div>

        <div className="grid gap-6">
          {/* Input Form */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Parametreler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diameter" className="text-slate-300">
                    Çap (mm)
                  </Label>
                  <Input
                    id="diameter"
                    type="number"
                    step="0.1"
                    min="0"
                    value={diameter}
                    onChange={(e) => setDiameter(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white"
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length" className="text-slate-300">
                    Uzunluk (mm)
                  </Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material" className="text-slate-300">
                  Malzeme
                </Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} ({opt.density} g/cm³)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {material === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customDensity" className="text-slate-300">
                    Özel Yoğunluk (g/cm³)
                  </Label>
                  <Input
                    id="customDensity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customDensity}
                    onChange={(e) => setCustomDensity(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white"
                    placeholder="7.85"
                  />
                </div>
              )}

              <div className="rounded-lg bg-slate-900/50 p-4 border border-slate-600">
                <p className="text-xs text-slate-400 mb-1">Kullanılan Yoğunluk</p>
                <p className="text-white font-mono">{currentDensity.toFixed(2)} g/cm³</p>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="bg-gradient-to-br from-emerald-900/30 to-slate-800/50 border-emerald-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                Sonuç
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 mb-2">Tahmini Ağırlık</p>
                  <p className="text-5xl font-bold text-white mb-2">
                    {result.weightKg.toFixed(2)}
                    <span className="text-2xl text-slate-400 ml-2">kg</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    ({result.weightGrams.toFixed(1)} gram)
                  </p>
                  <div className="mt-6 pt-4 border-t border-slate-700/50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Hacim</p>
                        <p className="text-white font-mono">
                          {result.volumeCm3.toFixed(2)} cm³
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Hacim (mm³)</p>
                        <p className="text-white font-mono">
                          {result.volumeMm3.toFixed(2)} mm³
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  Geçerli parametreler girin
                </p>
              )}
            </CardContent>
          </Card>

          {/* Formula Info */}
          <div className="text-sm text-slate-500 text-center">
            <p>Formül: Hacim = π × (çap/2)² × uzunluk</p>
            <p>Ağırlık = Hacim × Yoğunluk</p>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
}
