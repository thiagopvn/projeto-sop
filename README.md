# Sistema de Ordens Policiais (SOP) v3.0

Sistema completo de gestão de ordens policiais com interface moderna e responsiva.

## 🚀 Funcionalidades

- **Dashboard** com estatísticas e gráficos em tempo real
- **QTA** (Quadro de Trabalho Administrativo) - formulários e listagem
- **QTM** (Quadro de Trabalho Material) - upload e gestão de documentos
- **Livro de Ordens** - registro e consulta de ordens
- **Calendário** de eventos e agendamentos
- **Dark Mode** com persistência de preferência
- **Design Responsivo** para desktop, tablet e mobile
- **Integração Firebase** para dados e storage

## 🛠 Tech Stack

- **Frontend**: HTML5, SCSS (Dart-Sass), JavaScript ES6 Modules
- **Build**: esbuild, npm scripts
- **Styling**: CSS Grid/Flexbox, CSS Variables
- **Icons**: Lucide (SVG)
- **Charts**: Chart.js v4
- **Calendar**: FullCalendar v6
- **Upload**: Dropzone.js
- **Notifications**: Notyf
- **Backend**: Firebase (Firestore + Storage)
- **Deploy**: Vercel

## 🎨 Design System

### Paleta de Cores
- **Primary**: #0057B8 (Azul institucional)
- **Danger**: #E30613 (Vermelho)
- **Success**: #22C55E (Verde)
- **Warning**: #FACC15 (Amarelo)
- **Background**: #F9FAFB (Cinza claro)
- **Surface**: #FFFFFF (Branco)

### Tipografia
- **Família**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700

### Breakpoints
- **Mobile**: 480px
- **Tablet**: 768px
- **Desktop**: 1024px
- **Wide**: 1280px

## 📁 Estrutura do Projeto

```
src/
├── index.html              # Página principal
├── scss/                   # Estilos SCSS modulares
│   ├── _variables.scss     # Variáveis globais
│   ├── _mixins.scss        # Mixins utilitários
│   ├── main.scss           # Arquivo principal
│   ├── components/         # Estilos de componentes
│   └── pages/              # Estilos específicos de páginas
├── js/                     # JavaScript ES6 modular
│   ├── main.js             # Ponto de entrada
│   ├── core/               # Classes principais
│   │   ├── app.js          # Aplicação principal
│   │   ├── config.js       # Configurações
│   │   ├── firebase.js     # Integração Firebase
│   │   ├── router.js       # Sistema de rotas
│   │   └── theme.js        # Gerenciamento de tema
│   ├── components/         # Componentes JS
│   │   ├── sidebar.js      # Sidebar navegação
│   │   ├── navbar.js       # Barra superior
│   │   ├── modal.js        # Sistema de modais
│   │   └── toast.js        # Notificações
│   └── pages/              # Controladores de página
│       └── dashboard.js    # Página dashboard
└── assets/                 # Recursos estáticos
    ├── icons/              # Ícones SVG
    └── images/             # Imagens
```

## 🚀 Comandos

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Desenvolvimento com watch
npm run dev

# Servidor de desenvolvimento
npm run serve
```

### Build para Produção
```bash
# Build completo
npm run build

# Preview do build
npm run preview
```

### Comandos Individuais
```bash
# SCSS para CSS
npm run build:sass

# JavaScript bundle
npm run build:js

# Copiar assets
npm run build:copy
```

## 🔧 Configuração

### Firebase
Configure as credenciais Firebase em `src/js/core/config.js`:

```javascript
firebase: {
  config: {
    apiKey: "sua-api-key",
    authDomain: "projeto-sop.firebaseapp.com",
    projectId: "projeto-sop",
    storageBucket: "projeto-sop.firebasestorage.app"
  }
}
```

### Vercel Deploy
O projeto está configurado para deploy automático na Vercel:
- **Output Directory**: `public/`
- **Build Command**: `npm run build`

## 📊 Firebase Collections

- **livro-ordens**: Registro de ordens policiais
- **qta**: Quadros de trabalho administrativo
- **qtm**: Quadros de trabalho material
- **usuarios**: Dados de usuários
- **eventos**: Eventos do calendário

## 🎯 Acessibilidade

- **WCAG 2.1 AA** compliance
- **Foco visível** em todos elementos interativos
- **Aria-labels** descritivos
- **Navegação por teclado** completa
- **Alto contraste** no modo escuro
- **Texto escalável** até 200%

## 📱 Responsividade

- **Desktop**: Layout completo com sidebar
- **Tablet**: Sidebar colapsável
- **Mobile**: Menu sobreposto + layout otimizado

## 🌙 Dark Mode

Alternância automática baseada em:
1. Preferência salva do usuário
2. Configuração do sistema (prefers-color-scheme)
3. Padrão: modo claro

## 🔒 Segurança

- **Content Security Policy** headers
- **SRI hashes** para recursos externos
- **HTTPS** obrigatório em produção
- **Firebase Security Rules** configuradas

## 📈 Performance

- **Lazy loading** de módulos JavaScript
- **CSS crítico** inline
- **Imagens otimizadas**
- **Gzip/Brotli** compression
- **CDN** para bibliotecas externas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Versão**: 3.0.0  
**Última atualização**: Janeiro 2025