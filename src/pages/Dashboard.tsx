import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  FileText,
  AlertTriangle,
  Plus,
  Receipt
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalReceitas: number;
  totalDespesas: number;
  saldoAtual: number;
  totalDividas: number;
  dividasVencidas: number;
  movimentacoesHoje: number;
  gastosRegistrados: number;
  nfesEmitidas: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoAtual: 0,
    totalDividas: 0,
    dividasVencidas: 0,
    movimentacoesHoje: 0,
    gastosRegistrados: 0,
    nfesEmitidas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Buscar movimentações de caixa (receitas e despesas reais)
        const { data: movimentacoes } = await supabase
          .from('movimentacao_caixa')
          .select('*')
          .order('data', { ascending: false });

        // Buscar gastos registrados (lançamentos)
        const { data: lancamentos } = await supabase
          .from('lancamento')
          .select('*');

        // Buscar dívidas
        const { data: dividas } = await supabase
          .from('divida')
          .select('*');

        // Buscar NFes
        const { data: nfes } = await supabase
          .from('nfe')
          .select('*');

        // Calcular receitas (movimentacoes + lancamentos)
        let totalReceitas = 0;
        let totalDespesas = 0;
        
        if (movimentacoes) {
          const receitasCaixa = movimentacoes
            .filter(m => m.tipo === 'receita')
            .reduce((sum, m) => sum + Number(m.valor), 0);
          
          const despesasCaixa = movimentacoes
            .filter(m => m.tipo === 'despesa')
            .reduce((sum, m) => sum + Number(m.valor), 0);

          totalReceitas += receitasCaixa;
          totalDespesas += despesasCaixa;

          const hoje = new Date().toISOString().split('T')[0];
          const movimentacoesHoje = movimentacoes.filter(m => m.data === hoje).length;

          setStats(prev => ({
            ...prev,
            movimentacoesHoje,
          }));

          setRecentTransactions(movimentacoes.slice(0, 5));
        }

        if (lancamentos) {
          // Todos os lançamentos são considerados dívidas/despesas
          const despesasLancamentos = lancamentos
            .reduce((sum, l) => sum + Number(l.valor), 0);

          totalDespesas += despesasLancamentos;

          setStats(prev => ({
            ...prev,
            gastosRegistrados: lancamentos.length,
          }));
        }

        // Atualizar totais finais
        setStats(prev => ({
          ...prev,
          totalReceitas,
          totalDespesas,
          saldoAtual: totalReceitas - totalDespesas,
        }));

        if (dividas) {
          const totalDividas = dividas.reduce((sum, d) => sum + Number(d.valor_total || 0), 0);
          const hoje = new Date().toISOString().split('T')[0];
          const dividasVencidas = dividas.filter(d => 
            d.data_vencimento && d.data_vencimento < hoje && d.status !== 'paga'
          ).length;

          setStats(prev => ({
            ...prev,
            totalDividas,
            dividasVencidas,
          }));
        }

        if (nfes) {
          setStats(prev => ({
            ...prev,
            nfesEmitidas: nfes.length,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-20 mb-1"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas finanças
          </p>
        </div>
        {/* Apenas admin, analista e caixa podem acessar Nova Movimentação */}
        {(role === 'admin' || role === 'analista' || role === 'caixa') && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/caixa')} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.totalReceitas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de entradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de saídas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.saldoAtual >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.saldoAtual)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dívidas</CardTitle>
            <CreditCard className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(stats.totalDividas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.dividasVencidas > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.dividasVencidas} vencidas
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Movimentações Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.movimentacoesHoje}</div>
            <p className="text-xs text-muted-foreground">Entradas e saídas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gastosRegistrados}</div>
            <p className="text-xs text-muted-foreground">Aguardando NFe</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.dividasVencidas}</div>
            <p className="text-xs text-muted-foreground">Dívidas vencidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
          <CardDescription>
            Suas movimentações de caixa mais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma movimentação encontrada
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id_movimentacao}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.tipo === 'receita' ? 'bg-success' : 'bg-destructive'
                    }`} />
                    <div>
                      <div className="font-medium">{transaction.descricao || 'Sem descrição'}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.categoria} • {new Date(transaction.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className={`text-right font-medium ${
                    transaction.tipo === 'receita' ? 'text-success' : 'text-destructive'
                  }`}>
                    {transaction.tipo === 'receita' ? '+' : '-'}{formatCurrency(Number(transaction.valor))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}