import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface LancamentoDialogProps {
  onSuccess: () => void;
  lancamento?: {
    id_lancamento: number;
    descricao: string;
    valor: number;
    tipo: string;
    categoria: string;
    data: string;
  };
}

export function LancamentoDialog({ onSuccess, lancamento }: LancamentoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: lancamento?.descricao || "",
    valor: lancamento?.valor?.toString() || "",
    tipo: lancamento?.tipo || "COMBUSTÍVEL",
    categoria: lancamento?.categoria || "",
    data: lancamento?.data || new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive",
        });
        return;
      }

      // Get usuario id
      const { data: usuario } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!usuario) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado no sistema",
          variant: "destructive",
        });
        return;
      }

      const lancamentoData = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo,
        categoria: formData.categoria,
        data: formData.data,
        id_usuario: usuario.id_usuario,
      };

      if (lancamento) {
        // Update
        const { error } = await supabase
          .from('lancamento')
          .update(lancamentoData)
          .eq('id_lancamento', lancamento.id_lancamento);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lançamento atualizado com sucesso",
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('lancamento')
          .insert(lancamentoData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lançamento criado com sucesso",
        });
      }

      setOpen(false);
      setFormData({
        descricao: "",
        valor: "",
        tipo: "COMBUSTÍVEL",
        categoria: "",
        data: new Date().toISOString().split('T')[0],
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar lançamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {lancamento ? (
          <Button variant="ghost" size="sm">Editar</Button>
        ) : (
          <Button className="bg-gradient-to-r from-primary to-primary-light">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lancamento ? "Editar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Lançamento</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="MANUTENÇÃO">Manutenção</SelectItem>
                <SelectItem value="COMBUSTÍVEL">Combustível</SelectItem>
                <SelectItem value="PEDÁGIO">Pedágio</SelectItem>
                <SelectItem value="TRIBUTO">Tributo</SelectItem>
                <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                <SelectItem value="PAGAMENTOS DE SÓCIOS E DIRETORES">Pagamentos de Sócios e Diretores</SelectItem>
                <SelectItem value="SALÁRIOS DE FUNCIONÁRIOS">Salários de Funcionários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
