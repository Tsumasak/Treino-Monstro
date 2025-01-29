# Treino Monstro (v1.2.3)

Este projeto é um site de **Treino A/B** com **contadores** (Exercício e Descanso), 
tracker de exercícios, countdown, confetes ao finalizar, e layout responsivo.

---

## Funcionalidades

- **Sidebar Desktop** agora segue o **formato flutuante** do mobile.  
- **Contadores**:
  - Texto "Exercício" e "Descanso" em 12px, cronômetro maior.  
  - Ao **Iniciar** (Play), começa Exercício; ao **Pausar**, Exercício para e Descanso inicia.  
  - **Confirm Stop** antes de encerrar.  
- **Último Exercício**: agora em **2 linhas**:
Último Exercício: Nome-do-Exercício - ⌚MM:SS

- **Tracker**:
- Nome do exercício em **bold**, tempo normal.  
- **Exportar CSV**: sem ícone nos botões, apenas texto.  
- **Modal Parabéns** com **fundo branco + glass** e **confetes**; agora também tem botão “Exportar” interno.  
- **Changelog**: Botão sem ícone, apenas texto. Abre modal com o mesmo conteúdo do README.  
- **Botão GymRats** no celular tenta abrir o app se instalado (via `intent://` no Android e `gymrats://` no iOS). Caso falhe, abre a loja.  
- **Abrir Câmera** no mobile: `intent://camera#Intent;action=android.media.action.IMAGE_CAPTURE;end` (Android) e `camera://` (iOS). Se não funcionar, exibe alerta.

---

## Changelog

### Versão 1.0
- Lançamento inicial do Treino Monstro

### Versão 1.1
- Adicionados contadores de exercício e descanso  
- Correções de layout no tracker

### Versão 1.2
- Melhoria no layout mobile  
- Countdown com fundo branco e glass  
- Cardio com nova imagem  
- Confetes ao concluir

### Versão 1.2.3
- Botões do mobile sem texto, somente ícones  
- “Último Exercício” em duas linhas  
- Nome de exercício em bold no tracker, tempo normal  
- Novo botão “Exportar” na modal de Parabéns  
- Botão “Changelog” no header  
- Ajustes no tamanho de fonte para “Exercício” e “Descanso” (12px)  
- Sidebar desktop estilo mobile  
- Confirm Stop ao encerrar  
- Abertura da câmera via app nativo

---

## Como Usar

1. **Abrir** `index.html` em um navegador (desktop ou mobile).  
2. Escolher **Treino A** ou **Treino B**.  
3. **Iniciar** (botão “▶”) para começar o exercício.  
4. **Pausar** se desejar (inicia Descanso).  
5. **Stop** pergunta se deseja encerrar. Ao final, modal de parabéns + confetes.  
6. **Exportar** CSV a qualquer momento.  

---

## Licença

Este projeto é livre para uso e adaptação. 
