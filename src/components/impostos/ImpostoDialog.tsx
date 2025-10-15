import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImpostoDialogProps {
  imposto?: {
    id_imposto: number;
    tipo: string;
    valor: number;
    periodo: string;
    id_lancamento: number;
  };
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

interface Lancamento {
  id_lancamento: number;
  descricao: string;
  data: string;
  valor: number;
}

export function ImpostoDialog({ imposto, onSuccess, trigger }: ImpostoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [formData, setFormData] = useState({
    tipo: imposto?.tipo || "",
    valor: imposto?.valor?.toString() || "",
    periodo: imposto?.periodo || "",
    id_lancamento: imposto?.id_lancamento?.toString() || "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchLancamentos();
    }
  }, [open]);

  const fetchLancamentos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!usuario) return;

      const { data, error } = await supabase
        .from('lancamento')
        .select('*')
        .eq('id_usuario', usuario.id_usuario)
        .order('data', { ascending: false });

      if (error) throw error;

      setLancamentos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar lançamentos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const impostoData = {
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        periodo: formData.periodo,
        id_lancamento: parseInt(formData.id_lancamento),
      };

      if (imposto) {
        // Atualizar
        const { error } = await supabase
          .from('imposto')
          .update(impostoData)
          .eq('id_imposto', imposto.id_imposto);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Imposto atualizado com sucesso",
        });
      } else {
        // Criar
        const { error } = await supabase
          .from('imposto')
          .insert(impostoData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Imposto cadastrado com sucesso",
        });
      }

      setOpen(false);
      onSuccess();
      
      // Reset form
      setFormData({
        tipo: "",
        valor: "",
        periodo: "",
        id_lancamento: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar imposto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Imposto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{imposto ? "Editar Imposto" : "Novo Imposto"}</DialogTitle>
            <DialogDescription>
              {imposto ? "Atualize as informações do imposto" : "Cadastre um novo imposto vinculado a um lançamento"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id_lancamento">Lançamento *</Label>
              <Select
                value={formData.id_lancamento}
                onValueChange={(value) => setFormData({ ...formData, id_lancamento: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lançamento" />
                </SelectTrigger>
                <SelectContent>
                  {lancamentos.map((lanc) => (
                    <SelectItem key={lanc.id_lancamento} value={lanc.id_lancamento.toString()}>
                      {lanc.descricao} - {new Date(lanc.data).toLocaleDateString('pt-BR')} - R$ {Number(lanc.valor).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Imposto *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICMS">ICMS</SelectItem>
                  <SelectItem value="IPI">IPI</SelectItem>
                  <SelectItem value="PIS">PIS</SelectItem>
                  <SelectItem value="COFINS">COFINS</SelectItem>
                  <SelectItem value="ISS">ISS</SelectItem>
                  <SelectItem value="IRPJ">IRPJ</SelectItem>
                  <SelectItem value="CSLL">CSLL</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="periodo">Período *</Label>
              <Input
                id="periodo"
                type="month"
                value={formData.periodo}
                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
