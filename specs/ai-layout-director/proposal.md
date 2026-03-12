# Vibe Proposal: AI-Driven Auto-Layout & Multimodal Campaigns

## 1. O Problema
O usuário identificou que o modelo anterior exigia muito trabalho manual (clicar em botões para posicionar e estilizar os textos sobre a imagem) e ainda deixava espaço para o erro humano na curadoria das artes. Além disso, a falta de conexão entre a geração do "Prompt da Imagem" e a "Decisão de Design do HTML" quebrava a imersão — se a IA gera uma foto com um objeto principal na esquerda, o texto não deveria ficar colado ou em cima dele, e vice-versa.

## 2. A Solução (A Mudança de Paradigma)
Transformaremos o nó **Brain** (a inteligência que escreve as ideias) no **Diretor de Arte**.
Quando o usuário pede *"Ideias para a Semana do Consumidor"*, a IA não cospe apenas o texto, ela mapeia **TODA a arquitetura do design do slide**:
1. Cria a composição do frame (`image_prompt`).
2. Analisa o espaço negativo do cenário que acabou de criar.
3. Determina onde o texto HTML vai "pousar" (Esquerda, Centro, Base, etc).
4. Escolhe a paleta de cores (Texto Branco pra fundos escuros, Preto pra claros).
5. Seleciona o direcionamento do olhar (Alinhamento).

## 3. Casos de Uso Reais & Aplicações de Valor

### Exemplo 1: O "Hero Shot" Noturno (Contraste)
* Contexto: O slide 1 fala sobre "Proteção em Momentos Escuros - Seguro de Vida".
* O que a IA cria no _image_prompt_: "Low key photography, dark moody atmosphere, a professional man standing on the far right frame looking into a stormy city."
* **Decisão de Direção de Arte da IA:** Como o sujeito está na direita e o fundo é escuro, a IA preenche o JSON com: `textPosition: 'top'`, `textAlign: 'left'`, `themeColor: 'light'`, garantindo no código que um Letreiro Branco e Gigante HTML seja renderizado limpo no terço esquerdo superior da foto.

### Exemplo 2: A Citação Elegante (Respiro Minimalista)
* Contexto: Slide 3 fala de Confiança, com um quote direto.
* O que a IA cria no _image_prompt_: "High key, ultra bright, minimalist white modern office, huge empty space on the bottom half, macro shot of a fountain pen resting on a crisp white ledger on the top half."
* **Decisão de Direção de Arte da IA:** A parte inferior é totalmente vazia e clara. A IA retorna: `textPosition: 'bottom'`, `textAlign: 'center'`, `themeColor: 'dark'`, `fontFamily: 'serif'`. O sistema desenha uma fonte clássica escura centralizada na parte inferior. O resultado é digno da Vogue.

## 4. Integração com Multimodalidade (Nano Banana)
Por fim, no momento de **renderizar** a foto que o Diretor de Arte (Gemini 2.5) imaginou, ela será repassada (agora como JSON) ao **Gemini 3.1 Flash (Nano Banana)**.
Nesta aba, o usuário pode ter subido imagens base de "Referências" (ex: "Minha Logo", "Uma foto da corretora").
O novo modelo Gemini 3.1 Flash receberá tanto o _image_prompt_ calculado milimetricamente quanto as Imagens de Referência do usuário (`responseModalities = IMAGE`), criando uma foto inédita que respeita estritamente o ambiente para o texto encaixar da forma que a direção de arte previu.

Esta simbiose remove horas de design manual, permitindo ao usuário escalar 10, 20 campanhas diárias com o clique de um botão, e o design sempre sairá coerente.
