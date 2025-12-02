import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isEmailAllowed } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleRedirect = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Giriş Başarısız",
          description: "Kullanıcı bilgisi alınamadı.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
        return;
      }

      // Whitelist kontrolü
      if (!isEmailAllowed(user.email)) {
        toast({
          title: "Yetkisiz Giriş",
          description: "Bu email sistemde yetkili değil.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }

      // 🔥 Daha önce ProtectedRoute tarafından kaydedilen rota
      const redirectPath = localStorage.getItem("auth_redirect_path") || "/";

      // Bir kere kullandıktan sonra sil
      localStorage.removeItem("auth_redirect_path");

      // Yönlendir
      navigate(redirectPath, { replace: true });
    };

    handleRedirect();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
