'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, Image as ImageIcon, Download, Settings, LayoutTemplate } from 'lucide-react';
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
  const [format, setFormat] = useState('4:5');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  }, []);

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
        body: JSON.stringify({ idea, apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTitle(data.title);
      setSlides(data.slides);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar ideias. Tente novamente.');
    } finally {
      setIsGeneratingBrain(false);
    }
  };

  const handleGenerateImage = async (index: number) => {
    if (!brandSettings?.persona_image_url) {
      alert('Configurações de marca não encontradas.');
      return;
    }

    const apiToken = localStorage.getItem('replicate_api_key');
    if (!apiToken) {
      alert('Por favor, configure seu token da Replicate nas Settings primeiro.');
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
          personaUrl: brandSettings.persona_image_url,
          format: format,
          apiToken: apiToken
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

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

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
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <div className="flex gap-2">
                  {['1:1', '4:5', '9:16'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                        format === f 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
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
          {brandSettings && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Active Persona</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={brandSettings.persona_image_url} 
                  alt="Persona" 
                  className="w-16 h-16 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Default Model</p>
                  <p className="text-xs text-slate-500">Ready for generation</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {slides.length === 0 && !isGeneratingBrain ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <LayoutTemplate className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-sm font-medium">Your carousel structure will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {title && (
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
              )}
              
              <div className="grid gap-6">
                {slides.map((slide, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
                    
                    {/* Image Preview Area */}
                    <div className="w-full sm:w-64 bg-slate-100 relative flex-shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 flex items-center justify-center min-h-[250px]">
                      {slide.generated_image_url ? (
                        <img 
                          src={slide.generated_image_url} 
                          alt={`Slide ${slide.slide_order}`}
                          className="w-full h-full object-cover"
                        />
                      ) : slide.isGenerating ? (
                        <div className="flex flex-col items-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                          <span className="text-xs font-medium">Generating image...</span>
                          <span className="text-[10px] mt-1 text-slate-400">(Takes ~40s)</span>
                        </div>
                      ) : (
                        <ImageIcon className="w-12 h-12 text-slate-300" />
                      )}
                      
                      {/* Overlay Text Preview */}
                      {slide.generated_image_url && (
                        <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-white font-bold text-lg leading-tight drop-shadow-md">
                            {slide.content_text}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                          Slide {slide.slide_order}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Overlay Text</label>
                        <p className="text-sm font-medium text-slate-900">{slide.content_text}</p>
                      </div>

                      <div className="mb-6 flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Image Prompt</label>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {slide.image_prompt}
                        </p>
                      </div>

                      <div className="flex gap-3 mt-auto">
                        <button
                          onClick={() => handleGenerateImage(index)}
                          disabled={slide.isGenerating}
                          className="flex-1 py-2 px-4 bg-black text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {slide.isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                          {slide.generated_image_url ? 'Regenerate Image' : 'Generate Image'}
                        </button>
                        
                        {slide.generated_image_url && (
                          <button className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
