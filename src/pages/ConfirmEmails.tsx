import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ConfirmEmails() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleConfirmAllEmails = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('confirm-all-emails');

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setResult(data);
      toast({
        title: "Sucesso!",
        description: `${data.newlyConfirmed} emails confirmados. ${data.alreadyConfirmed} já estavam confirmados.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar emails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirmar Todos os Emails</CardTitle>
          <CardDescription>
            Esta ferramenta confirma todos os emails de usuários existentes no banco de dados.
            Use esta função apenas uma vez para corrigir usuários já cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConfirmAllEmails} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Todos os Emails
          </Button>

          {result && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <p><strong>Total de usuários:</strong> {result.total}</p>
              <p><strong>Já confirmados:</strong> {result.alreadyConfirmed}</p>
              <p><strong>Recém confirmados:</strong> {result.newlyConfirmed}</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <strong>Erros:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {result.errors.map((err: any, idx: number) => (
                      <li key={idx}>{err.email}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
