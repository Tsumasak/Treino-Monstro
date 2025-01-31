# Treino Monstro

> **Versão Atual**: 1.4.0

Este projeto é um site de **Treino A/B** com **contadores** de Exercício e Descanso, 
um **tracker** de exercícios, e outras funcionalidades.

---

## Funcionalidades

- **Contadores** para Exercício e Descanso:  
  - Ao clicar em **Iniciar** (Play), começa o cronômetro de Exercício.  
  - Ao clicar em **Pausar**, o Exercício para e o Descanso inicia.  
  - Ao clicar em **Encerrar**, finaliza o treino, mostrando uma modal de parabéns com confetes.

- **Tracker** de Exercícios:  
  - Cada exercício marcado adiciona um registro no **tracker** (desktop e mobile), 
    exibindo o nome do exercício e o tempo decorrido.  
  - Exibe também um **Descanso Total**.

- **Countdown** de início:  
  - Quando o usuário inicia o treino **pela primeira vez**, aparece um countdown (5, 4, 3, 2, 1, “Bom Treino Monstro!”).

- **Mobile**:  
  - Barra inferior flutuante com contadores de Exercício e Descanso, botões de Iniciar/Pausar/Encerrar (somente ícones), Tracker e Exportar.

- **Exportar CSV**:  
  - Possível exportar um arquivo CSV com cada exercício, horário e tempo parcial, e o descanso total ao final.

- **Modal de Parabéns**:  
  - Fundo branco com glassmorphism e **confetes** em segundo plano.  
  - Botão “Exportar” dentro da modal para facilitar ao final do treino.

- **Changelog**:  
  - Botão “Changelog” no header.  
  - Abre uma modal contendo as versões e mudanças, sincronizadas com este README.

- **Lightbox**:  
  - Ao clicar nas imagens dos exercícios, abre um lightbox ampliado.

- **Layout responsivo**:  
  - Sidebar no desktop, bottom bar no mobile, com glassmorphism.
  
---

## Como Usar

1. **Abrir** `index.html` em um navegador.
2. Escolher **Treino A** ou **Treino B**.
3. Clicar em **▶ Iniciar** (desktop) ou **▶** (mobile) para começar o cronômetro.
4. Ao concluir todos os exercícios ou clicar em **⏹ Encerrar**, a modal de parabéns surge.
5. Pode **Exportar** CSV para salvar o histórico.
6. Caso queira pausar e trocar de treino, o site pede para pausar antes.
7. **Lightbox** nas imagens, **Tracker** com marcação de tempo de cada exercício + Descanso total.
8. **Gymrats** com detecção de plataforma e redirecionamento para app nativo ou loja.
9. **Persistência de Dados**: O estado do treino é salvo automaticamente, permitindo continuar de onde parou mesmo após recarregar a página.

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
- Último Exercício em duas linhas
- Nome de exercício em bold no tracker, tempo normal
- Novo botão “Exportar” na modal de Parabéns
- Botão “Changelog” no header
- Ajustes no tamanho de fonte para “Exercício” e “Descanso” (12px)

### Versão 1.3.0
- Favicon e thumbnail para redes sociais
- Botões das modais no mesmo padrão dos botões “Treino A/B”
- “Último Exercício” em bold
- Pequena borda cinza nos botões
- Layout do Desktop igual ao Mobile nos textos
- Confirmação no botão “Encerrar”
- Fundo desfocado na modal de Parabéns
- Nova lógica do botão Gymrats
- Implementação de Local Storage para persistência de dados


### Versão 1.4.0
- Persistência de dados utilizando Local Storage
- Restabelecimento do estado do treino ao recarregar a página
- Salvamento automático após interações relevantes
- Correção de comportamento dos contadores ao pausar e recarregar a página
- Limpeza do Local Storage ao encerrar o treino

---

## Dependências

- Nenhuma dependência adicional.  
- Basta abrir o `index.html` (com `style.css` e `script.js` na mesma pasta) em um navegador moderno.

---

## Licença

Este projeto é livre para uso em academias, treinos pessoais etc.
