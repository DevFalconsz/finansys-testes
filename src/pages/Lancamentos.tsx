import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, DollarSign, Eye, Trash2, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { LancamentoDialog } from "@/components/lancamentos/LancamentoDialog";
import { Label } from "@/components/ui/label";
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

interface Lancamento {
  id_lancamento: number;
  descricao: string;
  valor: number;
  tipo: string;
  categoria: string;
  data: string;
}

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [filteredLancamentos, setFilteredLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const { toast } = useToast();

  useEffect(() => {
    fetchLancamentos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [lancamentos, filterTipo, filterCategoria]);

  const applyFilters = () => {
    let filtered = [...lancamentos];

    if (filterTipo !== "todos") {
      filtered = filtered.filter(l => l.tipo === filterTipo);
    }

    if (filterCategoria !== "todos") {
      filtered = filtered.filter(l => l.categoria === filterCategoria);
    }

    setFilteredLancamentos(filtered);
  };

  const categorias = Array.from(new Set(lancamentos.map(l => l.categoria).filter(Boolean)));
  const tipos = Array.from(new Set(lancamentos.map(l => l.tipo).filter(Boolean)));

  const fetchLancamentos = async () => {
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

      const { data, error } = await supabase
        .from('lancamento')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;

      setLancamentos(data || []);
      setFilteredLancamentos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar lançamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLancamento) return;

    try {
      const { error } = await supabase
        .from('lancamento')
        .delete()
        .eq('id_lancamento', selectedLancamento.id_lancamento);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso",
      });

      fetchLancamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir lançamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedLancamento(null);
    }
  };

  const totalDividas = filteredLancamentos
    .reduce((sum, l) => sum + Number(l.valor), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lançamentos</h1>
            <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
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
          <h1 className="text-3xl font-bold">Lançamentos</h1>
          <p className="text-muted-foreground">Registre suas dívidas por tipo de operação</p>
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
                  Filtre os lançamentos por tipo e categoria
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
                  <Label>Categoria</Label>
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {categorias.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setFilterTipo("todos");
                  setFilterCategoria("todos");
                }}>
                  Limpar Filtros
                </Button>
                <Button onClick={() => setFilterDialogOpen(false)}>
                  Aplicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <LancamentoDialog onSuccess={fetchLancamentos} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDividas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade de Lançamentos</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {filteredLancamentos.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Histórico de Dívidas</h2>
        {filteredLancamentos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma dívida registrada</p>
              <LancamentoDialog onSuccess={fetchLancamentos} />
            </CardContent>
          </Card>
        ) : (
          filteredLancamentos.map((lancamento) => (
            <Card key={lancamento.id_lancamento}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{lancamento.descricao}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive">
                        {lancamento.tipo}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Categoria: {lancamento.categoria}</span>
                      <span>Data: {new Date(lancamento.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-destructive">
                      {formatCurrency(Number(lancamento.valor))}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedLancamento(lancamento);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <LancamentoDialog 
                        lancamento={lancamento} 
                        onSuccess={fetchLancamentos} 
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedLancamento(lancamento);
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Lançamento</DialogTitle>
          </DialogHeader>
          {selectedLancamento && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="font-medium">{selectedLancamento.descricao}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tipo</Label>
                <p className="font-medium">{selectedLancamento.tipo}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Categoria</Label>
                <p className="font-medium">{selectedLancamento.categoria}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valor</Label>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(Number(selectedLancamento.valor))}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data</Label>
                <p className="font-medium">{new Date(selectedLancamento.data).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
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
