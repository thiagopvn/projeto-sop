# Projeto SOP - Refatoração Front-end

Este documento descreve as mudanças e a nova arquitetura do front-end do Projeto SOP, focado em uma experiência de usuário moderna, limpa e responsiva.

## Estrutura do Projeto

O front-end foi refatorado para utilizar uma arquitetura modular, com SCSS para estilização e módulos ES6 para o JavaScript.

```
projeto-sop/
├───.gitignore
├───index.html
├───package-lock.json
├───package.json
├───README-refactor.md
├───.git/...
├───assets/
│   └───brasao.png
├───css/
│   └───styles.css         <-- CSS compilado do SCSS
├───js/
│   ├───firebase-config.js
│   ├───main.js
│   └───modules/
│       ├───calendar.js
│       ├───dashboard.js
│       ├───firebase-service.js
│       ├───tables.js
│       ├───theme.js
│       └───ui.js
├───node_modules/...
└───scss/
    ├───_base.scss
    ├───_components.scss
    ├───_dark.scss
    ├───_layout.scss
    ├───_variables.scss
    └───main.scss            <-- Ponto de entrada do SCSS
```

## Build do CSS

Para compilar os arquivos SCSS para CSS, utilize o seguinte comando:

```bash
npm run build:css
```

Este comando irá gerar o arquivo `css/styles.css` a partir dos arquivos SCSS na pasta `scss/`.

## Ativar Dark Mode

O tema escuro é ativado/desativado através de uma classe no `<body>` do `index.html`. Para ativar o dark mode, adicione a classe `dark-mode` ao elemento `<body>`:

```html
<body class="dark-mode">
  <!-- Conteúdo do aplicativo -->
</body>
```

Para desativar, remova a classe `dark-mode`.

**Observação:** A alternância do dark mode será implementada via JavaScript no módulo `theme.js` para uma experiência dinâmica.

## Dependências

As dependências do projeto são gerenciadas via `package.json`.

*   **sass**: Compilador Dart Sass para SCSS.
*   **Firebase**: SDKs para autenticação, Firestore e Storage.
*   **Chart.js**: Para renderização de gráficos.
*   **FullCalendar**: Para o componente de calendário.
*   **SweetAlert2**: Para modais de confirmação e alertas.
*   **Notyf**: Para notificações toast.
*   **Phosphor Icons**: Biblioteca de ícones para uma interface visualmente rica.

## Próximos Passos

1.  Implementar a lógica de UI nos módulos JavaScript (`js/modules/`).
2.  Integrar os componentes de UI com os dados do Firebase.
3.  Garantir a responsividade e acessibilidade em todas as telas.
4.  Realizar testes de funcionalidade e performance (Lighthouse).