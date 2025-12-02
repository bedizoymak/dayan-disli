// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token) {
      console.error("No access token found in callback.");
      navigate("/login");
      return;
    }

    // Supabase session restore
    supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token ?? undefined
    });

    navigate("/"); // ✔ Login sonrası yönlendirme
  }, [navigate]);

  return <div>Giriş yapılıyor, lütfen bekleyin...</div>;
}
