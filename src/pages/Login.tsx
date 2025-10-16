import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export default function Login() {
  const { user, signIn, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-primary-foreground">Carregando...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = loginSchema.parse(loginData);
      const { error } = await signIn(validated.email, validated.password);
      
      if (error) {
        setErrors({ general: "Email ou senha incorretos" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="\finasys icon.png"
            alt="Finasys"
            className="w-24 h-auto mx-auto mb-4 drop-shadow-md"
          />
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Finasys</h1>
          <p className="text-primary-foreground/80">Sistema de Gestão Financeira</p>
        </div>

        <Card className="shadow-elegant bg-card/95 backdrop-blur-sm border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="******"
                    className="pl-10"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {errors.general && (
                <p className="text-sm text-destructive text-center">{errors.general}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}