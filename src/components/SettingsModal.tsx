'use client';

import { useState, useEffect } from 'react';
import { X, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const [replicateKey, setReplicateKey] = useState('');
  const [personaUrl, setPersonaUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem('gemini_api_key') || '');
      setReplicateKey(localStorage.getItem('replicate_api_key') || '');
      setPersonaUrl(localStorage.getItem('persona_image_url') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('replicate_api_key', replicateKey);
    localStorage.setItem('persona_image_url', personaUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-700" />
            Configurações Locais
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Estas chaves ficam salvas exclusivamente na memória do <b>seu navegador</b> (LocalStorage). Elas não são salvas no banco de dados.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
            <input 
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Replicate API Token</label>
            <input 
              type="password"
              value={replicateKey}
              onChange={(e) => setReplicateKey(e.target.value)}
              placeholder="r8_..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem Persona (Rosto)</label>
            <input 
              type="text"
              value={personaUrl}
              onChange={(e) => setPersonaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">Link direto para uma foto do seu rosto. Usado como base para gerar imagens na Replicate.</p>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
