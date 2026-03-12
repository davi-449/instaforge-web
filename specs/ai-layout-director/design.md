# Design Document: AI Auto-Layout & Multimodal Director

O objetivo deste documento técnico é definir os contratos de dados e o projeto das interfaces (UI/API) que viabilizarão o fluxo da **Semana do Consumidor Mágica**, idealizado na `proposal.md`.

## 1. Contrato da API da IA (Brain) Direto com Design
A Rota POST `/api/generate-brain/route.ts` receberá uma instrução extensiva (System Prompt).
Seu retorno JSON atual (`content_text` e `image_prompt`) passará a ser obrigatoriamente complementado pelas decisões artísticas.

```typescript
// Interface esperada do retorno do Google Gemini 2.5 (Gerador de Estrutura)
interface BrainSlideResponse {
  slide_order: number;
  content_text: string;
  image_prompt: string;         // "A professional woman in business attire... Right aligned subject, left negative space dark backdrop."  
  textPosition: 'top' | 'center' | 'bottom'; 
  textAlign: 'left' | 'center' | 'right';
  themeColor: 'light' | 'dark' | 'brand';
  fontFamily: 'sans' | 'serif';
}
```

## 2. Interface Visual (UI) em `page.tsx`
O usuário não precisará mais setar Posição ou Alinhamento, pois o _Brain_ já preencheu. Esses valores já virão populados no estado do componente de Slide.
No entanto, os "Combobox" atuais do Editor serão mantidos para que o usuário possa intervir caso queira fazer ajustes finos.

Em adição ao Canva HTML, teremos a aba de **Referências Visuais** vinculadas à geração da Imagem (Backend Replicate/Nano Banana).
### Seção de Referência Visuais Multimodal (UI)
* Botão `[+ Adicionar Contexto Visual]` em cada slide.
* O usuário seleciona um arquivo e define sua tag (`Referência Geral`, `Logo` ou `Persona`).
* O Front-End armazena esse dado no estado como um array `references: { mimeType, data: Base64, type }[]`.

## 3. O Pulo do Gato Multimodal (Nano Banana)
Em `/api/generate-image/route.ts`, modificaremos a rota lógica exclusiva caso `imagenModel` seja o 3.1 Flash/Pro (Nano Banana).

```json
// REST Request Payload para gemini-3.1-flash-image-preview
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "optimized prompt gerado pelo brain" },
        // Append dinâmico de todos os Base64 injetados em references:
        { "inlineData": { "mimeType": "image/jpeg", "data": "base64 da logo/referência do user" } }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"]
  }
}
```
A geração sairá absurdamente coerente com todos os pesos. O layout, por sua vez, abraça essa imagem (pois o cenário casou com as posições exigidas em UI).
