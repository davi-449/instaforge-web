

import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const { prompt, personaUrl, format } = await request.json();

    if (!prompt || !personaUrl) {
      return NextResponse.json({ error: 'Prompt e Persona URL são obrigatórios' }, { status: 400 });
    }

    // Definir dimensões baseadas no formato
    let width = 1080;
    let height = 1350; // 4:5 default
    
    if (format === '1:1') {
      height = 1080;
    } else if (format === '9:16') {
      height = 1920;
    }

    console.log('Iniciando geração na Replicate...');
    
    const output = await replicate.run(
      "zsxkib/instant-id:6af8583c541261472e92155d87bba80d5ad98461665802f2ba196ac099aaedc9",
      {
        input: {
          image: personaUrl,
          prompt: prompt,
          negative_prompt: "ugly, deformed, noisy, blurry, distorted, out of focus, bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, missing fingers",
          width: width,
          height: height,
          num_inference_steps: 30,
          guidance_scale: 5,
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8
        }
      }
    );

    // O output é um array de URLs
    console.log("Output da Replicate:", output);
    let imageUrl = "";
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = typeof (output[0] as any).url === "function" ? (output[0] as any).url() : String(output[0]);
    } else if (output && typeof (output as any).url === "function") {
      imageUrl = (output as any).url();
    } else {
      imageUrl = output as unknown as string;
    }
    
    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('Erro na Replicate:', error);
    
    // Tratamento específico para erro de crédito
    if (error.message && error.message.includes('credit')) {
      return NextResponse.json({ error: 'Sem créditos na Replicate. Por favor, adicione fundos.' }, { status: 402 });
    }
    
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

