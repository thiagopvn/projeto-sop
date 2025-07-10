# README - Refatoração do Front-end

Este documento descreve a nova estrutura do front-end do projeto SOP, as decisões de design e como executar o build.

## Estrutura de Arquivos

- `scss/`: Contém os arquivos SASS para estilização.
  - `main.scss`: Ponto de entrada que importa todos os outros parciais.
  - `_variables.scss`: Variáveis de cor, tipografia, etc.
  - `_base.scss`: Estilos base e resets.
  - `_layout.scss`: Estilos para a estrutura principal (sidebar, navbar).
  - `_components.scss`: Estilos para componentes reutilizáveis.
  - `_dark.scss`: Estilos para o modo escuro.
- `js/modules/`: Contém os módulos JavaScript da aplicação.
  - `ui.js`: Lógica de renderização da UI.
  - `dashboard.js`: Lógica do dashboard.
  - `tables.js`: Lógica das tabelas.
  - `calendar.js`: Lógica do calendário.
  - `theme.js`: Lógica de troca de tema.
  - `firebase-service.js`: Funções de interação com o Firebase.
- `js/main.js`: Ponto de entrada da aplicação.
- `css/`: Contém o CSS compilado.

## Build do CSS

Para compilar os arquivos SASS, utilize os seguintes comandos:

- `npm run build:css`: Compila o SASS uma vez.
- `npm run watch:css`: Observa as alterações nos arquivos SASS e compila automaticamente.

## Modo Escuro

O modo escuro é ativado adicionando a classe `dark-mode` ao `<body>` do HTML. A lógica para alternar entre os modos está em `js/modules/theme.js`.
