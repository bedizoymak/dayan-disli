export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };

  public: {
    Tables: {
      quotations: {
        Row: {
          id: string;
          teklif_no: string;
          firma: string;
          ilgili_kisi: string;
          tel: string | null;
          email: string | null;
          konu: string | null;
          products: Json;
          active_currency: string;
          notlar: string | null;
          opsiyon: string | null;
          teslim_suresi: string | null;
          odeme_sekli: string | null;
          teslim_yeri: string | null;
          subtotal: number | null;
          kdv: number | null;
          total: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teklif_no: string;
          firma: string;
          ilgili_kisi: string;
          tel?: string | null;
          email?: string | null;
          konu?: string | null;
          products: Json;
          active_currency: string;
          notlar?: string | null;
          opsiyon?: string | null;
          teslim_suresi?: string | null;
          odeme_sekli?: string | null;
          teslim_yeri?: string | null;
          subtotal?: number | null;
          kdv?: number | null;
          total?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotations"]["Insert"]>;
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals["public"];

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends {
  Row: infer R;
}
  ? R
  : never;

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T] extends {
  Insert: infer I;
}
  ? I
  : never;

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T] extends {
  Update: infer U;
}
  ? U
  : never;
