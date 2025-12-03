import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Backend whitelist kontrolü
      const { data, error } = await supabase.rpc("is_email_allowed", {
        check_email: session.user.email,
      });

      if (error) {
        console.error("Whitelist kontrol hatası:", error);
        setIsAllowed(false);
      } else {
        setIsAllowed(data === true);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return null;

  if (!isAuthenticated || !isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
