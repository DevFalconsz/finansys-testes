import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, Calculator, DollarSign, Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { ImpostoDialog } from "@/components/impostos/ImpostoDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Imposto {
  id_imposto: number;
  tipo: string;
  valor: number;
  periodo: string;
  id_lancamento: number;
  lancamento?: {
    descricao: string;
    data: string;
  };
}

export default function Impostos() {
  const [impostos, setImpostos] = useState<Imposto[]>([]);
  const [filteredImpostos, setFilteredImpostos] = useState<Imposto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImposto, setSelectedImposto] = useState<number | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("todos");
  const { toast } = useToast();

  useEffect(() => {
    fetchImpostos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [impostos, filterTipo, filterPeriodo]);

  const applyFilters = () => {
    let filtered = [...impostos];

    if (filterTipo !== "todos") {
      filtered = filtered.filter(i => i.tipo === filterTipo);
    }

    if (filterPeriodo !== "todos") {
      filtered = filtered.filter(i => i.periodo === filterPeriodo);
    }

    setFilteredImpostos(filtered);
  };

  const tipos = Array.from(new Set(impostos.map(i => i.tipo).filter(Boolean)));
  const periodos = Array.from(new Set(impostos.map(i => i.periodo).filter(Boolean)));

  const fetchImpostos = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!usuario) return;

      // Buscar impostos com informações do lançamento associado
      const { data, error } = await supabase
        .from('imposto')
        .select(`
          *,
          lancamento!inner(
            descricao,
            data
          )
        `)
        .order('periodo', { ascending: false });

      if (error) throw error;

      setImpostos(data || []);
      setFilteredImpostos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar impostos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedImposto) return;

    try {
      const { error } = await supabase
        .from('imposto')
        .delete()
        .eq('id_imposto', selectedImposto);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imposto excluído com sucesso",
      });

      fetchImpostos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir imposto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedImposto(null);
    }
  };

  const totalImpostos = filteredImpostos.reduce((sum, i) => sum + Number(i.valor), 0);
  
  // Agrupar por tipo
  const impostosPorTipo = filteredImpostos.reduce((acc, imposto) => {
    const tipo = imposto.tipo || 'Outros';
    if (!acc[tipo]) {
      acc[tipo] = 0;
    }
    acc[tipo] += Number(imposto.valor);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Impostos</h1>
            <p className="text-muted-foreground">Gerencie seus impostos</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Impostos</h1>
          <p className="text-muted-foreground">Calcule e organize impostos vinculados a lançamentos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filtros</DialogTitle>
                <DialogDescription>
                  Filtre os impostos por tipo e período
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {tipos.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Período</Label>
                  <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {periodos.map(periodo => (
                        <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setFilterTipo("todos");
                  setFilterPeriodo("todos");
                }}>
                  Limpar Filtros
                </Button>
                <Button onClick={() => setFilterDialogOpen(false)}>
                  Aplicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ImpostoDialog onSuccess={fetchImpostos} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Impostos</CardTitle>
            <Calculator className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalImpostos)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade de Impostos</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{filteredImpostos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Impostos</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{Object.keys(impostosPorTipo).length}</div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(impostosPorTipo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(impostosPorTipo).map(([tipo, valor]) => (
                <div key={tipo} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="font-medium">{tipo}</span>
                  <span className="text-warning font-bold">{formatCurrency(valor)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Histórico de Impostos</h2>
        {filteredImpostos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhum imposto registrado</p>
              <ImpostoDialog onSuccess={fetchImpostos} />
            </CardContent>
          </Card>
        ) : (
          filteredImpostos.map((imposto) => (
            <Card key={imposto.id_imposto}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{imposto.tipo}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-warning/10 text-warning">
                        {imposto.periodo}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Lançamento: {imposto.lancamento?.descricao}</span>
                      <span>Data: {imposto.lancamento?.data ? new Date(imposto.lancamento.data).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-warning">
                      {formatCurrency(Number(imposto.valor))}
                    </div>
                    <div className="flex gap-1">
                      <ImpostoDialog 
                        imposto={imposto} 
                        onSuccess={fetchImpostos}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedImposto(imposto.id_imposto);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este imposto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
