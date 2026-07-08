# 🦁 Lions Clube — Tesouraria Digital

Sistema de controle financeiro (contas a pagar e a receber) que moderniza o caderno de livro caixa do Lions Clube: mesmas colunas de sempre — **data, descrição, débito, crédito e saldo** — agora com dashboard, gráficos e resumo mensal pronto para apresentar à diretoria.

## Funcionalidades

- **6 contas independentes**, cada uma com nome, cor, descrição e saldo inicial configuráveis (Administrativa, Campanhas, Eventos, Ações Sociais, Sede, Fundo de Reserva — renomeie como quiser)
- **Livro caixa digital** por conta, com saldo corrente calculado automaticamente linha a linha
- **Dashboard** com saldo geral, entradas × saídas do mês, gráfico dos últimos 6 meses e composição do saldo por conta
- **Formas de lançamento**: Boleto (padrão), PIX, Dinheiro, Transferência, Cheque, Débito automático, Cartão e Outro
- **Resumo mensal para a diretoria**: quadro consolidado + extrato detalhado por conta, com linhas de assinatura do Tesoureiro e do Presidente — imprime ou salva em PDF direto do navegador
- **Exportação CSV** (abre no Excel) e **backup/restauração em JSON**
- **PIN de acesso** (hash SHA-256, nada é salvo em texto puro)
- **Dois modos de armazenamento**: local (funciona na hora, sem configurar nada) ou **Firebase Firestore** (sincroniza em tempo real entre os celulares/computadores da diretoria)
- Layout responsivo (celular e desktop) e instalável como PWA

## Como publicar (GitHub + Vercel)

1. Crie um repositório no GitHub (ex.: `lions-tesouraria`) e envie estes arquivos:
   ```bash
   git init
   git add .
   git commit -m "Tesouraria Lions Clube"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/lions-tesouraria.git
   git push -u origin main
   ```
2. No [Vercel](https://vercel.com): **Add New → Project → importe o repositório → Deploy**. Não precisa de build (é um site estático). Pronto — o sistema já está no ar.

## Ativar a sincronização na nuvem (Firebase) — opcional, recomendado

Sem esta etapa o sistema funciona em **modo local** (os dados ficam no navegador de quem usa). Para que tesoureiro, presidente e diretoria vejam os mesmos dados em tempo real:

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto (ex.: `lions-tesouraria`)
2. Menu **Build → Firestore Database → Criar banco de dados** (modo produção, região `southamerica-east1`)
3. Em **Configurações do projeto → Seus apps → ícone Web (`</>`)**, registre um app e copie o objeto `firebaseConfig`
4. Abra o `index.html`, localize `const FIREBASE_CONFIG = null;` e cole sua configuração:
   ```js
   const FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "lions-tesouraria.firebaseapp.com",
     projectId: "lions-tesouraria",
     storageBucket: "lions-tesouraria.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Em **Firestore → Regras**, publique regras. Para começar rápido:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   ⚠️ Essas regras deixam o banco aberto — o PIN do app protege a interface, mas para máxima segurança o ideal é ativar o **Firebase Authentication** e restringir as regras a usuários autenticados. Como o link do sistema circula só dentro da diretoria, muitas entidades operam bem assim no início.
6. Faça `git push` — o Vercel publica a atualização automaticamente.

Se você já tinha lançamentos no modo local, use **Configurações → Backup completo (JSON)** antes de ativar o Firebase e depois **Importar backup** para migrar tudo.

## Rotina sugerida do tesoureiro

1. Ao começar, vá em **Configurações** e informe o saldo inicial de cada conta (o saldo atual do caderno/extrato bancário)
2. Registre cada movimento no dia em que acontecer (leva ~10 segundos pelo celular)
3. No fim do mês, abra **Resumo mensal → Imprimir / salvar PDF** e leve para a reunião da diretoria
4. Uma vez por mês, baixe o **Backup completo (JSON)** e guarde no Drive do clube

## Stack

HTML único com Preact + htm (sem build), Chart.js para gráficos, Firebase Firestore (compat) opcional, deploy estático no Vercel. Fontes: Archivo + Inter.
