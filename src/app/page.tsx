'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, Image as ImageIcon, Download, Settings, LayoutTemplate, ChevronLeft, ChevronRight } from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';

interface Slide {
  slide_order: number;
  content_text: string;
  image_prompt: string;
  generated_image_url?: string;
  isGenerating?: boolean;
}

interface BrandSettings {
  persona_image_url: string;
  logo_url: string;
}

export default function Home() {
  const [idea, setIdea] = useState('');
  const [isGeneratingBrain, setIsGeneratingBrain] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [title, setTitle] = useState('');
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [localPersonaUrl, setLocalPersonaUrl] = useState('');
  const [format, setFormat] = useState('4:5');
  const [slideCount, setSlideCount] = useState<number>(5);
  const [aiModel, setAiModel] = useState('imagen-3');
  const [imagenModel, setImagenModel] = useState('imagen-3.0-generate-002');
  const [resolution, setResolution] = useState('standard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        setBrandSettings(data);
      }
    }
    fetchSettings();
    setLocalPersonaUrl(localStorage.getItem('persona_image_url') || '');
  }, []);

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    setLocalPersonaUrl(localStorage.getItem('persona_image_url') || '');
  };

  const handleGenerateBrain = async () => {
    if (!idea) return;
    
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert('Por favor, configure sua chave do Gemini nas Settings primeiro.');
      setIsSettingsOpen(true);
      return;
    }

    setIsGeneratingBrain(true);
    try {
      const res = await fetch('/api/generate-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, apiKey, slideCount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTitle(data.title);
      setSlides(data.slides);
      setCurrentSlideIndex(0);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar ideias. Tente novamente.');
    } finally {
      setIsGeneratingBrain(false);
    }
  };

  const handleGenerateImage = async (index: number) => {
    const activePersonaUrl = localPersonaUrl || brandSettings?.persona_image_url;
    
    if (!activePersonaUrl) {
      alert('Por favor, adicione a Imagem Persona (Rosto) nas Settings.');
      setIsSettingsOpen(true);
      return;
    }

    const geminiKey = localStorage.getItem('gemini_api_key');
    const apiToken = localStorage.getItem('replicate_api_key');

    if (aiModel === 'instant-id' && !apiToken) {
      alert('Para usar o InstantID, configure seu token da Replicate nas Settings.');
      setIsSettingsOpen(true);
      return;
    }
    
    if (aiModel === 'imagen-3' && !geminiKey) {
      alert('Para usar o Imagen 3 da Google, configure sua Gemini API Key nas Settings.');
      setIsSettingsOpen(true);
      return;
    }

    const newSlides = [...slides];
    newSlides[index].isGenerating = true;
    setSlides(newSlides);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: slides[index].image_prompt,
          personaUrl: activePersonaUrl,
          format: format,
          apiToken: apiToken,
          geminiKey: geminiKey,
          aiModel: aiModel,
          imagenModel: imagenModel
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      newSlides[index].generated_image_url = data.imageUrl;
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao gerar imagem: ${error.message}`);
    } finally {
      newSlides[index].isGenerating = false;
      setSlides([...newSlides]);
    }
  };

  const handleSaveProject = async () => {
    if (slides.length === 0 || !title) {
      alert("Please generate a structure first.");
      return;
    }

    try {
      // Create a new project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([
          { 
            title: title,
            project_type: 'carousel',
            format: format,
            // Add other project fields as necessary
          }
        ])
        .select()
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error("Failed to create project.");

      // Add slides to the project
      const slideData = slides.map(slide => ({
        project_id: projectData.id,
        slide_order: slide.slide_order,
        content_text: slide.content_text,
        image_prompt: slide.image_prompt,
        final_image_url: slide.generated_image_url,
      }));

      const { error: slidesError } = await supabase
        .from('project_slides')
        .insert(slideData);
      
      if (slidesError) throw slidesError;

      alert('Project saved successfully!');

    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(`Error saving project: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">InstaForge</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <button onClick={() => setIsSettingsOpen(true)} className="hover:text-black transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={handleSettingsClose} />

      <main className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Input & Settings */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              New Carousel
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What's the idea?</label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. 3 reasons to invest in paid traffic..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-32 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Formato da Imagem</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1:1', label: 'Feed', desc: 'Square', width: 20, height: 20 },
                    { id: '4:5', label: 'Portrait', desc: 'Ideal', width: 18, height: 22.5 },
                    { id: '9:16', label: 'Story', desc: 'Reels', width: 14, height: 25 },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`flex flex-col items-center justify-center py-3 px-1 text-sm rounded-xl border transition-all ${
                        format === f.id 
                          ? 'bg-blue-50/50 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`border-2 rounded-sm mb-2 transition-colors ${format === f.id ? 'border-blue-500 bg-blue-100/50' : 'border-slate-300 bg-slate-100'}`} 
                           style={{ width: `${f.width}px`, height: `${f.height}px` }} 
                      />
                      <span className={format === f.id ? 'text-blue-700 font-semibold text-xs' : 'text-slate-700 font-medium text-xs'}>{f.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{f.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quantidade de Slides</label>
                <div className="flex gap-2">
                  {[3, 5, 7, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSlideCount(num)}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                        slideCount === num 
                          ? 'bg-black text-white border-black shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Motor de Geração de Imagem</label>
                <div className="space-y-2">
                  {[
                    { id: 'imagen-3', name: 'Imagen 3 (Google Gemini)', desc: 'Ultra realismo gratuito, mas rosto genérico', cost: 0.000 },
                    { id: 'instant-id', name: 'InstantID (Replicate)', desc: 'Rosto fiel da sua Persona (Requer Replicate Pro)', cost: 0.006 },
                  ].map(model => (
                    <button
                      key={model.id}
                      onClick={() => setAiModel(model.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${
                        aiModel === model.id 
                          ? 'bg-blue-50/50 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-semibold ${aiModel === model.id ? 'text-blue-700' : 'text-slate-800'}`}>{model.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{model.desc}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-400">~${model.cost}/img</div>
                    </button>
                  ))}
                </div>
                
                {aiModel === 'imagen-3' && (
                  <div className="mt-4 pl-4 border-l-2 border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Versões Disponíveis (Google)</label>
                    <select
                      value={imagenModel}
                      onChange={(e) => setImagenModel(e.target.value)}
                      className="w-full text-left p-2.5 rounded-lg border bg-white text-slate-600 border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-black outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                    >
                      <option value="imagen-3.0-generate-002">Imagen 3.0 (Qualidade Máxima)</option>
                      <option value="imagen-3.0-fast-generate-001">Imagen 3.0 Nano/Fast (Mais Rápido)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Qualidade & Resolução</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResolution('standard')}
                    className={`py-2 text-sm font-medium rounded-xl border transition-all ${
                        resolution === 'standard'
                          ? 'bg-black text-white border-black shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >Standard (Base)</button>
                  <button
                    onClick={() => setResolution('hd')}
                    className={`py-2 text-sm font-medium rounded-xl border transition-all ${
                        resolution === 'hd'
                          ? 'bg-black text-white border-black shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >HD (Alto Custo)</button>
                </div>
              </div>

              {/* Cost Estimator */}
              <div className="bg-[#f8f9fa] border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Estimativa de Custo</div>
                  <div className="text-sm text-slate-600">
                    {slideCount} slides × {aiModel === 'instant-id' ? '$0.006' : 'Grátis'} {resolution === 'hd' && aiModel === 'instant-id' ? '× 1.5 (HD)' : ''}
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {aiModel === 'instant-id' ? `$${(slideCount * 0.006 * (resolution === 'hd' ? 1.5 : 1)).toFixed(3)}` : 'Grátis'}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateBrain}
                  disabled={isGeneratingBrain || !idea}
                  className="flex-1 py-3 px-4 bg-black text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingBrain ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <LayoutTemplate className="w-4 h-4" />
                      Generate Structure
                    </>
                  )}
                </button>
                <button
                  onClick={handleSaveProject}
                  disabled={slides.length === 0}
                  className="py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Save Project
                </button>
              </div>
            </div>
          </div>

          {/* Brand Settings Preview */}
          {(localPersonaUrl || brandSettings?.persona_image_url) && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Active Persona</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={localPersonaUrl || brandSettings?.persona_image_url || ''} 
                  alt="Persona" 
                  className="w-16 h-16 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {localPersonaUrl ? 'Persona Local' : 'Persona Banco de Dados'}
                  </p>
                  <p className="text-xs text-slate-500">Ready for generation</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {slides.length === 0 ? (
            isGeneratingBrain ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Loader2 className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
                <p className="text-sm font-medium">O Agente está construindo a estrutura do Carrossel...</p>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <LayoutTemplate className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-sm font-medium">Your carousel structure will appear here</p>
              </div>
            )
          ) : (
            <div className="space-y-8 flex flex-col items-center">
              <div className="w-full">
                {title && (
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center mb-6">{title}</h2>
                )}
                
                {/* Carousel Indicators */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  {slides.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all ${currentSlideIndex === idx ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="w-full max-w-sm flex flex-col items-center">
                {/* Instagram Post Simulation */}
                <div className="bg-white border text-sm font-sans border-slate-200 rounded-lg overflow-hidden shadow-md w-full flex flex-col relative">
                  
                  {/* Insta Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <img 
                        src={localPersonaUrl || brandSettings?.persona_image_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-semibold text-slate-900 text-[13px]">Seu Perfil</span>
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </div>

                  {/* Insta Image Viewer */}
                  <div className="relative w-full bg-slate-100 flex items-center justify-center overflow-hidden" style={{ aspectRatio: format === '1:1' ? '1/1' : format === '4:5' ? '4/5' : '9/16' }}>
                    
                    {slides[currentSlideIndex].generated_image_url ? (
                      <img 
                        src={slides[currentSlideIndex].generated_image_url} 
                        alt="Slide"
                        className="w-full h-full object-cover"
                      />
                    ) : slides[currentSlideIndex].isGenerating ? (
                      <div className="flex flex-col items-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                        <span className="text-[11px] font-medium">Renderizando na nuvem...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
                        <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Arraste para o lado</span>
                      </div>
                    )}

                    {/* Gradient & Overlay Text */}
                    {slides[currentSlideIndex].generated_image_url && (
                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16">
                        <p className="text-white font-bold text-lg leading-snug drop-shadow-md text-center">
                          {slides[currentSlideIndex].content_text}
                        </p>
                      </div>
                    )}

                    {/* Left/Right Arrows inside Post */}
                    {currentSlideIndex > 0 && (
                      <button 
                        onClick={() => setCurrentSlideIndex(prev => prev - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all z-10 text-slate-800"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {currentSlideIndex < slides.length - 1 && (
                      <button 
                        onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all z-10 text-slate-800"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}

                    {/* Slide Counter Top Right */}
                    <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2.5 py-1 backdrop-blur-sm z-10">
                      <span className="text-white text-[10px] font-semibold tracking-wider">
                        {currentSlideIndex + 1}/{slides.length}
                      </span>
                    </div>
                  </div>

                  {/* Insta Footer */}
                  <div className="px-4 py-3 bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-4 text-slate-900">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                      </div>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-900"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">1.245 curtidas</p>
                      <p className="text-[13px] text-slate-900 leading-snug">
                        <span className="font-semibold mr-1.5">Seu Perfil</span>
                        <span dangerouslySetInnerHTML={{__html: slides[currentSlideIndex].content_text.replace(/\n/g, '<br/>')}} />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Editor Controls for Current Slide */}
                <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-500" />
                      Editor do Slide {currentSlideIndex + 1}
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Texto da Imagem / Legenda</label>
                      <input 
                        className="w-full text-sm font-medium text-slate-900 p-3 bg-[#f8f9fa] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                        value={slides[currentSlideIndex].content_text}
                        onChange={(e) => {
                          const newSlides = [...slides];
                          newSlides[currentSlideIndex].content_text = e.target.value;
                          setSlides(newSlides);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Engenharia do Prompt (IA)</label>
                      <textarea 
                        className="w-full text-sm text-slate-600 p-3 bg-[#f8f9fa] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none min-h-[110px] shadow-inner font-mono leading-relaxed"
                        value={slides[currentSlideIndex].image_prompt}
                        onChange={(e) => {
                          const newSlides = [...slides];
                          newSlides[currentSlideIndex].image_prompt = e.target.value;
                          setSlides(newSlides);
                        }}
                      />
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => handleGenerateImage(currentSlideIndex)}
                        disabled={slides[currentSlideIndex].isGenerating}
                        className="flex-1 py-3.5 px-4 bg-black text-white rounded-xl font-medium text-sm hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
                      >
                        {slides[currentSlideIndex].isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                        )}
                        {slides[currentSlideIndex].generated_image_url ? 'Regerar Imagem na Nuvem' : 'Renderizar Imagem (Replicate)'}
                      </button>
                      
                      {slides[currentSlideIndex].generated_image_url && (
                        <button className="p-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center">
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
