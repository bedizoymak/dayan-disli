import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      localStorage.setItem("auth_redirect_path", location.pathname);

      // 1️⃣ Güvenlik ayarı oku
      const { data: settingsData, error: settingsError } = await supabase
        .from("settings")
        .select("auth_enabled")
        .eq("id", 1)
        .single();

      if (settingsError) {
        console.error("Settings error:", settingsError);
      }

      // Eğer güvenlik kapalıysa → direkt erişim ver
      if (settingsData?.auth_enabled === false) {
        setIsAuthenticated(true);
        setIsAllowed(true);
        setLoading(false);
        return;
      }

      // 2️⃣ Oturum kontrolü
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      // 3️⃣ Whitelist kontrolü
      const { data: allow, error: wlError } = await supabase.rpc(
        "is_email_allowed",
        { check_email: session.user.email }
      );

      if (wlError) {
        console.error("Whitelist kontrol hatası:", wlError);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (allow === true) {
        setIsAuthenticated(true);
        setIsAllowed(true);
      } else {
        await supabase.auth.signOut();
      }

      setLoading(false);
    };

    checkAccess();
  }, [location.pathname]);

  if (loading) return null;

  if (!isAuthenticated || !isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
//test4