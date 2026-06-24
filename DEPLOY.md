# Guia de Implantação e Hospedagem (FinControl)

Este repositório contém a infraestrutura e os arquivos necessários para implantar e executar o aplicativo **FinControl** de forma totalmente autônoma em qualquer servidor ou plataforma de nuvem.

---

## 🚀 Como funciona a arquitetura do FinControl?

O FinControl é um aplicativo **Full-Stack (Vite + Express)** moderno:
- **Frontend**: Uma interface SPA super rápida desenvolvida em React com Tailwind CSS e configurada como **PWA** (Progressive Web App).
- **Backend**: Servidor Node.js em Express (`server.ts`) encarregado de intermediar chamadas seguras para a API do Gemini e manter chaves sensíveis protegidas contra vazamentos no navegador.
- **Banco de Dados**: Firebase Firestore para persistência em tempo real.

---

## 📦 Opções de Hospedagem Recomendadas

Dado que a aplicação possui um servidor backend Express, ela não pode ser hospedada de forma estática pura (como apenas no GitHub Pages convencional). É necessário utilizar um serviço que suporte execução de contêineres ou ambiente de execução Node.js.

### 1. Render.com (Recomendado, Fácil e Grátis/Acessível)
O Render conecta-se ao seu repositório do GitHub e reconstrói o app a cada alteração:
1. Cadastre-se em [Render.com](https://render.com).
2. Clique em **New +** e selecione **Web Service**.
3. Conecte o repositório do GitHub do FinControl.
4. Insira as seguintes configurações:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Nas variáveis de ambiente (**Environment Variables**), adicione:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = `(Sua chave de API do Gemini)`

### 2. Railway.app ou Fly.io
Ambos os serviços leem o arquivo `Dockerfile` automaticamente que já configuramos na raiz. O build e a implantação ocorrem em segundos de forma automatizada por contêineres Docker.

### 3. GitHub Pages (Hospedagem Estática do Frontend)
O **GitHub Pages** é uma plataforma excelente e gratuita de hospedagem estática. Ela só pode servir arquivos estáticos (HTML, CSS, JS), ou seja, ela **não consegue executar o servidor Express (`server.ts`)**.

No entanto, você pode hospedar o **frontend (FinControl)** no GitHub Pages e manter o **backend (IA Gemini)** rodando em outro serviço gratuito (como no Render.com):

1. **Configure o Backend no Render**: Crie um Web Service no Render conforme a instrução (1) e pegue a URL gerada (ex: `https://fincontrol-backend.onrender.com`).
2. **Configure o Frontend para GitHub Pages**:
   - No arquivo `vite.config.ts`, você pode adicionar a base correta para o repositório. Por exemplo, se seu repositório for `https://github.com/seu-usuario/fincontrol`, a base será:
     ```ts
     base: '/fincontrol/',
     ```
   - Nas configurações do seu repositório no GitHub, vá em **Settings > Pages**.
   - Em **Build and deployment > Source**, selecione **GitHub Actions**.
3. **Configure as Variáveis no GitHub**:
   - Vá em **Settings > Secrets and variables > Actions**.
   - Crie uma variável de ambiente pública em **Variables** chamada `VITE_BACKEND_URL` e defina o valor como a URL do seu backend no Render (ex: `https://fincontrol-backend.onrender.com`).
4. O nosso frontend irá se conectar de forma 100% transparente com o seu backend de inteligência artificial sem expor suas chaves de API no navegador!

### 4. VPS Própria (Contêiner Docker)
Se você possui sua própria VPS (Ubuntu, Debian, etc.), pode subir a aplicação instantaneamente usando o `Dockerfile` incluso:
```bash
# Construir a imagem do container
docker build -t fincontrol .

# Executar o container expondo a porta de rede do servidor
docker run -d -p 3000:3000 --env GEMINI_API_KEY="SUA_CHAVE_AQUI" fincontrol
```

---

## 🛡️ Configuração do GitHub Actions

O arquivo `.github/workflows/deploy.yml` já está configurado. A cada `git push` nas branches `main` ou `master`, o GitHub Actions irá:
1. Baixar o código.
2. Configurar o ambiente do Node.js v20.
3. Instalar as dependências de forma limpa (`npm ci`).
4. Validar os tipos de código com o TypeScript Linter (`npm run lint`).
5. Gerar os pacotes otimizados de produção tanto do frontend quanto do backend (`npm run build`).

### Integrando Deploy Automático com o Render pelo GitHub Actions:
Para que o GitHub Actions avise o Render para implantar a nova versão automaticamente após passar nas checagens:
1. No painel do seu serviço no Render, vá em **Settings** e copie o **Deploy Hook** (uma URL secreta para disparar implantações).
2. No seu repositório do GitHub, vá em **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
3. Crie um secret chamado `RENDER_DEPLOY_HOOK_URL` e cole a URL copiada.
4. No arquivo `.github/workflows/deploy.yml`, remova o comentário `#` do bloco `deploy-render` para ativar o gatilho automático!

---

## 🔒 Variáveis de Ambiente e Segurança

Certifique-se de configurar a variável `GEMINI_API_KEY` no painel da sua hospedagem escolhida. Ela nunca deve ser colocada diretamente no código ou subida no repositório do GitHub público para evitar cobranças ou suspensões.
