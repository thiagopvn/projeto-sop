# Projeto SOP - Sistema de Organização de Documentos

Uma interface moderna e responsiva para gerenciamento de documentos QTA e QTM, desenvolvida com tecnologias web puras e Firebase.

## 🚀 Características

- **Interface Moderna**: Design limpo com paleta de cores profissional
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **SPA (Single Page Application)**: Navegação fluida sem recarregamento
- **Firebase Integration**: Autenticação, Firestore e Storage
- **Zero Build**: Pronto para usar sem processo de build
- **Deploy Simples**: Otimizado para Vercel

## 📁 Estrutura do Projeto

```
/public/
├── index.html              # Layout base com sidebar e navbar
├── style.css               # CSS puro com variáveis e design system
├── js/
│   ├── firebase-config.js   # Configuração e helpers do Firebase
│   ├── main.js             # Roteamento SPA e inicialização
│   ├── ui.js               # Componentes reutilizáveis
│   └── pages/
│       ├── dashboard.js     # Dashboard com métricas e gráficos
│       ├── livro-ordens.js  # Gestão de documentos
│       ├── qta.js          # Upload e gestão de QTA
│       ├── qtm.js          # Upload e gestão de QTM
│       └── calendario.js    # Calendário de eventos
├── vercel.json             # Configuração do Vercel
└── README.md               # Este arquivo
```

## 🎨 Design System

### Paleta de Cores
- **Fundo**: #F8F9FA
- **Cards**: #FFFFFF  
- **Primário**: #0057B8
- **Secundário**: #E30613
- **Sucesso**: #3CC47C
- **Aviso**: #FFC107
- **Erro**: #F44336

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Pesos**: 400 (normal), 600 (semibold)
- **Tamanhos**: h1 (1.5rem), h2 (1.25rem), body (0.9rem)
- **Altura da linha**: 1.4

### Componentes
- Sidebar colapsável com tooltips
- Navbar sticky com dropdown de usuário
- Tabelas responsivas com versão mobile em cards
- Drawer lateral para detalhes
- Modais para formulários
- Toasts para notificações
- Upload de arquivos com drag-and-drop

## 🔧 Funcionalidades

### Dashboard
- Métricas em tempo real
- Gráficos com Chart.js v4
- Barras de progresso mensais
- Lista de atividades recentes

### Livro de Ordens
- CRUD completo de documentos
- Busca e filtros avançados
- Visualização detalhada em drawer

### QTA/QTM
- Upload de PDFs para Firebase Storage
- Preview de documentos
- Organização por mês/ano
- Download direto

### Calendário
- FullCalendar v6 integrado
- Eventos categorizados por cores
- Visualização de prazos de documentos
- CRUD de eventos

## 🔐 Autenticação

O sistema usa Firebase Authentication com:
- Login por email/senha
- Estado persistente
- Proteção de rotas
- Logout seguro

## 📱 Responsividade

### Breakpoints
- **Desktop**: ≥ 1024px
- **Tablet**: 768px - 1023px  
- **Mobile**: ≤ 767px

### Adaptações Mobile
- Sidebar vira menu hamburger
- Tabelas viram cards empilhados
- Drawer ocupa tela inteira
- Navegação otimizada para toque

## ♿ Acessibilidade

- Contraste AA (Web Content Accessibility Guidelines)
- Foco visível em todos elementos interativos
- ARIA labels em botões e navegação
- Navegação por teclado funcional
- Estrutura semântica HTML5

## 🚀 Deploy no Vercel

### Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Projeto Firebase configurado
- Vercel CLI instalado: `npm i -g vercel`

### Passo a Passo

1. **Clone ou prepare o projeto**
   ```bash
   cd projeto-sop
   ```

2. **Verifique a estrutura**
   ```bash
   ls public/  # Deve mostrar index.html, style.css, js/, etc.
   ```

3. **Configure Firebase** (se necessário)
   - Atualize as credenciais em `public/js/firebase-config.js`
   - Configure regras do Firestore
   - Configure regras do Storage

4. **Deploy**
   ```bash
   # Deploy de produção
   vercel --prod
   
   # Ou deploy de preview
   vercel
   ```

5. **Configuração automática**
   - O Vercel detecta automaticamente o `vercel.json`
   - A pasta `public` é servida como raiz
   - SPAs são redirecionadas para `index.html`

### Exemplo de Deploy
```bash
$ vercel --prod
🔍  Inspect: https://vercel.com/user/projeto-sop/abcd1234
✅  Production: https://projeto-sop.vercel.app
```

## 🔥 Firebase Configuration

### Firestore Collections
```javascript
// livro-ordens
{
  id: string,
  tipo: 'qta' | 'qtm' | null,
  titulo: string,
  numero: string,
  fileName: string,
  fileUrl: string,
  storagePath: string,
  mes: string,
  mesNumero: number,
  ano: number,
  status: 'ativo' | 'pendente' | 'completo' | 'cancelado',
  uploadedBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// eventos
{
  id: string,
  titulo: string,
  dataInicio: string,
  dataFim: string,
  categoria: 'qta' | 'qtm' | 'reuniao' | 'prazo' | 'outros',
  descricao: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Storage Structure
```
gs://projeto-sop.firebasestorage.app/
├── qta/
│   └── 2025/
│       ├── qta_janeiro_1234567890.pdf
│       └── qta_fevereiro_1234567891.pdf
└── qtm/
    └── 2025/
        ├── qtm_janeiro_1234567892.pdf
        └── qtm_fevereiro_1234567893.pdf
```

## 📊 Performance

### Otimizações Implementadas
- CSS com variáveis nativas
- JavaScript ES6 modules
- Lazy loading de bibliotecas externas
- Imagens otimizadas
- Cache headers configurados
- Minificação automática pelo Vercel

### Lighthouse Score Target
- **Performance**: ≥ 90
- **Accessibility**: ≥ 90  
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

## 🛠️ Desenvolvimento Local

Para desenvolvimento local:

1. **Servidor HTTP simples**
   ```bash
   # Python 3
   python -m http.server 3000 --directory public
   
   # Node.js
   npx http-server public -p 3000
   
   # PHP
   php -S localhost:3000 -t public
   ```

2. **Acesse**: http://localhost:3000

## 🔧 Customização

### Alterando Cores
Edite as variáveis CSS em `public/style.css`:
```css
:root {
  --color-primary: #0057B8;    /* Cor principal */
  --color-secondary: #E30613;  /* Cor secundária */
  /* ... outras variáveis */
}
```

### Adicionando Páginas
1. Crie `public/js/pages/nova-pagina.js`
2. Adicione rota em `public/js/main.js`
3. Adicione item na sidebar em `public/index.html`

### Modificando Firebase
Atualize configurações em `public/js/firebase-config.js`

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Entre em contato via email

---

**Projeto SOP** - Sistema de Organização de Documentos  
Desenvolvido com ❤️ usando tecnologias web modernas