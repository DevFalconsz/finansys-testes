import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Plus, BarChart3, Download, Eye, FileText, TrendingUp, TrendingDown, PieChart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface Relatorio {
  id_relatorio: number;
  tipo: string;
  periodo: string;
  formato: string;
  id_usuario: number;
}

interface RelatorioData {
  totalReceitas: number;
  totalDespesas: number;
  totalDividas: number;
  saldo: number;
  transacoesPorCategoria: { [key: string]: number };
  transacoesPorTipo: { [key: string]: number };
  evolucaoMensal: { mes: string; receitas: number; despesas: number; dividas: number }[];
  lancamentos: any[];
  movimentacoes: any[];
}

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRelatorio, setSelectedRelatorio] = useState<Relatorio | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState("mes_atual");
  const [newRelatorio, setNewRelatorio] = useState({
    tipo: "",
    periodo: "",
    formato: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchRelatorios();
    generateRelatorioData();
  }, [selectedPeriodo]);

  const fetchRelatorios = async () => {
    try {
      const { data, error } = await supabase
        .from('relatorio')
        .select('*')
        .order('id_relatorio', { ascending: false });

      if (error) throw error;
      setRelatorios(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRelatorioData = async () => {
    try {
      const { data: lancamentos } = await supabase
        .from('lancamento')
        .select('*');

      const { data: movimentacoes } = await supabase
        .from('movimentacao_caixa')
        .select('*');

      if (lancamentos && movimentacoes) {
        // Filtrar por período
        let filteredLancamentos = lancamentos;
        let filteredMovimentacoes = movimentacoes;
        const hoje = new Date();
        
        if (selectedPeriodo === "mes_atual") {
          filteredLancamentos = lancamentos.filter(l => {
            const data = new Date(l.data);
            return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
          });
          filteredMovimentacoes = movimentacoes.filter(m => {
            const data = new Date(m.data);
            return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
          });
        } else if (selectedPeriodo === "ano_atual") {
          filteredLancamentos = lancamentos.filter(l => {
            const data = new Date(l.data);
            return data.getFullYear() === hoje.getFullYear();
          });
          filteredMovimentacoes = movimentacoes.filter(m => {
            const data = new Date(m.data);
            return data.getFullYear() === hoje.getFullYear();
          });
        }

        // Receitas vêm do caixa
        const receitas = filteredMovimentacoes
          .filter(m => m.tipo === 'receita')
          .reduce((sum, m) => sum + Number(m.valor), 0);
        
        // Despesas vêm do caixa (saídas)
        const despesasCaixa = filteredMovimentacoes
          .filter(m => m.tipo === 'despesa')
          .reduce((sum, m) => sum + Number(m.valor), 0);

        // Dívidas/lançamentos (todos são considerados dívidas)
        const dividas = filteredLancamentos
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const totalDespesas = despesasCaixa + dividas;

        // Agrupar por categoria (movimentações de caixa)
        const categorias = filteredMovimentacoes.reduce((acc, m) => {
          const categoria = m.categoria || 'Sem categoria';
          acc[categoria] = (acc[categoria] || 0) + Number(m.valor);
          return acc;
        }, {} as { [key: string]: number });

        // Agrupar por tipo de lançamento (dívidas)
        const tipos = filteredLancamentos.reduce((acc, l) => {
          const tipo = l.tipo || 'Outros';
          acc[tipo] = (acc[tipo] || 0) + Number(l.valor);
          return acc;
        }, {} as { [key: string]: number });

        // Evolução mensal (últimos 6 meses)
        const evolucao = [];
        for (let i = 5; i >= 0; i--) {
          const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
          const mesMovimentacoes = movimentacoes.filter(m => {
            const data = new Date(m.data);
            return data.getMonth() === mes.getMonth() && data.getFullYear() === mes.getFullYear();
          });
          const mesLancamentos = lancamentos.filter(l => {
            const data = new Date(l.data);
            return data.getMonth() === mes.getMonth() && data.getFullYear() === mes.getFullYear();
          });
          
          evolucao.push({
            mes: mes.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            receitas: mesMovimentacoes.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + Number(m.valor), 0),
            despesas: mesMovimentacoes.filter(m => m.tipo === 'despesa').reduce((sum, m) => sum + Number(m.valor), 0),
            dividas: mesLancamentos.reduce((sum, l) => sum + Number(l.valor), 0)
          });
        }

        setRelatorioData({
          totalReceitas: receitas,
          totalDespesas: despesasCaixa,
          totalDividas: dividas,
          saldo: receitas - totalDespesas,
          transacoesPorCategoria: categorias,
          transacoesPorTipo: tipos,
          evolucaoMensal: evolucao,
          lancamentos: filteredLancamentos,
          movimentacoes: filteredMovimentacoes
        });
      }
    } catch (error) {
      console.error('Erro ao gerar dados do relatório:', error);
    }
  };

  const handleCreateRelatorio = async () => {
    try {
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Obter o id_usuario da tabela usuario
      const { data: userData } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('relatorio')
        .insert([{
          tipo: newRelatorio.tipo,
          periodo: newRelatorio.periodo,
          formato: newRelatorio.formato,
          id_usuario: userData.id_usuario
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso",
      });

      setIsCreateOpen(false);
      setNewRelatorio({
        tipo: "",
        periodo: "",
        formato: ""
      });
      fetchRelatorios();
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  const handleViewRelatorio = (relatorio: Relatorio) => {
    setSelectedRelatorio(relatorio);
    setIsViewOpen(true);
  };

  const generatePDF = () => {
    if (!relatorioData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título
    doc.setFontSize(20);
    doc.text("Relatório Financeiro", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Período: ${selectedPeriodo.replace('_', ' ').toUpperCase()}`, 20, 35);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 42);

    // Resumo Financeiro
    doc.setFontSize(14);
    doc.text("Resumo Financeiro", 20, 55);
    doc.setFontSize(11);
    doc.text(`Receitas: ${formatCurrency(relatorioData.totalReceitas)}`, 20, 65);
    doc.text(`Despesas (Caixa): ${formatCurrency(relatorioData.totalDespesas)}`, 20, 72);
    doc.text(`Dívidas (Lançamentos): ${formatCurrency(relatorioData.totalDividas)}`, 20, 79);
    doc.text(`Total de Despesas: ${formatCurrency(relatorioData.totalDespesas + relatorioData.totalDividas)}`, 20, 86);
    doc.text(`Saldo: ${formatCurrency(relatorioData.saldo)}`, 20, 93);

    // Categorias
    let yPos = 110;
    doc.setFontSize(14);
    doc.text("Transações por Categoria", 20, yPos);
    doc.setFontSize(10);
    yPos += 10;
    
    Object.entries(relatorioData.transacoesPorCategoria)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([categoria, valor]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${categoria}: ${formatCurrency(valor)}`, 20, yPos);
        yPos += 7;
      });

    // Tipos de Dívidas
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.text("Dívidas por Tipo", 20, yPos);
    doc.setFontSize(10);
    yPos += 10;
    
    Object.entries(relatorioData.transacoesPorTipo)
      .sort(([,a], [,b]) => b - a)
      .forEach(([tipo, valor]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${tipo}: ${formatCurrency(valor)}`, 20, yPos);
        yPos += 7;
      });

    doc.save(`relatorio-${selectedPeriodo}-${new Date().getTime()}.pdf`);
    
    toast({
      title: "Download realizado",
      description: "PDF gerado com sucesso",
    });
  };

  const generateExcel = () => {
    if (!relatorioData) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Resumo
    const resumoData = [
      ["Relatório Financeiro"],
      [""],
      ["Período", selectedPeriodo.replace('_', ' ').toUpperCase()],
      ["Data", new Date().toLocaleDateString('pt-BR')],
      [""],
      ["Receitas", relatorioData.totalReceitas],
      ["Despesas (Caixa)", relatorioData.totalDespesas],
      ["Dívidas (Lançamentos)", relatorioData.totalDividas],
      ["Total de Despesas", relatorioData.totalDespesas + relatorioData.totalDividas],
      ["Saldo", relatorioData.saldo]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

    // Sheet 2: Categorias
    const categoriasData = [
      ["Categoria", "Valor"],
      ...Object.entries(relatorioData.transacoesPorCategoria).map(([cat, val]) => [cat, val])
    ];
    const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasData);
    XLSX.utils.book_append_sheet(wb, wsCategorias, "Categorias");

    // Sheet 3: Tipos de Dívidas
    const tiposData = [
      ["Tipo", "Valor"],
      ...Object.entries(relatorioData.transacoesPorTipo).map(([tipo, val]) => [tipo, val])
    ];
    const wsTipos = XLSX.utils.aoa_to_sheet(tiposData);
    XLSX.utils.book_append_sheet(wb, wsTipos, "Tipos de Dívidas");

    // Sheet 4: Movimentações
    const movimentacoesData = [
      ["Data", "Tipo", "Categoria", "Descrição", "Valor"],
      ...relatorioData.movimentacoes.map(m => [
        new Date(m.data).toLocaleDateString('pt-BR'),
        m.tipo,
        m.categoria || 'N/A',
        m.descricao || 'N/A',
        m.valor
      ])
    ];
    const wsMovimentacoes = XLSX.utils.aoa_to_sheet(movimentacoesData);
    XLSX.utils.book_append_sheet(wb, wsMovimentacoes, "Movimentações");

    // Sheet 5: Lançamentos/Dívidas
    const lancamentosData = [
      ["Data", "Tipo", "Categoria", "Descrição", "Valor"],
      ...relatorioData.lancamentos.map(l => [
        new Date(l.data).toLocaleDateString('pt-BR'),
        l.tipo,
        l.categoria || 'N/A',
        l.descricao || 'N/A',
        l.valor
      ])
    ];
    const wsLancamentos = XLSX.utils.aoa_to_sheet(lancamentosData);
    XLSX.utils.book_append_sheet(wb, wsLancamentos, "Lançamentos");

    XLSX.writeFile(wb, `relatorio-${selectedPeriodo}-${new Date().getTime()}.xlsx`);
    
    toast({
      title: "Download realizado",
      description: "Excel gerado com sucesso",
    });
  };

  const generateCSV = () => {
    if (!relatorioData) return;

    let csv = "Relatório Financeiro\n\n";
    csv += `Período,${selectedPeriodo.replace('_', ' ').toUpperCase()}\n`;
    csv += `Data,${new Date().toLocaleDateString('pt-BR')}\n\n`;
    csv += "Resumo Financeiro\n";
    csv += `Receitas,${relatorioData.totalReceitas}\n`;
    csv += `Despesas (Caixa),${relatorioData.totalDespesas}\n`;
    csv += `Dívidas (Lançamentos),${relatorioData.totalDividas}\n`;
    csv += `Total de Despesas,${relatorioData.totalDespesas + relatorioData.totalDividas}\n`;
    csv += `Saldo,${relatorioData.saldo}\n\n`;

    csv += "Transações por Categoria\n";
    csv += "Categoria,Valor\n";
    Object.entries(relatorioData.transacoesPorCategoria).forEach(([cat, val]) => {
      csv += `${cat},${val}\n`;
    });

    csv += "\nDívidas por Tipo\n";
    csv += "Tipo,Valor\n";
    Object.entries(relatorioData.transacoesPorTipo).forEach(([tipo, val]) => {
      csv += `${tipo},${val}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${selectedPeriodo}-${new Date().getTime()}.csv`;
    link.click();
    
    toast({
      title: "Download realizado",
      description: "CSV gerado com sucesso",
    });
  };

  const handleDownloadRelatorio = (relatorio: Relatorio) => {
    switch (relatorio.formato) {
      case 'pdf':
        generatePDF();
        break;
      case 'excel':
        generateExcel();
        break;
      case 'csv':
        generateCSV();
        break;
      default:
        toast({
          title: "Erro",
          description: "Formato não suportado",
          variant: "destructive",
        });
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'financeiro':
        return <BarChart3 className="h-5 w-5" />;
      case 'fluxo_caixa':
        return <TrendingUp className="h-5 w-5" />;
      case 'categorias':
        return <PieChart className="h-5 w-5" />;
      case 'impostos':
        return <FileText className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">Análises detalhadas das suas finanças</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises detalhadas das suas finanças
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mês Atual</SelectItem>
              <SelectItem value="ano_atual">Ano Atual</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerar Novo Relatório</DialogTitle>
                <DialogDescription>
                  Configure um novo relatório personalizado
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Relatório</Label>
                  <Select value={newRelatorio.tipo} onValueChange={(value) => setNewRelatorio({...newRelatorio, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financeiro">Relatório Financeiro</SelectItem>
                      <SelectItem value="fluxo_caixa">Fluxo de Caixa</SelectItem>
                      <SelectItem value="categorias">Por Categorias</SelectItem>
                      <SelectItem value="impostos">Relatório de Impostos</SelectItem>
                      <SelectItem value="dividas">Relatório de Dívidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Select value={newRelatorio.periodo} onValueChange={(value) => setNewRelatorio({...newRelatorio, periodo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mes_atual">Mês Atual</SelectItem>
                      <SelectItem value="trimestre">Trimestre</SelectItem>
                      <SelectItem value="semestre">Semestre</SelectItem>
                      <SelectItem value="ano_atual">Ano Atual</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="formato">Formato</Label>
                  <Select value={newRelatorio.formato} onValueChange={(value) => setNewRelatorio({...newRelatorio, formato: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRelatorio} className="bg-gradient-primary">
                    Gerar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard do Período Selecionado */}
      {relatorioData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(relatorioData.totalReceitas)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de entradas no período
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Despesas (Caixa)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(relatorioData.totalDespesas)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de saídas do caixa
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-destructive" />
                Dívidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(relatorioData.totalDividas)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${relatorioData.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(relatorioData.saldo)}
              </div>
              <p className="text-xs text-muted-foreground">
                Resultado do período
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Análise por Categorias */}
      {relatorioData && Object.keys(relatorioData.transacoesPorCategoria).length > 0 && (
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Análise por Categorias (Caixa)
            </CardTitle>
            <CardDescription>
              Distribuição de movimentações do caixa por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(relatorioData.transacoesPorCategoria)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([categoria, valor]) => (
                <div key={categoria} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="font-medium">{categoria}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(valor)}</div>
                    <div className="text-xs text-muted-foreground">
                      {((valor / (relatorioData.totalReceitas + relatorioData.totalDespesas)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise por Tipo de Dívida */}
      {relatorioData && Object.keys(relatorioData.transacoesPorTipo).length > 0 && (
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dívidas por Tipo
            </CardTitle>
            <CardDescription>
              Distribuição de dívidas por tipo de lançamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(relatorioData.transacoesPorTipo)
                .sort(([,a], [,b]) => b - a)
                .map(([tipo, valor]) => (
                <div key={tipo} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <span className="font-medium">{tipo}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-destructive">{formatCurrency(valor)}</div>
                    <div className="text-xs text-muted-foreground">
                      {((valor / relatorioData.totalDividas) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolução Mensal */}
      {relatorioData && relatorioData.evolucaoMensal.length > 0 && (
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Comparativo de receitas, despesas e dívidas nos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorioData.evolucaoMensal.map((item) => (
                <div key={item.mes} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.mes}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-success">
                      Receitas: {formatCurrency(item.receitas)}
                    </div>
                    <div className="text-destructive">
                      Despesas: {formatCurrency(item.despesas)}
                    </div>
                    <div className="text-destructive">
                      Dívidas: {formatCurrency(item.dividas)}
                    </div>
                    <div className={`font-bold ${(item.receitas - item.despesas - item.dividas) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      Saldo: {formatCurrency(item.receitas - item.despesas - item.dividas)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Relatórios */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
          <CardDescription>
            Histórico de relatórios criados anteriormente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relatorios.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum relatório gerado ainda</p>
                <Button className="bg-gradient-primary" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar Primeiro Relatório
                </Button>
              </div>
            ) : (
              relatorios.map((relatorio) => (
                <div
                  key={relatorio.id_relatorio}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getTipoIcon(relatorio.tipo)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {relatorio.tipo?.replace('_', ' ').toUpperCase() || 'RELATÓRIO'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{relatorio.periodo?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{relatorio.formato?.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Disponível
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Visualizar"
                        onClick={() => handleViewRelatorio(relatorio)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Baixar"
                        onClick={() => handleDownloadRelatorio(relatorio)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização do Relatório</DialogTitle>
            <DialogDescription>
              {selectedRelatorio && `${selectedRelatorio.tipo.replace('_', ' ').toUpperCase()} - ${selectedRelatorio.periodo.toUpperCase()}`}
            </DialogDescription>
          </DialogHeader>
          
          {relatorioData && (
            <div className="space-y-6">
              {/* Resumo Financeiro */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Resumo Financeiro</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-muted-foreground">Receitas</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(relatorioData.totalReceitas)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-muted-foreground">Despesas (Caixa)</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(relatorioData.totalDespesas)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-muted-foreground">Dívidas (Lançamentos)</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(relatorioData.totalDividas)}</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${relatorioData.saldo >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                    <p className="text-sm text-muted-foreground">Saldo</p>
                    <p className={`text-2xl font-bold ${relatorioData.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(relatorioData.saldo)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Movimentações de Caixa */}
              {relatorioData.movimentacoes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Movimentações de Caixa</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioData.movimentacoes.slice(0, 10).map((mov, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{new Date(mov.data).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant={mov.tipo === 'entrada' ? 'default' : 'destructive'}>
                                {mov.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>{mov.categoria || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">{mov.descricao || 'N/A'}</TableCell>
                            <TableCell className={`text-right font-medium ${mov.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(mov.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {relatorioData.movimentacoes.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Mostrando 10 de {relatorioData.movimentacoes.length} movimentações
                    </p>
                  )}
                </div>
              )}

              {/* Lançamentos/Dívidas */}
              {relatorioData.lancamentos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Lançamentos (Dívidas)</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioData.lancamentos.slice(0, 10).map((lanc, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{new Date(lanc.data).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{lanc.tipo}</Badge>
                            </TableCell>
                            <TableCell>{lanc.categoria || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">{lanc.descricao || 'N/A'}</TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {formatCurrency(lanc.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {relatorioData.lancamentos.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Mostrando 10 de {relatorioData.lancamentos.length} lançamentos
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => handleDownloadRelatorio(selectedRelatorio!)}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}