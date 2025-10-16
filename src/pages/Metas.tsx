import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, TrendingUp, Calendar, Edit, Trash2, CheckCircle, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Meta {
  id_meta: number;
  descricao: string;
  valor_objetivo: number;
  periodo: string;
  id_usuario: number;
}

interface MetaWithProgress extends Meta {
  valorAtual: number;
  percentual: number;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'vencida';
}

export default function Metas() {
  const [metas, setMetas] = useState<MetaWithProgress[]>([]);
  const [filteredMetas, setFilteredMetas] = useState<MetaWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<MetaWithProgress | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("todos");
  const [newMeta, setNewMeta] = useState({
    descricao: "",
    valor_objetivo: "",
    periodo: ""
  });
  const [editMeta, setEditMeta] = useState({
    descricao: "",
    valor_objetivo: "",
    periodo: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMetas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [metas, filterStatus, filterPeriodo]);

  const applyFilters = () => {
    let filtered = [...metas];

    if (filterStatus !== "todos") {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    if (filterPeriodo !== "todos") {
      filtered = filtered.filter(m => m.periodo === filterPeriodo);
    }

    setFilteredMetas(filtered);
  };

  const fetchMetas = async () => {
    try {
      const { data: metasData, error } = await supabase
        .from('meta')
        .select('*')
        .order('id_meta', { ascending: false });

      if (error) throw error;

      // Buscar lançamentos para calcular progresso
      const { data: lancamentos } = await supabase
        .from('lancamento')
        .select('*');

      if (metasData) {
        const metasWithProgress = metasData.map(meta => {
          let valorAtual = 0;
          
          // Calcular valor atual baseado no período da meta
          if (lancamentos) {
            const hoje = new Date();
            let filteredLancamentos = lancamentos;
            
            if (meta.periodo === 'mensal') {
              filteredLancamentos = lancamentos.filter(l => {
                const data = new Date(l.data);
                return data.getMonth() === hoje.getMonth() && 
                       data.getFullYear() === hoje.getFullYear();
              });
            } else if (meta.periodo === 'anual') {
              filteredLancamentos = lancamentos.filter(l => {
                const data = new Date(l.data);
                return data.getFullYear() === hoje.getFullYear();
              });
            }
            
            valorAtual = filteredLancamentos
              .filter(l => l.tipo === 'receita')
              .reduce((sum, l) => sum + Number(l.valor), 0);
          }

          const percentual = meta.valor_objetivo > 0 ? (valorAtual / meta.valor_objetivo) * 100 : 0;
          
          let status: 'pendente' | 'em_andamento' | 'concluida' | 'vencida' = 'pendente';
          if (percentual >= 100) {
            status = 'concluida';
          } else if (percentual > 0) {
            status = 'em_andamento';
          }

          return {
            ...meta,
            valorAtual,
            percentual: Math.min(percentual, 100),
            status
          };
        });

        setMetas(metasWithProgress);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeta = async () => {
    try {
      // Obter o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar o id_usuario da tabela usuario
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { error } = await supabase
        .from('meta')
        .insert([{
          descricao: newMeta.descricao,
          valor_objetivo: parseFloat(newMeta.valor_objetivo),
          periodo: newMeta.periodo,
          id_usuario: userData.id_usuario
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Meta criada com sucesso",
      });

      setIsCreateOpen(false);
      setNewMeta({
        descricao: "",
        valor_objetivo: "",
        periodo: ""
      });
      fetchMetas();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta",
        variant: "destructive",
      });
    }
  };

  const handleEditMeta = async () => {
    if (!selectedMeta) return;

    try {
      const { error } = await supabase
        .from('meta')
        .update({
          descricao: editMeta.descricao,
          valor_objetivo: parseFloat(editMeta.valor_objetivo),
          periodo: editMeta.periodo,
        })
        .eq('id_meta', selectedMeta.id_meta);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Meta atualizada com sucesso",
      });

      setIsEditOpen(false);
      setSelectedMeta(null);
      fetchMetas();
    } catch (error) {
      console.error('Erro ao editar meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível editar a meta",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeta = async () => {
    if (!selectedMeta) return;

    try {
      const { error } = await supabase
        .from('meta')
        .delete()
        .eq('id_meta', selectedMeta.id_meta);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Meta excluída com sucesso",
      });

      setIsDeleteOpen(false);
      setSelectedMeta(null);
      fetchMetas();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a meta",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (meta: MetaWithProgress) => {
    setSelectedMeta(meta);
    setEditMeta({
      descricao: meta.descricao,
      valor_objetivo: meta.valor_objetivo.toString(),
      periodo: meta.periodo
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (meta: MetaWithProgress) => {
    setSelectedMeta(meta);
    setIsDeleteOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluida':
        return <Badge className="bg-success text-success-foreground">Concluída</Badge>;
      case 'em_andamento':
        return <Badge className="bg-warning text-warning-foreground">Em Andamento</Badge>;
      case 'vencida':
        return <Badge className="bg-destructive text-destructive-foreground">Vencida</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getProgressColor = (percentual: number, status: string) => {
    if (status === 'concluida') return 'bg-success';
    if (percentual >= 75) return 'bg-warning';
    if (percentual >= 50) return 'bg-primary';
    return 'bg-muted';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Metas Financeiras</h1>
            <p className="text-muted-foreground">Defina e acompanhe seus objetivos financeiros</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metasConcluidas = metas.filter(m => m.status === 'concluida').length;
  const metasEmAndamento = metas.filter(m => m.status === 'em_andamento').length;
  const valorTotalMetas = filteredMetas.reduce((sum, m) => sum + m.valor_objetivo, 0);
  const valorAtualTotal = filteredMetas.reduce((sum, m) => sum + m.valorAtual, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Metas Financeiras</h1>
            <p className="text-muted-foreground">
              Defina e acompanhe seus objetivos financeiros
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Meta Financeira</DialogTitle>
              <DialogDescription>
                Defina um novo objetivo financeiro para acompanhar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição da Meta</Label>
                <Textarea
                  id="descricao"
                  value={newMeta.descricao}
                  onChange={(e) => setNewMeta({...newMeta, descricao: e.target.value})}
                  placeholder="Ex: Economizar para viagem de férias"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="valor_objetivo">Valor Objetivo</Label>
                <Input
                  id="valor_objetivo"
                  type="number"
                  step="0.01"
                  value={newMeta.valor_objetivo}
                  onChange={(e) => setNewMeta({...newMeta, valor_objetivo: e.target.value})}
                  placeholder="5000.00"
                />
              </div>
              <div>
                <Label htmlFor="periodo">Período</Label>
                <Select value={newMeta.periodo} onValueChange={(value) => setNewMeta({...newMeta, periodo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateMeta} className="bg-gradient-primary">
                  Criar Meta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>

        {/* Filtros */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="filter-status" className="text-sm">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="filter-periodo" className="text-sm">Período</Label>
                  <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                    <SelectTrigger id="filter-periodo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Períodos</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metas.length}
            </div>
            <p className="text-xs text-muted-foreground">Objetivos definidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {metasConcluidas}
            </div>
            <p className="text-xs text-muted-foreground">Metas atingidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {metasEmAndamento}
            </div>
            <p className="text-xs text-muted-foreground">Em progresso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {valorTotalMetas > 0 ? Math.round((valorAtualTotal / valorTotalMetas) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">De todas as metas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      <div className="space-y-4">
        {filteredMetas.length === 0 ? (
          <Card className="bg-gradient-card shadow-card border-0">
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {metas.length === 0 ? "Nenhuma meta financeira definida" : "Nenhuma meta encontrada com os filtros selecionados"}
              </p>
              {metas.length === 0 && (
                <Button className="bg-gradient-primary" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Definir Primeira Meta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMetas.map((meta) => (
            <Card key={meta.id_meta} className="bg-gradient-card shadow-card border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {meta.status === 'concluida' ? (
                        <CheckCircle className="h-6 w-6 text-success" />
                      ) : (
                        <Target className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{meta.descricao}</CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        {getStatusBadge(meta.status)}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {meta.periodo?.charAt(0).toUpperCase() + meta.periodo?.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(meta)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(meta)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(meta.valorAtual)}</span>
                      <span className="text-muted-foreground">de</span>
                      <span className="font-medium">{formatCurrency(meta.valor_objetivo)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={meta.percentual} 
                      className="h-3" 
                    />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{meta.percentual.toFixed(1)}% concluído</span>
                      <span className="text-muted-foreground">
                        Faltam {formatCurrency(Math.max(0, meta.valor_objetivo - meta.valorAtual))}
                      </span>
                    </div>
                  </div>

                  {meta.status === 'concluida' && (
                    <div className="flex items-center gap-2 text-success text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Meta atingida! Parabéns!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Meta Financeira</DialogTitle>
            <DialogDescription>
              Atualize as informações da sua meta financeira
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-descricao">Descrição da Meta</Label>
              <Textarea
                id="edit-descricao"
                value={editMeta.descricao}
                onChange={(e) => setEditMeta({...editMeta, descricao: e.target.value})}
                placeholder="Ex: Economizar para viagem de férias"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-valor_objetivo">Valor Objetivo</Label>
              <Input
                id="edit-valor_objetivo"
                type="number"
                step="0.01"
                value={editMeta.valor_objetivo}
                onChange={(e) => setEditMeta({...editMeta, valor_objetivo: e.target.value})}
                placeholder="5000.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-periodo">Período</Label>
              <Select value={editMeta.periodo} onValueChange={(value) => setEditMeta({...editMeta, periodo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditMeta} className="bg-gradient-primary">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
              {selectedMeta && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedMeta.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    Objetivo: {formatCurrency(selectedMeta.valor_objetivo)}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeta} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Meta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}