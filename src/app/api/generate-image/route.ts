
import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  try {
    const { prompt, personaUrl, format, apiToken, geminiKey, aiModel, imagenModel, references } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    // Google Imagen 4 / Nano Banana Block
    if (aiModel === 'imagen-4') {
      const finalGeminiKey = geminiKey || process.env.GEMINI_API_KEY;
      if (!finalGeminiKey) {
        return NextResponse.json({ error: 'Configure sua Gemini API Key para usar a geração do Google' }, { status: 400 });
      }

      // Map formats to Imagen 3 valid aspect ratios: "1:1", "3:4", "4:3", "9:16", "16:9"
      let imagenRatio = "1:1";
      if (format === '4:5') imagenRatio = "3:4"; // Closest portrait match
      else if (format === '9:16') imagenRatio = "9:16";

      // Append stylistic instructions for better Instagram carousel consistency
      const optimizedPrompt = `Masterpiece, ultra-detailed, photorealistic, cinematic lighting, ${prompt}. Clean minimalist background, highly aesthetic instagram post, vibrant colors, 8k resolution.`;

      const targetModel = imagenModel || 'imagen-4.0-generate-001';

      if (targetModel.includes('gemini-3')) {
        // NANO BANANA: Multimodal Base64 Image Generation via generateContent
        const parts: any[] = [{ text: optimizedPrompt }];
        
        // Append user visual references (Logo, Persona, Style)
        if (references && Array.isArray(references)) {
          for (const ref of references) {
            const matches = ref.base64Data.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
            if (matches && matches.length === 3) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
                }
              });
            }
          }
        }

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${finalGeminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: { responseModalities: ["IMAGE"] }
          })
        });

        const gData = await gRes.json();
        if (gData.error) throw new Error(gData.error.message || 'Erro no Nano Banana (Gemini 3)');

        const base64Image = gData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const mimeType = gData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'image/jpeg';
        
        if (!base64Image) {
          throw new Error('Gemini não retornou dados de imagem em Base64');
        }

        return NextResponse.json({ imageUrl: `data:${mimeType};base64,${base64Image}` });

      } else {
        // GERAÇÃO TRADICIONAL (Imagen 4 / Google GenAI via Predict)
        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:predict?key=${finalGeminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: optimizedPrompt }],
            parameters: { sampleCount: 1, aspectRatio: imagenRatio }
          })
        });

        const gData = await gRes.json();
        if (gData.error) {
          throw new Error(gData.error.message || 'Erro no Google Imagen');
        }

        const base64Image = gData.predictions?.[0]?.bytesBase64Encoded;
        if (!base64Image) {
          throw new Error('Google não retornou a imagem base64');
        }

        return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${base64Image}` });
      }
    }

    // Replicate InstantID Block
    const finalToken = apiToken || process.env.REPLICATE_API_TOKEN || 'placeholder';
    if (!personaUrl) {
      return NextResponse.json({ error: 'URL da persona é obrigatória para o InstantID' }, { status: 400 });
    }
    
    const replicate = new Replicate({
      auth: finalToken,
    });

    let width = 1080;
    let height = 1080;
    
    if (format === '4:5') {
        height = 1350;
    } else if (format === '9:16') {
        height = 1920;
    }

    const output = await replicate.run(
      "zsxkib/instant-id:642f4b4238db313c49eacdc91c0b3d680ed9acbdc1fdfae1600c3cd56424b94a",
      {
        input: {
          image: personaUrl,
          prompt: prompt,
          negative_prompt: "bad quality, worse quality, low resolution, deformed, ugly, bad anatomy",
          width: width,
          height: height,
          num_inference_steps: 30,
          guidance_scale: 5,
        }
      }
    );

    let imageUrl = '';
    if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0] as unknown as string;
    } else if (typeof output === 'string') {
        imageUrl = output as unknown as string;
    } else {
        throw new Error('Formato de resposta inesperado da Replicate');
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Tratamento específico para erro de crédito da Replicate
    if (error.message && error.message.includes('credit')) {
      return NextResponse.json({ error: 'Sem créditos na Replicate. Por favor, adicione fundos.' }, { status: 402 });
    }
    
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

