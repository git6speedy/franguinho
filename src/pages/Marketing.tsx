import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Image, ArrowUp, ArrowDown, Megaphone, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { supabase as sb } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import UpsellManager from "@/components/marketing/UpsellManager";

const supabase: any = sb;

interface Banner {
  id: string;
  url: string;
  order: number;
}

interface MonitorSettings {
  slideshowDelay: number; // in milliseconds
  idleTimeoutSeconds: number;
  fullscreenSlideshow: boolean;
}

export default function Marketing() {
  const [bannerUrl, setBannerUrl] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerBannerUrl, setBannerBannerUrl] = useState("");
  const [bannerBanners, setBannerBanners] = useState<Banner[]>([]);
  const [showEditBannerDialog, setShowEditBannerDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [showConfigureBannersDialog, setShowConfigureBannersDialog] = useState(false);
  const [showConfigureBannerBannersDialog, setShowConfigureBannerBannersDialog] = useState(false);

  // Monitor Settings states
  const [monitorSettings, setMonitorSettings] = useState<MonitorSettings>({
    slideshowDelay: 5000,
    idleTimeoutSeconds: 30,
    fullscreenSlideshow: false,
  });
  const [monitorSlideMode, setMonitorSlideMode] = useState<'off' | 'fullscreen' | 'banner' | 'both'>('off');
  const [monitorSlideDisappearMinutes, setMonitorSlideDisappearMinutes] = useState(5);

  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.store_id) {
      loadMarketingSettings();
    }
  }, [profile]);

  const loadMarketingSettings = async () => {
    if (!profile?.store_id) return;

    // Load Banners Fullscreen
    const { data: bannersFullscreenData, error: bannersFullscreenError } = await supabase
      .from("banners")
      .select("id, url, order, banner_type")
      .eq("store_id", profile.store_id)
      .eq("banner_type", "fullscreen")
      .order("order", { ascending: true });

    if (bannersFullscreenError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar banners fullscreen",
        description: bannersFullscreenError.message,
      });
    } else {
      setBanners(bannersFullscreenData || []);
    }

    // Load Banners Lateral
    const { data: bannersBannerData, error: bannersBannerError } = await supabase
      .from("banners")
      .select("id, url, order, banner_type")
      .eq("store_id", profile.store_id)
      .eq("banner_type", "banner")
      .order("order", { ascending: true });

    if (bannersBannerError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar banners laterais",
        description: bannersBannerError.message,
      });
    } else {
      setBannerBanners(bannersBannerData || []);
    }

    // Load Monitor Settings
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("monitor_slideshow_delay, monitor_idle_timeout_seconds, monitor_fullscreen_slideshow, monitor_slide_mode, monitor_slide_disappear_minutes")
      .eq("id", profile.store_id)
      .single();

    if (storeError) {
      console.error("Erro ao carregar configurações do monitor:", storeError.message);
    } else if (storeData) {
      setMonitorSettings({
        slideshowDelay: storeData.monitor_slideshow_delay || 5000,
        idleTimeoutSeconds: storeData.monitor_idle_timeout_seconds || 30,
        fullscreenSlideshow: storeData.monitor_fullscreen_slideshow || false,
      });
      setMonitorSlideMode(storeData.monitor_slide_mode || 'off');
      setMonitorSlideDisappearMinutes(storeData.monitor_slide_disappear_minutes || 5);
    }
  };

  const handleAddBanner = async (e: React.FormEvent, bannerType: 'fullscreen' | 'banner') => {
    e.preventDefault();
    const url = bannerType === 'fullscreen' ? bannerUrl : bannerBannerUrl;
    
    if (!url.trim()) {
      toast({
        variant: "destructive",
        title: "URL inválida",
        description: "Por favor, insira uma URL de imagem válida.",
      });
      return;
    }
    if (!profile?.store_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar vinculado a uma loja para adicionar banners.",
      });
      return;
    }

    const bannersList = bannerType === 'fullscreen' ? banners : bannerBanners;
    const newBannerData = {
      store_id: profile.store_id,
      url: url.trim(),
      order: bannersList.length + 1,
      banner_type: bannerType,
    };

    const { error } = await supabase.from("banners").insert(newBannerData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar banner",
        description: error.message,
      });
    } else {
      toast({
        title: "Banner adicionado!",
        description: "O novo banner foi adicionado à lista.",
      });
      if (bannerType === 'fullscreen') {
        setBannerUrl("");
      } else {
        setBannerBannerUrl("");
      }
      loadMarketingSettings();
    }
  };

  const openEditBannerDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setEditBannerUrl(banner.url);
    setShowEditBannerDialog(true);
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editBannerUrl.trim()) {
      toast({
        variant: "destructive",
        title: "URL inválida",
        description: "Por favor, insira uma URL de imagem válida.",
      });
      return;
    }

    const { error } = await supabase
      .from("banners")
      .update({ url: editBannerUrl.trim() })
      .eq("id", editingBanner.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar banner",
        description: error.message,
      });
    } else {
      toast({
        title: "Banner atualizado!",
      });
      setShowEditBannerDialog(false);
      setEditingBanner(null);
      setEditBannerUrl("");
      loadMarketingSettings(); // Reload all settings
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return;

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir banner",
        description: error.message,
      });
    } else {
      toast({
        title: "Banner excluído!",
      });
      setShowEditBannerDialog(false); // Close dialog if open
      setEditingBanner(null);
      setEditBannerUrl("");
      loadMarketingSettings(); // Reload all settings
    }
  };

  const handleMoveBanner = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    // Swap elements
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];
    
    // Update order in DB for both swapped banners
    const updatePromises = newBanners.map(async (banner, i) => {
      if (i === index || i === newIndex) { // Only update the two swapped banners
        const { error } = await supabase
          .from("banners")
          .update({ order: i + 1 })
          .eq("id", banner.id);
        if (error) throw error;
      }
    });

    try {
      await Promise.all(updatePromises);
      loadMarketingSettings(); // Reload to ensure UI is consistent with DB
      toast({ title: "Ordem do banner atualizada!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao reordenar banner",
        description: error.message,
      });
    }
  };

  const handleSaveMonitorSettings = async () => {
    if (!profile?.store_id) return;

    const { error } = await supabase
      .from("stores")
      .update({
        monitor_slideshow_delay: monitorSettings.slideshowDelay,
        monitor_idle_timeout_seconds: monitorSettings.idleTimeoutSeconds,
        monitor_fullscreen_slideshow: monitorSettings.fullscreenSlideshow,
        monitor_slide_mode: monitorSlideMode,
        monitor_slide_disappear_minutes: monitorSlideDisappearMinutes,
      })
      .eq("id", profile.store_id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações do monitor",
        description: error.message,
      });
    } else {
      toast({
        title: "Configurações do monitor salvas!",
        description: "As alterações foram aplicadas com sucesso.",
      });
      loadMarketingSettings();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="col-span-2 flex items-center gap-2">
        <Megaphone className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing</h1>
          <p className="text-muted-foreground">Gerencie banners, promoções e comunicação com clientes.</p>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gerenciamento de Banners
          </CardTitle>
          <CardDescription>
            Adicione e organize as imagens que aparecerão no topo da loja online e totem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Banners Fullscreen */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold">Banners Full Screen</h3>
            <div className="space-y-2">
              <Label htmlFor="bannerUrl">URL da Imagem do Banner Fullscreen</Label>
              <Input
                id="bannerUrl"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://exemplo.com/banner-promocional.jpg"
              />
              <p className="text-sm text-muted-foreground">
                Banners que aparecem em tela cheia durante o slideshow.
              </p>
            </div>
            <Button onClick={(e) => handleAddBanner(e, 'fullscreen')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Banner Fullscreen
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowConfigureBannersDialog(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configurar Banners Fullscreen ({banners.length})
            </Button>
          </div>

          {/* Banners Lateral */}
          <div className="space-y-4">
            <h3 className="font-semibold">Banners Laterais</h3>
            <div className="space-y-2">
              <Label htmlFor="bannerBannerUrl">URL da Imagem do Banner Lateral</Label>
              <Input
                id="bannerBannerUrl"
                type="url"
                value={bannerBannerUrl}
                onChange={(e) => setBannerBannerUrl(e.target.value)}
                placeholder="https://exemplo.com/banner-lateral.jpg"
              />
              <p className="text-sm text-muted-foreground">
                Banners laterais fixos à direita do monitor (1920x1080px recomendado).
              </p>
            </div>
            <Button onClick={(e) => handleAddBanner(e, 'banner')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Banner Lateral
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowConfigureBannerBannersDialog(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configurar Banners Laterais ({bannerBanners.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Configurar Banners Ativos */}
      <Dialog open={showConfigureBannersDialog} onOpenChange={setShowConfigureBannersDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Banners Ativos ({banners.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {banners.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum banner cadastrado.
              </p>
            ) : (
              banners.map((banner, index) => (
                <div 
                  key={banner.id} 
                  className="flex items-center gap-4 p-3 bg-accent rounded-lg border border-border"
                >
                  <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
                    <img 
                      src={banner.url} 
                      alt={`Banner ${index + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"; // Fallback image
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Banner #{index + 1}</p>
                    <p className="text-xs text-muted-foreground truncate">{banner.url}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Botões de Ordenação */}
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveBanner(banner.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveBanner(banner.id, 'down')}
                        disabled={index === banners.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Botão de Editar Banner */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditBannerDialog(banner)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Banner */}
      <Dialog open={showEditBannerDialog} onOpenChange={setShowEditBannerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Banner</DialogTitle>
          </DialogHeader>
          {editingBanner && (
            <form onSubmit={handleUpdateBanner} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editBannerUrl">URL da Imagem</Label>
                <Input
                  id="editBannerUrl"
                  type="url"
                  value={editBannerUrl}
                  onChange={(e) => setEditBannerUrl(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteBanner(editingBanner.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Banner
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditBannerDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Salvar Alterações
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Configurar Banners Laterais */}
      <Dialog open={showConfigureBannerBannersDialog} onOpenChange={setShowConfigureBannerBannersDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Banners Laterais Ativos ({bannerBanners.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {bannerBanners.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum banner lateral cadastrado.
              </p>
            ) : (
              bannerBanners.map((banner, index) => (
                <div 
                  key={banner.id} 
                  className="flex items-center gap-4 p-3 bg-accent rounded-lg border border-border"
                >
                  <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
                    <img 
                      src={banner.url} 
                      alt={`Banner ${index + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Banner Lateral #{index + 1}</p>
                    <p className="text-xs text-muted-foreground truncate">{banner.url}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveBanner(banner.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveBanner(banner.id, 'down')}
                        disabled={index === bannerBanners.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditBannerDialog(banner)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upsell Manager */}
      <UpsellManager />

      {/* Configurações do Monitor */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurações do Monitor
          </CardTitle>
          <CardDescription>
            Configure como os slides aparecem no monitor de pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Modo de Slide */}
          <div className="space-y-2">
            <Label htmlFor="slideMode">Modo de Exibição de Slides</Label>
            <Select value={monitorSlideMode} onValueChange={(value: any) => setMonitorSlideMode(value)}>
              <SelectTrigger id="slideMode">
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Desligado</SelectItem>
                <SelectItem value="fullscreen">Slide Full Screen</SelectItem>
                <SelectItem value="banner">Slide Banner (Lateral)</SelectItem>
                <SelectItem value="both">Full Screen + Banner Lateral</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {monitorSlideMode === 'off' && 'Slides desabilitados'}
              {monitorSlideMode === 'fullscreen' && 'Apenas slides em tela cheia durante ociosidade'}
              {monitorSlideMode === 'banner' && 'Banner lateral fixo ao lado dos pedidos'}
              {monitorSlideMode === 'both' && 'Ambos os slides ativos simultaneamente'}
            </p>
          </div>

          {/* Tempo de Inatividade */}
          {(monitorSlideMode === 'fullscreen' || monitorSlideMode === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="idleTimeoutSeconds">Tempo de Inatividade (segundos)</Label>
              <Input
                id="idleTimeoutSeconds"
                type="number"
                min="0"
                value={monitorSettings.idleTimeoutSeconds}
                onChange={(e) => setMonitorSettings({ ...monitorSettings, idleTimeoutSeconds: parseInt(e.target.value) || 0 })}
              />
              <p className="text-sm text-muted-foreground">
                Tempo sem atividade antes do slide fullscreen aparecer. 0 = nunca exibir.
              </p>
            </div>
          )}

          {/* Tempo de Desaparecer - Para fullscreen e both */}
          {(monitorSlideMode === 'fullscreen' || monitorSlideMode === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="disappearMinutes">Desaparecer após (minutos)</Label>
              <Input
                id="disappearMinutes"
                type="number"
                min="1"
                value={monitorSlideDisappearMinutes}
                onChange={(e) => setMonitorSlideDisappearMinutes(parseInt(e.target.value) || 5)}
              />
              <p className="text-sm text-muted-foreground">
                Tempo que o slide fullscreen fica visível antes de desaparecer
              </p>
            </div>
          )}

          {/* Velocidade do Slideshow */}
          {monitorSlideMode !== 'off' && (
            <div className="space-y-2">
              <Label htmlFor="slideshowDelay">Velocidade do Slideshow (milissegundos)</Label>
              <Input
                id="slideshowDelay"
                type="number"
                min="1000"
                step="1000"
                value={monitorSettings.slideshowDelay}
                onChange={(e) => setMonitorSettings({ ...monitorSettings, slideshowDelay: parseInt(e.target.value) || 5000 })}
              />
              <p className="text-sm text-muted-foreground">
                Intervalo entre cada banner no slideshow (recomendado: 5000ms)
              </p>
            </div>
          )}

          <Button onClick={handleSaveMonitorSettings} className="w-full">
            Salvar Configurações do Monitor
          </Button>
         </CardContent>
       </Card>
     </div>
   );
 }