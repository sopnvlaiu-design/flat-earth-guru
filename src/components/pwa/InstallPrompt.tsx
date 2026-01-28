import { useState, useEffect } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    
    const result = await install();
    if (result.success) {
      console.log("App installed successfully!");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  };

  // Don't show if installed, dismissed, or not installable (and not iOS)
  if (isInstalled || dismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-xl shadow-lg p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <img 
                src="/icon-192.png" 
                alt="Infinito IA" 
                className="w-10 h-10 rounded-lg"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                Instalar Infinito IA
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acesse mais rápido direto da tela inicial
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleInstall}
            className="w-full mt-3 gap-2"
            size="sm"
          >
            <Download className="w-4 h-4" />
            Instalar Aplicativo
          </Button>
        </div>
      </div>

      {/* iOS Installation Guide */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar no iPhone/iPad</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para instalar o Infinito IA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Toque no botão <Share className="w-4 h-4 inline-block mx-1" /> Compartilhar
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Na barra inferior do Safari
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Role e toque em <Plus className="w-4 h-4 inline-block mx-1" /> "Adicionar à Tela de Início"
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Toque em "Adicionar" no canto superior direito
                </p>
              </div>
            </div>
          </div>
          
          <Button onClick={() => setShowIOSGuide(false)} className="w-full">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
