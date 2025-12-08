import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        toast({
          title: "Giriş Başarısız",
          description: "Kullanıcı bilgisi alınamadı.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
        return;
      }

      const { data } = await supabase.rpc(
        "is_email_allowed" as never,
        { check_email: session.user.email } as never
      ) as { data: boolean | null };

      if (data !== true) {
        toast({
          title: "Yetkisiz Giriş",
          description: "Bu email sistemde yetkili değil.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }

      const redirectPath = "/apps";

      localStorage.removeItem("auth_redirect_path");

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
