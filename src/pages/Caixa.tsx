import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, TrendingUp, TrendingDown, DollarSign, Eye, Trash2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
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

interface Movimentacao {
  id_movimentacao: number;
  descricao: string;
  valor: number;
  tipo: string;
  categoria: string;
  data: string;
}

export default function Caixa() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [filteredMovimentacoes, setFilteredMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMovimentacao, setSelectedMovimentacao] = useState<Movimentacao | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "receita",
    categoria: "",
    data: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMovimentacoes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movimentacoes, filterTipo, filterCategoria]);

  const applyFilters = () => {
    let filtered = [...movimentacoes];

    if (filterTipo !== "todos") {
      filtered = filtered.filter(m => m.tipo === filterTipo);
    }

    if (filterCategoria !== "todos") {
      filtered = filtered.filter(m => m.categoria === filterCategoria);
    }

    setFilteredMovimentacoes(filtered);
  };

  const categorias = Array.from(new Set(movimentacoes.map(m => m.categoria).filter(Boolean)));

  const fetchMovimentacoes = async () => {
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
        .from('movimentacao_caixa')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;

      setMovimentacoes(data || []);
      setFilteredMovimentacoes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar movimentações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      const { error } = await supabase
        .from('movimentacao_caixa')
        .insert({
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          tipo: formData.tipo,
          categoria: formData.categoria,
          data: formData.data,
          id_usuario: usuario.id_usuario,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      });

      setDialogOpen(false);
      setFormData({
        descricao: "",
        valor: "",
        tipo: "receita",
        categoria: "",
        data: new Date().toISOString().split('T')[0],
      });
      fetchMovimentacoes();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedMovimentacao) return;

    try {
      const { error } = await supabase
        .from('movimentacao_caixa')
        .delete()
        .eq('id_movimentacao', selectedMovimentacao.id_movimentacao);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Movimentação excluída com sucesso",
      });

      fetchMovimentacoes();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir movimentação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedMovimentacao(null);
    }
  };

  const totalEntradas = filteredMovimentacoes
    .filter((m) => m.tipo === "receita")
    .reduce((sum, m) => sum + Number(m.valor), 0);

  const totalSaidas = filteredMovimentacoes
    .filter((m) => m.tipo === "despesa")
    .reduce((sum, m) => sum + Number(m.valor), 0);

  const saldo = totalEntradas - totalSaidas;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Entrada e Saída de Caixa</h1>
            <p className="text-muted-foreground">Gerencie suas movimentações financeiras</p>
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
          <h1 className="text-3xl font-bold">Entrada e Saída de Caixa</h1>
          <p className="text-muted-foreground">Gerencie pagamentos, recebimentos e reembolsos</p>
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
                  Filtre as movimentações por tipo e categoria
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
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Movimentação de Caixa</DialogTitle>
                <DialogDescription>
                  Registre uma entrada ou saída de caixa
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Entrada</SelectItem>
                        <SelectItem value="despesa">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      required
                    />
                  </div>
                  <div>
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
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalEntradas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalSaidas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Histórico de Movimentações</h2>
        {filteredMovimentacoes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma movimentação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredMovimentacoes.map((movimentacao) => (
            <Card key={movimentacao.id_movimentacao}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{movimentacao.descricao}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        movimentacao.tipo === 'receita' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {movimentacao.tipo === 'receita' ? 'Entrada' : 'Saída'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Categoria: {movimentacao.categoria}</span>
                      <span>Data: {new Date(movimentacao.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${
                      movimentacao.tipo === 'receita' ? 'text-success' : 'text-destructive'
                    }`}>
                      {movimentacao.tipo === 'receita' ? '+' : '-'} {formatCurrency(Number(movimentacao.valor))}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedMovimentacao(movimentacao);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedMovimentacao(movimentacao);
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
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
          </DialogHeader>
          {selectedMovimentacao && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="font-medium">{selectedMovimentacao.descricao}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tipo</Label>
                <p className="font-medium capitalize">{selectedMovimentacao.tipo === 'receita' ? 'Entrada' : 'Saída'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Categoria</Label>
                <p className="font-medium">{selectedMovimentacao.categoria}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valor</Label>
                <p className={`text-2xl font-bold ${
                  selectedMovimentacao.tipo === 'receita' ? 'text-success' : 'text-destructive'
                }`}>
                  {selectedMovimentacao.tipo === 'receita' ? '+' : '-'} {formatCurrency(Number(selectedMovimentacao.valor))}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data</Label>
                <p className="font-medium">{new Date(selectedMovimentacao.data).toLocaleDateString('pt-BR')}</p>
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
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
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
