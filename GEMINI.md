
# Documentação do Projeto SOP

## Visão Geral

O SOP (Sistema de Organização de Documentos) é uma aplicação web projetada para gerenciar e organizar documentos de forma eficiente. A aplicação utiliza Firebase para autenticação, armazenamento de arquivos e banco de dados em tempo real. O front-end é construído com HTML, CSS e JavaScript, utilizando a biblioteca FullCalendar para a funcionalidade de calendário e Chart.js para visualização de dados no dashboard.

## Estrutura de Arquivos

```
/
├── index.html                # Arquivo principal da aplicação
├── server.js                 # Servidor Node.js para servir os arquivos estáticos
├── assets/
│   └── brasao.png            # Imagem do brasão
├── css/
│   ├── dashboard.css         # Estilos específicos para o dashboard
│   └── styles.css            # Estilos globais da aplicação
└── js/
    ├── app.js                # Lógica principal da aplicação
    ├── calendar.js           # Funcionalidades do calendário
    ├── dashboard.js          # Lógica do dashboard
    ├── firebase-config.js    # Configuração do Firebase
    ├── livro-ordens.js       # Lógica para a seção "Livro de Ordens"
    ├── login-fix.js          # Correções de estilo para a tela de login
    ├── main.js               # Ponto de entrada principal do JavaScript (modular)
    ├── operacao-simulada.js  # Lógica para a seção "Operação Simulada"
    └── modules/
        ├── calendar.js
        ├── dashboard.js
        ├── firebase-service.js
        ├── icons.js
        ├── tables.js
        ├── theme.js
        └── ui.js
```

## Componentes Principais

### `index.html`

Este é o arquivo HTML principal que estrutura toda a aplicação. Ele inclui:
- **Cabeçalho**: Meta tags, título e links para as bibliotecas externas (Firebase, Tailwind CSS, Font Awesome, Chart.js, FullCalendar).
- **Login**: Container da tela de login, que é exibido inicialmente.
- **Aplicação Principal**: Container principal da aplicação, que fica oculto até o usuário fazer login. Inclui a barra de navegação, a barra lateral (sidebar) e a área de conteúdo principal.
- **Modais**:
    - Modal de Upload: Para enviar novos documentos.
    - Modal de Configuração: Para ajustar configurações, como o número de semanas por mês.
    - Modal de Evento: Para criar e editar eventos no calendário.
    - Modal de Ordem: Para upload de documentos no "Livro de Ordens".
    - Modal de Operação: Para upload de documentos na "Operação Simulada".
- **Scripts**:
    - Configuração e inicialização do Firebase.
    - Inclusão de todos os arquivos JavaScript da aplicação.

### `server.js`

Um servidor Node.js simples que utiliza o módulo `http` para servir os arquivos estáticos do projeto. Ele mapeia as requisições para os arquivos locais e os entrega com o `Content-Type` apropriado.

### CSS

- **`styles.css`**: Contém os estilos globais da aplicação, como variáveis de cor, estilos de botões, layout principal, modais e a tela de login.
- **`dashboard.css`**: Estilos específicos para os elementos do dashboard, como os cartões de resumo, gráficos e listas.

### JavaScript

#### `app.js`

Este arquivo é o coração da lógica do front-end. Suas principais responsabilidades são:
- **Gerenciamento de Estado**: Mantém o estado da aplicação, como o usuário atual, a categoria selecionada e o mês atual.
- **Autenticação**: Lida com o login, logout e o estado de autenticação do usuário através do Firebase Auth.
- **Navegação**: Gerencia a navegação entre as diferentes seções da aplicação (Dashboard, Aulas, Calendário, etc.).
- **Carregamento de Dados**: Carrega os documentos da categoria selecionada do Firestore.
- **Renderização Dinâmica**: Cria e atualiza a lista de documentos na interface do usuário.
- **Modais**: Controla a abertura, o fechamento e a lógica dos modais de upload e configuração.

#### `dashboard.js`

