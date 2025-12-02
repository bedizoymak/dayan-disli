import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isEmailAllowed } from "@/lib/auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        setIsAllowed(isEmailAllowed(user.email));
      } else {
        setIsAuthenticated(false);
        setIsAllowed(false);

        // Store redirect **only when user is NOT authenticated**
        localStorage.setItem("auth_redirect_path", location.pathname);
      }

      setLoading(false);
    };

    checkAuth();

    // Listen to login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setIsAllowed(isEmailAllowed(session.user.email));
        } else {
          setIsAuthenticated(false);
          setIsAllowed(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  // LOADING SPINNER
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // NOT AUTHENTICATED → LOGIN PAGE
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // AUTHENTICATED BUT NOT ALLOWED (EMAIL WHITELIST OUTSIDE) → HOME
  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  // FULL ACCESS
  return <>{children}</>;
}
