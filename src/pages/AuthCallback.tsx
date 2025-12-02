import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isEmailAllowed } from "@/lib/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get session from URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session?.user) {
          // Check if email is in whitelist
          if (isEmailAllowed(session.user.email)) {
            // Get the stored redirect path from localStorage
            const redirectPath = localStorage.getItem("auth_redirect_path") || "/kargo";
            localStorage.removeItem("auth_redirect_path");
            navigate(redirectPath, { replace: true });
          } else {
            // Not in whitelist, redirect to home
            navigate("/", { replace: true });
          }
        } else {
          // No session, redirect to login
          navigate("/login", { replace: true });
        }
      } catch (err) {
        setError("Authentication failed");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Giriş yapılıyor...</p>
      </div>
    </div>
  );
}
