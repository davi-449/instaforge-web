
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const systemInstruction = `Você é um Diretor de Arte Sênior, Copywriter Especialista em Instagram e Mestre em Engenharia de Prompts para Gemini Multimodal/Stable Diffusion.
Sua missão é criar a ESTRUTURA COMPLETA (Visual e Textual) de um Carrossel altamente engajador.
Além de criar o texto legível e a fotografia de fundo, você DEVE calcular o Design do HTML sobreposto, garantindo legibilidade absoluta. O texto NUNCA deve cair em cima do assunto principal da foto.

Para cada slide do carrossel, pense como um diretor de arte e forneça:
1. content_text: O texto curto e de impacto que será renderizado via HTML POR CIMA da imagem (máximo 15 palavras, pulando linha caso tenha Título e Subtítulo).
2. image_prompt: Um prompt em inglês, incrivelmente detalhado, para a fotografia realista.
   - O prompt DEVE ditar o espaço negativo (ex: "subject strictly on the right side, leaving huge empty dark negative space on the left").
   - O prompt DEVE descrever a iluminação, composição e lente (ex: cinematic lighting, f/1.8, 8k).
   - O prompt DEVE começar com "A professional woman in business attire" ou similar dependendo da persona.
   - [REGRA CRÍTICA]: NUNCA, SOB NENHUMA HIPÓTESE inclua palavras, fontes, textos, logos, tipografia ou letras no \`image_prompt\`. O gerador de imagens deve fazer APENAS o cenário e a fotografia limpa, pois TODO o texto será gerado e sobreposto em HTML nativo.
3. DIREÇÃO DE ARTE (A mágica): Baseado no "image_prompt" que VOCÊ acabou de inventar, determine onde o texto HTML deve flutuar para não colidir com o sujeito da foto:
   - textPosition: Define onde fica a mancha gráfica. Valores permitidos: "top", "center" ou "bottom". (Ex: se você gerou um teto iluminado vazio, use "top").
   - textAlign: Alinhamento do texto HTML. Valores permitidos: "left", "center" ou "right". (Ex: se o personagem tá na extrema direita com espaço na esquerda, use "left").
   - themeColor: Contraste do texto HTML. Valores permitidos: "light" (Texto Branco para fundos ou roupas escuras), "dark" (Texto Preto para céus claros/neve/escritórios brancos) ou "brand" (Amarelo/Destaque).
   - fontFamily: Estilo tipográfico. Valores permitidos: "sans" (Moderno, clean, corporativo) ou "serif" (Clássico, citação, elegante).

Retorne APENAS um JSON válido no seguinte formato rigoroso:
{
  "title": "Título do Carrossel para UI",
  "slides": [
    {
      "slide_order": 1,
      "content_text": "Título Forte Aqui\\nE aqui vem o subtítulo descritivo em uma segunda linha para gerar quebra de texto elegante.",
      "image_prompt": "A professional woman in business attire standing on the far right frame, looking at the city...",
      "textPosition": "bottom",
      "textAlign": "left",
      "themeColor": "light",
      "fontFamily": "sans"
    }
  ]
}`;

export async function POST(request: Request) {
  try {
    const { idea, apiKey, slideCount } = await request.json();

    if (!idea) {
      return NextResponse.json({ error: 'A ideia é obrigatória' }, { status: 400 });
    }

    const finalKey = apiKey || process.env.GEMINI_API_KEY;
    if (!finalKey) {
      return NextResponse.json({ error: 'Configure sua Gemini API Key nas Configurações primeiro.' }, { status: 400 });
    }
    
    const genAI = new GoogleGenerativeAI(finalKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      }
    });

    const quantity = slideCount || '3 a 5';
    const result = await model.generateContent(`Crie um carrossel de exatamente ${quantity} slides sobre a seguinte ideia: ${idea}`);
    const response = await result.response;
    const resultText = response.text();
    if (!resultText) {
      throw new Error('Resposta vazia do Gemini');
    }

    const parsedJson = JSON.parse(resultText);
    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error('Erro no Gemini:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
