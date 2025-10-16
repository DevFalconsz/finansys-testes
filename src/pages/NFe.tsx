import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Download, Eye, Edit, Trash2, Search, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface NFe {
  id_nfe: number;
  numero: string;
  serie: string;
  valor: number;
  data_emissao: string;
  xml: string;
  id_lancamento: number;
}

interface Lancamento {
  id_lancamento: number;
  descricao: string;
  data: string;
  valor: number;
  tipo: string;
}

export default function NFe() {
  const [nfes, setNfes] = useState<NFe[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedNfe, setSelectedNfe] = useState<NFe | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newNfe, setNewNfe] = useState({
    numero: "",
    serie: "",
    valor: "",
    data_emissao: "",
    xml: "",
    id_lancamento: ""
  });
  const [editNfe, setEditNfe] = useState({
    numero: "",
    serie: "",
    valor: "",
    data_emissao: "",
    xml: "",
    id_lancamento: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNFes();
    fetchLancamentos();
  }, []);

  const fetchLancamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('lancamento')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os lançamentos",
        variant: "destructive",
      });
    }
  };

  const fetchNFes = async () => {
    try {
      const { data, error } = await supabase
        .from('nfe')
        .select('*')
        .order('data_emissao', { ascending: false });

      if (error) throw error;
      setNfes(data || []);
    } catch (error) {
      console.error('Erro ao carregar NFes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as NFes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNFe = async () => {
    try {
      const { error } = await supabase
        .from('nfe')
        .insert([{
          numero: newNfe.numero,
          serie: newNfe.serie,
          valor: parseFloat(newNfe.valor),
          data_emissao: newNfe.data_emissao,
          xml: newNfe.xml,
          id_lancamento: parseInt(newNfe.id_lancamento)
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "NFe criada com sucesso",
      });

      setIsCreateOpen(false);
      setNewNfe({
        numero: "",
        serie: "",
        valor: "",
        data_emissao: "",
        xml: "",
        id_lancamento: ""
      });
      fetchNFes();
    } catch (error) {
      console.error('Erro ao criar NFe:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a NFe",
        variant: "destructive",
      });
    }
  };

  const handleViewXml = (nfe: NFe) => {
    setSelectedNfe(nfe);
    setIsViewOpen(true);
  };

  const handleDownloadXml = (nfe: NFe) => {
    try {
      const blob = new Blob([nfe.xml], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NFe_${nfe.numero}_${nfe.serie}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Sucesso",
        description: "XML baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o XML",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (nfe: NFe) => {
    setSelectedNfe(nfe);
    setEditNfe({
      numero: nfe.numero,
      serie: nfe.serie,
      valor: nfe.valor.toString(),
      data_emissao: nfe.data_emissao,
      xml: nfe.xml,
      id_lancamento: nfe.id_lancamento.toString()
    });
    setIsEditOpen(true);
  };

  const handleUpdateNFe = async () => {
    if (!selectedNfe) return;
    
    try {
      const { error } = await supabase
        .from('nfe')
        .update({
          numero: editNfe.numero,
          serie: editNfe.serie,
          valor: parseFloat(editNfe.valor),
          data_emissao: editNfe.data_emissao,
          xml: editNfe.xml,
          id_lancamento: parseInt(editNfe.id_lancamento)
        })
        .eq('id_nfe', selectedNfe.id_nfe);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "NFe atualizada com sucesso",
      });

      setIsEditOpen(false);
      setSelectedNfe(null);
      fetchNFes();
    } catch (error) {
      console.error('Erro ao atualizar NFe:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a NFe",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNFe = async (nfe: NFe) => {
    if (!confirm(`Deseja realmente excluir a NFe ${nfe.numero} - Série ${nfe.serie}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('nfe')
        .delete()
        .eq('id_nfe', nfe.id_nfe);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "NFe excluída com sucesso",
      });

      fetchNFes();
    } catch (error) {
      console.error('Erro ao excluir NFe:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a NFe",
        variant: "destructive",
      });
    }
  };

  const handleImportXml = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const xmlText = await file.text();
      
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Extract NFe data from XML
      const numero = xmlDoc.getElementsByTagName("nNF")[0]?.textContent || "";
      const serie = xmlDoc.getElementsByTagName("serie")[0]?.textContent || "";
      const valorElement = xmlDoc.getElementsByTagName("vNF")[0]?.textContent || "0";
      const valor = valorElement.replace(",", ".");
      const dataEmissao = xmlDoc.getElementsByTagName("dhEmi")[0]?.textContent || "";
      const dataFormatted = dataEmissao ? new Date(dataEmissao).toISOString().split('T')[0] : "";

      // Populate form with extracted data
      setNewNfe({
        numero,
        serie,
        valor,
        data_emissao: dataFormatted,
        xml: xmlText,
        id_lancamento: ""
      });

      setIsImportOpen(false);
      setIsCreateOpen(true);

      toast({
        title: "Sucesso",
        description: "XML importado com sucesso. Revise os dados e selecione o lançamento.",
      });
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      toast({
        title: "Erro",
        description: "Não foi possível importar o XML. Verifique se o arquivo está no formato correto.",
        variant: "destructive",
      });
    }
  };

  const filteredNFes = nfes.filter(nfe =>
    nfe.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nfe.serie?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NFe</h1>
            <p className="text-muted-foreground">Gerencie suas Notas Fiscais Eletrônicas</p>
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
          <h1 className="text-3xl font-bold tracking-tight">NFe</h1>
          <p className="text-muted-foreground">
            Gerencie suas Notas Fiscais Eletrônicas
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar XML
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Importar XML da NFe</DialogTitle>
                <DialogDescription>
                  Selecione um arquivo XML de NFe para importar os dados automaticamente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept=".xml"
                    onChange={handleImportXml}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecione um arquivo XML da NFe
                  </p>
                </div>
                <Button variant="outline" onClick={() => setIsImportOpen(false)} className="w-full">
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nova NFe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Nota Fiscal Eletrônica</DialogTitle>
                <DialogDescription>
                  Registre uma nova NFe no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={newNfe.numero}
                      onChange={(e) => setNewNfe({...newNfe, numero: e.target.value})}
                      placeholder="000123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serie">Série</Label>
                    <Input
                      id="serie"
                      value={newNfe.serie}
                      onChange={(e) => setNewNfe({...newNfe, serie: e.target.value})}
                      placeholder="001"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={newNfe.valor}
                    onChange={(e) => setNewNfe({...newNfe, valor: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="data_emissao">Data de Emissão</Label>
                  <Input
                    id="data_emissao"
                    type="date"
                    value={newNfe.data_emissao}
                    onChange={(e) => setNewNfe({...newNfe, data_emissao: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="id_lancamento">Lançamento Vinculado</Label>
                  <Select
                    value={newNfe.id_lancamento}
                    onValueChange={(value) => setNewNfe({...newNfe, id_lancamento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um lançamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {lancamentos.map((lancamento) => (
                        <SelectItem key={lancamento.id_lancamento} value={lancamento.id_lancamento.toString()}>
                          {lancamento.descricao} - {formatCurrency(Number(lancamento.valor))} ({new Date(lancamento.data).toLocaleDateString('pt-BR')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="xml">Conteúdo XML</Label>
                  <Textarea
                    id="xml"
                    value={newNfe.xml}
                    onChange={(e) => setNewNfe({...newNfe, xml: e.target.value})}
                    placeholder="Cole aqui o conteúdo XML da NFe..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateNFe} className="bg-gradient-primary">
                    Criar NFe
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de NFes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {nfes.length}
            </div>
            <p className="text-xs text-muted-foreground">Notas emitidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(nfes.reduce((sum, nfe) => sum + Number(nfe.valor || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Valor das notas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {nfes.filter(nfe => {
                const nfeDate = new Date(nfe.data_emissao);
                const currentDate = new Date();
                return nfeDate.getMonth() === currentDate.getMonth() && 
                       nfeDate.getFullYear() === currentDate.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Notas do mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por número ou série da NFe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* NFes List */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>Histórico de NFes</CardTitle>
          <CardDescription>
            Lista completa de todas as Notas Fiscais Eletrônicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNFes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Nenhuma NFe encontrada com os critérios de busca" : "Nenhuma NFe registrada"}
                </p>
                {!searchTerm && (
                  <Button className="bg-gradient-primary" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primeira NFe
                  </Button>
                )}
              </div>
            ) : (
              filteredNFes.map((nfe) => (
                <div
                  key={nfe.id_nfe}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">NFe {nfe.numero} - Série {nfe.serie}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span className="font-medium text-success">
                          {formatCurrency(Number(nfe.valor || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Emitida
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Visualizar XML"
                        onClick={() => handleViewXml(nfe)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Baixar XML"
                        onClick={() => handleDownloadXml(nfe)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Editar"
                        onClick={() => handleEditClick(nfe)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        title="Excluir"
                        onClick={() => handleDeleteNFe(nfe)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Visualizar XML */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Visualizar XML da NFe</DialogTitle>
            <DialogDescription>
              {selectedNfe && `NFe ${selectedNfe.numero} - Série ${selectedNfe.serie}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              value={selectedNfe?.xml || ""}
              readOnly
              rows={20}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
            <Button 
              onClick={() => selectedNfe && handleDownloadXml(selectedNfe)}
              className="bg-gradient-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar XML
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar NFe */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Nota Fiscal Eletrônica</DialogTitle>
            <DialogDescription>
              Atualize as informações da NFe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-numero">Número</Label>
                <Input
                  id="edit-numero"
                  value={editNfe.numero}
                  onChange={(e) => setEditNfe({...editNfe, numero: e.target.value})}
                  placeholder="000123"
                />
              </div>
              <div>
                <Label htmlFor="edit-serie">Série</Label>
                <Input
                  id="edit-serie"
                  value={editNfe.serie}
                  onChange={(e) => setEditNfe({...editNfe, serie: e.target.value})}
                  placeholder="001"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-valor">Valor</Label>
              <Input
                id="edit-valor"
                type="number"
                step="0.01"
                value={editNfe.valor}
                onChange={(e) => setEditNfe({...editNfe, valor: e.target.value})}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="edit-data_emissao">Data de Emissão</Label>
              <Input
                id="edit-data_emissao"
                type="date"
                value={editNfe.data_emissao}
                onChange={(e) => setEditNfe({...editNfe, data_emissao: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-id_lancamento">Lançamento Vinculado</Label>
              <Select
                value={editNfe.id_lancamento}
                onValueChange={(value) => setEditNfe({...editNfe, id_lancamento: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lançamento" />
                </SelectTrigger>
                <SelectContent>
                  {lancamentos.map((lancamento) => (
                    <SelectItem key={lancamento.id_lancamento} value={lancamento.id_lancamento.toString()}>
                      {lancamento.descricao} - {formatCurrency(Number(lancamento.valor))} ({new Date(lancamento.data).toLocaleDateString('pt-BR')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-xml">Conteúdo XML</Label>
              <Textarea
                id="edit-xml"
                value={editNfe.xml}
                onChange={(e) => setEditNfe({...editNfe, xml: e.target.value})}
                placeholder="Cole aqui o conteúdo XML da NFe..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateNFe} className="bg-gradient-primary">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}