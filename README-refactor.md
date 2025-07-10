## Refatoração do Projeto SOP

Este documento descreve as etapas da refatoração do projeto SOP, com foco na modernização do frontend, remoção de dependências externas problemáticas e melhoria da performance.

### Instruções de Instalação e Build

1.  **Instale as dependências:**

    ```bash
    npm install
    ```

2.  **Instale o Lucide Icons:**

    ```bash
    npm i lucide
    ```

3.  **Execute o ambiente de desenvolvimento:**

    ```bash
    npm run dev
    ```

    Este comando irá compilar os arquivos SCSS, iniciar um servidor de desenvolvimento com ESBuild (que inclui o Babel-preset-env para compatibilidade) e copiar os ícones locais para o diretório `/dist/assets/`.

4.  **Visualize o projeto:**

    Abra o navegador em `http://localhost:4173` para ver o projeto em execução.