Responsável por toda a lógica e visualização de dados no dashboard.
- **Carregamento de Dados do Dashboard**: Busca e processa os dados necessários para os cartões de resumo, gráficos e listas.
- **Inicialização e Atualização de Gráficos**: Utiliza Chart.js para renderizar os gráficos de "Progresso por Categoria" e "Tendência Mensal".
- **Atualização da UI**: Atualiza os cartões de resumo, a lista de próximos eventos e a lista de documentos pendentes.

#### `calendar.js`

Gerencia a funcionalidade do calendário.
- **Inicialização do Calendário**: Configura e renderiza o FullCalendar.
- **Gerenciamento de Eventos**:
    - Carrega eventos do Firestore.
    - Permite a criação, edição e exclusão de eventos através de um modal.
    - Suporta arrastar e soltar (drag-and-drop) para atualizar as datas dos eventos.

#### `livro-ordens.js` e `operacao-simulada.js`

Esses arquivos contêm a lógica para as seções "Livro de Ordens" и "Operação Simulada", respectivamente. Suas funcionalidades são muito semelhantes:
- **Carregamento de Documentos**: Buscam e exibem uma lista de documentos específicos de sua categoria do Firestore.
- **CRUD de Documentos**: Permitem a criação (upload), visualização, edição (metadados) e exclusão de documentos.
- **Controle de Modal**: Gerenciam um modal específico para upload e edição de documentos.

#### `firebase-config.js`

Contém a configuração do Firebase e inicializa os serviços de Autenticação, Firestore e Storage.

#### `login-fix.js`

Um pequeno script para garantir que a tela de login permaneça visualmente centralizada, aplicando estilos CSS para corrigir possíveis problemas de layout.

#### Módulos (`js/modules/`)

O diretório `modules` sugere uma arquitetura mais modularizada que não está totalmente integrada com o restante do código (que segue um estilo mais monolítico).
- **`firebase-service.js`**: Abstrai as interações com o Firestore e o Firebase Storage em serviços reutilizáveis.
- **`ui.js`**: Centraliza as funções de manipulação da interface do usuário, como renderizar a UI autenticada/não autenticada e exibir notificações.
- **`dashboard.js`, `calendar.js`, `tables.js`**: Módulos para renderizar as diferentes seções da aplicação.
- **`theme.js`**: Lida com a funcionalidade de alternância de tema (claro/escuro).
- **`icons.js`**: Um helper para utilizar ícones da biblioteca `lucide`.

## Fluxo de Funcionamento

1.  **Inicialização**: O usuário acessa `index.html`. O `server.js` serve o arquivo.
2.  **Login**: A tela de login é exibida. `app.js` aguarda a entrada do usuário.
3.  **Autenticação**: O usuário insere suas credenciais. `app.js` utiliza o Firebase Auth para verificar as credenciais.
4.  **Carregamento da Aplicação**:
    - Se a autenticação for bem-sucedida, o container de login é ocultado e o container principal da aplicação é exibido.
    - `app.js` carrega os dados iniciais, como as configurações de semanas por mês.
    - O dashboard é exibido por padrão. `dashboard.js` busca os dados e renderiza os gráficos e cartões.
5.  **Navegação**:
    - O usuário clica em uma categoria na barra lateral.
    - `app.js` detecta a mudança, atualiza o estado da aplicação e a interface do usuário.
    - O conteúdo da nova seção é carregado e renderizado (por exemplo, a lista de documentos de "Aulas" ou o calendário).
6.  **Interação com Documentos**:
    - O usuário pode fazer upload de novos documentos através do modal de upload.
    - `app.js` (ou `livro-ordens.js`/`operacao-simulada.js`) lida com o upload do arquivo para o Firebase Storage e salva os metadados no Firestore.
    - O usuário pode visualizar, baixar ou excluir documentos existentes.
7.  **Calendário**:
    - Na seção "Calendário", `calendar.js` exibe os eventos do Firestore.
    - O usuário pode criar, editar ou excluir eventos, e as alterações são salvas no Firestore.
8.  **Logout**: O usuário clica no botão "Sair". `app.js` chama a função de logout do Firebase e redireciona o usuário de volta para a tela de login.
