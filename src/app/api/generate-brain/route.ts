
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const systemInstruction = `Você é um Diretor de Arte Sênior, Copywriter Especialista em Instagram e Mestre em Engenharia de Prompts para Stable Diffusion (Replicate/Midjourney).
Sua missão é transformar uma ideia simples em um Carrossel de Instagram altamente engajador e visualmente deslumbrante.

Para cada slide do carrossel, você deve fornecer:
1. content_text: O texto curto e de impacto que vai escrito POR CIMA da imagem (máximo 10 palavras).
2. image_prompt: Um prompt em inglês, extremamente detalhado, focado em fotografia realista. 
   - O prompt DEVE descrever a iluminação (ex: cinematic lighting, soft studio light, rim lighting).
   - O prompt DEVE descrever a lente/câmera (ex: shot on 35mm lens, f/1.8, DSLR, 8k resolution).
   - O prompt DEVE descrever a composição e estilo (ex: rule of thirds, hyper-realistic, masterpiece).
   - O prompt DEVE descrever a ação/pose da pessoa (ex: pointing at the camera, holding a glowing chart, looking surprised).
   - O prompt DEVE começar com "A professional woman in business attire" (pois usaremos IP-Adapter para manter o rosto).

Retorne APENAS um JSON válido no seguinte formato:
{
  "title": "Título do Carrossel",
  "slides": [
    {
      "slide_order": 1,
      "content_text": "Texto do slide 1",
      "image_prompt": "Prompt detalhado em inglês..."
    }
  ]
}`;

export async function POST(request: Request) {
  try {
    const { idea, apiKey } = await request.json();

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

    const result = await model.generateContent(`Crie um carrossel de 3 a 5 slides sobre a seguinte ideia: ${idea}`);
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
