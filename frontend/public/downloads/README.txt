Para disponibilizar o download do APK diretamente pelo painel admin no Vercel:

1. Gere o arquivo .apk de produção executando em print-agent/:
   cd print-agent/android && ./gradlew assembleRelease

2. Copie o arquivo gerado de:
   print-agent/android/app/build/outputs/apk/release/app-release.apk

   Para esta pasta:
   frontend/public/downloads/print-agent.apk

3. Faça git commit e push para o Vercel. O botão "Baixar Print Agent (Arquivo APK)" no AdminDashboard fará o download direto do instalador.
