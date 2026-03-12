# Tasks: AI Auto-Layout & Multimodal Director

O projeto deve ser abordado nestes incrementos controlados. Você só passará para a próxima tarefa após testar ativamente a anterior.

## Etapa 1: A IA Mestra (Brain)
- [ ] Mudar o `System Prompt` em `src/app/api/generate-brain/route.ts`. Explicar as regras do Diretor de Arte: ensinar a IA a calcular o `textPosition`, `themeColor`, `fontFamily` e `textAlign` baseada no espaço negativo do `image_prompt`.
- [ ] Atualizar o esquema JSON esperado dentro do `prompt` do servidor para forçar o retorno estrito de todos esses novos nós.
- [ ] Adicionar um tratamento para quando as chaves opcionais não existam (fallback safe).
- [ ] Testar uma requisição pro Brain para garantir que os valores estão preenchendo o estado do front corretamente.

## Etapa 2: UI Reativa & Auto-Preenchida
- [ ] Como o HTML Preview já reage as variáveis (implementado no passo anterior da V2 Canva), apenas testar se, ao gerar uma estrutura totalmente cruzada via Brain, o Preview respeita instantaneamente as predefinições de `textPosition` e curadoria feitas pela IA sem cliques do usuário.

## Etapa 3: Upload Multimodal Local (Frontend UI)
- [ ] Construir o Componente "Upload de Referência Visual" na aba "Editor do Slide X" (em `page.tsx`).
- [ ] O componente deve ter input nativo de file e converter a imagem na hora para Base64 usando o FileReader local.
- [ ] Esse novo array de Imagens em Base64 precisa ser atrelado ao estado `Slide` e passado na comunicação HTTP para o `/api/generate-image/`.

## Etapa 4: Integração Nano Banana (Rest API)
- [ ] Interceptar no backend (`generate-image/route.ts`) se for a família "Nano Banana" (ex: `gemini-3.1-flash-image-preview`).
- [ ] Ao invés do tradicional endpoint `:predict` da v1beta, chamar `:generateContent` formatando os `"contents"` em array e incluindo `responseModalities: ["IMAGE"]`.
- [ ] Mapear as referências (imagens Base64 do Step 3) injetando como `inlineData` parts dentro do prompt de texto principal.
- [ ] Retornar o blob/base64 convertido pra visualização.
