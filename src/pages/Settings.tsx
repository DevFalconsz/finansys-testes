import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { UserPlus, Palette, Shield } from "lucide-react";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
  perfil: z.string(),
});

const perfilToRoleMap: Record<string, 'admin' | 'analista' | 'caixa' | 'contador'> = {
  'Administrador': 'admin',
  'Analista': 'analista',
  'Caixa': 'caixa',
  'Contador': 'contador',
};

export default function Settings() {
  const { isAdmin, loading } = useAdmin();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    nome: "",
    login: "",
    perfil: "Analista",
  });

  // Color customization state
  const [colors, setColors] = useState({
    primary: "220 90% 56%",
    secondary: "210 40% 96%",
    accent: "220 90% 56%",
    success: "142 76% 36%",
    warning: "38 92% 50%",
    destructive: "0 84% 60%",
  });

  useEffect(() => {
    // Load saved colors from localStorage
    const savedColors = localStorage.getItem('finansys-colors');
    if (savedColors) {
      try {
        setColors(JSON.parse(savedColors));
      } catch (e) {
        console.error('Error loading saved colors:', e);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = signupSchema.parse(signupData);
      const role = perfilToRoleMap[validated.perfil];
      
      // Call edge function to create user with auto-confirmed email
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: validated.email,
          password: validated.password,
          nome: validated.nome,
          login: validated.login,
          perfil: validated.perfil,
          role: role
        }
      });

      if (error || data?.error) {
        toast({
          title: "Erro no cadastro",
          description: data?.error || error?.message || "Erro ao criar usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário cadastrado!",
        description: "O novo usuário foi criado com sucesso e o email está confirmado.",
      });

      // Reset form
      setSignupData({
        email: "",
        password: "",
        nome: "",
        login: "",
        perfil: "Analista",
      });
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

  const handleSaveColors = () => {
    // Save to localStorage
    localStorage.setItem('finansys-colors', JSON.stringify(colors));
    
    // Apply to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--destructive', colors.destructive);

    toast({
      title: "Cores atualizadas!",
      description: "As cores do sistema foram salvas com sucesso.",
    });
  };

  const handleResetColors = () => {
    const defaultColors = {
      primary: "220 90% 56%",
      secondary: "210 40% 96%",
      accent: "220 90% 56%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      destructive: "0 84% 60%",
    };
    setColors(defaultColors);
    localStorage.removeItem('finansys-colors');
    
    // Reset CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', defaultColors.primary);
    root.style.setProperty('--secondary', defaultColors.secondary);
    root.style.setProperty('--accent', defaultColors.accent);
    root.style.setProperty('--success', defaultColors.success);
    root.style.setProperty('--warning', defaultColors.warning);
    root.style.setProperty('--destructive', defaultColors.destructive);

    toast({
      title: "Cores resetadas!",
      description: "As cores do sistema foram restauradas para o padrão.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Área exclusiva para administradores</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Gerenciar Usuários
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Personalização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Usuário</CardTitle>
              <CardDescription>
                Apenas administradores podem criar novos usuários no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Nome do usuário"
                      value={signupData.nome}
                      onChange={(e) => setSignupData(prev => ({ ...prev, nome: e.target.value }))}
                    />
                    {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login">Login</Label>
                    <Input
                      id="login"
                      type="text"
                      placeholder="login_usuario"
                      value={signupData.login}
                      onChange={(e) => setSignupData(prev => ({ ...prev, login: e.target.value }))}
                    />
                    {errors.login && <p className="text-sm text-destructive">{errors.login}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Senha mínima de 6 caracteres"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="perfil">Perfil / Tipo de Acesso</Label>
                    <select
                      id="perfil"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      value={signupData.perfil}
                      onChange={(e) => setSignupData(prev => ({ ...prev, perfil: e.target.value }))}
                    >
                      <option value="Administrador">Administrador - Acesso total ao sistema</option>
                      <option value="Analista">Analista - Dashboard, Lançamentos, Caixa, Dívidas, NFes, Comprovantes, Impostos, Relatórios, Metas</option>
                      <option value="Caixa">Caixa - Dashboard, Lançamentos, Caixa, Comprovantes</option>
                      <option value="Contador">Contador - Dashboard, NFes, Impostos, Relatórios</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Cadastrando..." : "Cadastrar Usuário"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Personalização de Cores</CardTitle>
              <CardDescription>
                Customize as cores principais do sistema (formato HSL: matiz saturação luminosidade)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Cor Primária</Label>
                  <Input
                    id="primary"
                    type="text"
                    placeholder="220 90% 56%"
                    value={colors.primary}
                    onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.primary})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary">Cor Secundária</Label>
                  <Input
                    id="secondary"
                    type="text"
                    placeholder="210 40% 96%"
                    value={colors.secondary}
                    onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.secondary})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Cor de Destaque</Label>
                  <Input
                    id="accent"
                    type="text"
                    placeholder="220 90% 56%"
                    value={colors.accent}
                    onChange={(e) => setColors(prev => ({ ...prev, accent: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.accent})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="success">Cor de Sucesso</Label>
                  <Input
                    id="success"
                    type="text"
                    placeholder="142 76% 36%"
                    value={colors.success}
                    onChange={(e) => setColors(prev => ({ ...prev, success: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.success})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warning">Cor de Aviso</Label>
                  <Input
                    id="warning"
                    type="text"
                    placeholder="38 92% 50%"
                    value={colors.warning}
                    onChange={(e) => setColors(prev => ({ ...prev, warning: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.warning})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destructive">Cor de Erro</Label>
                  <Input
                    id="destructive"
                    type="text"
                    placeholder="0 84% 60%"
                    value={colors.destructive}
                    onChange={(e) => setColors(prev => ({ ...prev, destructive: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.destructive})` }} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveColors} className="flex-1">
                  Salvar Cores
                </Button>
                <Button onClick={handleResetColors} variant="outline">
                  Restaurar Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
