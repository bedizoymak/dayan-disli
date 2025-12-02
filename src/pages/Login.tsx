import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { isEmailAllowed } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  // 🔥 Login olmuş bir kullanıcıyı otomatik yönlendir
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (isEmailAllowed(user.email)) {
          navigate(from, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    };
    checkExistingSession();
  }, [navigate, from]);

  // 🔥 En kritik kısım: redirectTo ortam değişkenine göre seçiliyor
  const getRedirectURL = () => {
    const isLocal = window.location.hostname === "localhost";
    return isLocal
      ? "http://localhost:3000/auth/callback"
      : "https://dayandisli.com/auth/callback";
  };

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    setLoading(true);

    // Apple login henüz yapılamayacağı için engelliyoruz
    if (provider === "apple") {
      toast({
        title: "Apple Girişi Şu Anda Kullanılamıyor",
        description: "Apple ile giriş yapmak için Apple Developer Program üyeliği gereklidir.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const redirectTo = getRedirectURL();

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        toast({
          title: "Giriş Hatası",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo-header.png"
            alt="Dayan Dişli Logo"
            className="h-16 object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">
          Giriş Yap
        </h1>

        {/* Google Login */}
        <div className="space-y-4">
          <Button
            onClick={() => handleOAuthLogin("google")}
            disabled={loading}
            className="w-full h-12 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm"
            variant="outline"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google ile Giriş Yap
          </Button>

          {/* Apple Login (şimdilik pasif) */}
          <Button
            onClick={() => handleOAuthLogin("apple")}
            disabled={loading}
            className="w-full h-12 bg-black hover:bg-slate-900 text-white"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Apple ile Giriş Yap
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Sadece yetkili kullanıcılar giriş yapabilir.
        </p>
      </div>
    </div>
  );
}
