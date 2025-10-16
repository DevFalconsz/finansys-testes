import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt, Download, Eye, Trash2, Search, Upload, FileText, Image, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface Comprovante {
  id_comprovante: number;
  tipo: string;
  arquivo: string;
  arquivo_url: string | null;
  id_lancamento: number | null;
  data_pagamento: string | null;
  id_usuario: number;
  created_at: string;
}

export default function Comprovantes() {
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newComprovante, setNewComprovante] = useState({
    tipo: "",
    data_pagamento: "",
    id_lancamento: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchComprovantes();
  }, []);

  const fetchComprovantes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive",
        });
        return;
      }

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

      const { data, error } = await supabase
        .from('comprovante')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComprovantes(data || []);
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os comprovantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Erro ao comprimir imagem'));
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleCreateComprovante = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    if (!newComprovante.tipo || !newComprovante.data_pagamento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!userData) throw new Error('Usuário não encontrado');

      // Comprimir imagem
      const compressedBlob = await compressImage(selectedFile);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, compressedBlob);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      // Inserir no banco
      const { error } = await supabase
        .from('comprovante')
        .insert([{
          tipo: newComprovante.tipo,
          arquivo: selectedFile.name,
          arquivo_url: fileName,
          data_pagamento: newComprovante.data_pagamento,
          id_lancamento: newComprovante.id_lancamento ? parseInt(newComprovante.id_lancamento) : null,
          id_usuario: userData.id_usuario
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comprovante enviado com sucesso",
      });

      setIsCreateOpen(false);
      setSelectedFile(null);
      setNewComprovante({
        tipo: "",
        data_pagamento: "",
        id_lancamento: ""
      });
      fetchComprovantes();
    } catch (error) {
      console.error('Erro ao criar comprovante:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comprovante",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (comprovante: Comprovante) => {
    if (!comprovante.arquivo_url) {
      toast({
        title: "Erro",
        description: "Arquivo não disponível",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('comprovantes')
        .createSignedUrl(comprovante.arquivo_url, 60);

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error('Erro ao visualizar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível visualizar o comprovante",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (comprovante: Comprovante) => {
    if (!comprovante.arquivo_url) {
      toast({
        title: "Erro",
        description: "Arquivo não disponível",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('comprovantes')
        .download(comprovante.arquivo_url);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = comprovante.arquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Sucesso",
          description: "Download iniciado",
        });
      }
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o comprovante",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (comprovante: Comprovante) => {
    if (!confirm('Deseja realmente excluir este comprovante?')) return;

    try {
      // Deletar do storage
      if (comprovante.arquivo_url) {
        await supabase.storage
          .from('comprovantes')
          .remove([comprovante.arquivo_url]);
      }

      // Deletar do banco
      const { error } = await supabase
        .from('comprovante')
        .delete()
        .eq('id_comprovante', comprovante.id_comprovante);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comprovante excluído com sucesso",
      });

      fetchComprovantes();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comprovante",
        variant: "destructive",
      });
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'recibo':
        return <Receipt className="h-5 w-5" />;
      case 'nota_fiscal':
        return <FileText className="h-5 w-5" />;
      case 'boleto':
        return <FileText className="h-5 w-5" />;
      case 'comprovante_pix':
        return <Receipt className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'recibo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'nota_fiscal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'boleto':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'comprovante_pix':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredComprovantes = comprovantes.filter(comprovante => {
    const matchesSearch = comprovante.arquivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.data_pagamento?.includes(searchTerm);
    const matchesFilter = filterTipo === "todos" || comprovante.tipo === filterTipo;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comprovantes</h1>
            <p className="text-muted-foreground">Gerencie seus comprovantes de pagamento</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Comprovantes</h1>
          <p className="text-muted-foreground">
            Gerencie seus comprovantes de pagamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload em Lote
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Novo Comprovante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Comprovante</DialogTitle>
                <DialogDescription>
                  Envie o comprovante de pagamento (imagem comprimida automaticamente)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Arquivo *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Comprovante *</Label>
                  <Select value={newComprovante.tipo} onValueChange={(value) => setNewComprovante({...newComprovante, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recibo">Recibo</SelectItem>
                      <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="comprovante_pix">Comprovante PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
                  <Input
                    id="data_pagamento"
                    type="date"
                    value={newComprovante.data_pagamento}
                    onChange={(e) => setNewComprovante({...newComprovante, data_pagamento: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="id_lancamento">ID do Lançamento (opcional)</Label>
                  <Input
                    id="id_lancamento"
                    type="number"
                    value={newComprovante.id_lancamento}
                    onChange={(e) => setNewComprovante({...newComprovante, id_lancamento: e.target.value})}
                    placeholder="123"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      setSelectedFile(null);
                    }}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateComprovante} 
                    className="bg-gradient-primary"
                    disabled={uploading}
                  >
                    {uploading ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {comprovantes.length}
            </div>
            <p className="text-xs text-muted-foreground">Comprovantes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recibos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {comprovantes.filter(c => c.tipo === 'recibo').length}
            </div>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {comprovantes.filter(c => c.tipo === 'comprovante_pix').length}
            </div>
            <p className="text-xs text-muted-foreground">Comprovantes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notas Fiscais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {comprovantes.filter(c => c.tipo === 'nota_fiscal').length}
            </div>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar comprovantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="recibo">Recibos</SelectItem>
                <SelectItem value="nota_fiscal">Notas Fiscais</SelectItem>
                <SelectItem value="boleto">Boletos</SelectItem>
                <SelectItem value="comprovante_pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferências</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Comprovantes List */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>Arquivo de Comprovantes</CardTitle>
          <CardDescription>
            Lista completa de todos os comprovantes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComprovantes.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterTipo !== "todos" 
                    ? "Nenhum comprovante encontrado com os critérios de busca" 
                    : "Nenhum comprovante registrado"
                  }
                </p>
                {!searchTerm && filterTipo === "todos" && (
                  <Button className="bg-gradient-primary" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primeiro Comprovante
                  </Button>
                )}
              </div>
            ) : (
              filteredComprovantes.map((comprovante) => (
                <div
                  key={comprovante.id_comprovante}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getTipoIcon(comprovante.tipo)}
                    </div>
                    <div>
                      <div className="font-medium">{comprovante.arquivo || 'Arquivo sem nome'}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {comprovante.data_pagamento && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(comprovante.data_pagamento).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {comprovante.id_lancamento && (
                          <span>• Lançamento #{comprovante.id_lancamento}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getTipoBadgeColor(comprovante.tipo)}>
                      {comprovante.tipo?.replace('_', ' ').toUpperCase() || 'INDEFINIDO'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Visualizar"
                        onClick={() => handlePreview(comprovante)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Baixar"
                        onClick={() => handleDownload(comprovante)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(comprovante)}
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Comprovante</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Comprovante" 
                className="w-full h-auto rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}