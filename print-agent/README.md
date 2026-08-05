# 🖨️ The Burguer — Print Agent (Android + Knup KP-1025)

Aplicativo Android em React Native desenvolvido especificamente como **Print Agent** para a hamburgueria *The Burguer*.

Conecta-se ao backend NestJS via **WebSocket (Socket.IO)** no namespace `/printer` e imprime pedidos automaticamente via **Bluetooth (ESC/POS)** na mini impressora térmica portátil **Knup KP-1025 (bobina 58mm)**.

---

## 📋 Funcionalidades

- 🔌 **Conexão Realtime WebSocket**: Reconexão automática, heartbeat a cada 30 segundos e emissão dos eventos `register_agent`, `heartbeat`, `print_success` e `print_error`.
- 🖨️ **Formatação ESC/POS 58mm**: Layout otimizado para a Knup KP-1025 (32 caracteres/linha), incluindo cabeçalho, número do pedido, dados do cliente, itens com observações e total.
- 📱 **Interface Intuitiva**: Painel com indicadores de status do Backend e da Impressora Bluetooth, log de atividades em tempo real e botão de teste de impressão.
- ⚙️ **Configuração Fácil**: Permite definir a URL do backend NestJS, Store ID da loja e selecionar a impressora Bluetooth diretamente pelo app.

---

## 🚀 Como Executar o Aplicativo

### Pré-requisitos
1. Node.js (>= 18)
2. Android Studio com SDK e JDK configurados (ou dispositivo Android via depuração USB)
3. Impressora **Knup KP-1025** pareada nas configurações de Bluetooth do Android:
   - **PIN padrão de pareamento:** `0000` (ou `1234`)

### Passos de Instalação e Execução

```bash
# 1. Navegue até a pasta do Print Agent
cd print-agent

# 2. Instale as dependências (caso não tenha instalado)
npm install --legacy-peer-deps

# 3. Conecte seu dispositivo Android via USB (ou inicie um emulador)
adb devices

# 4. Inicie o aplicativo no Android
npx react-native run-android
```

---

## 📦 Gerar APK de Produção para o Tablet/Celular

Para gerar o instalador `.apk` para instalar diretamente no dispositivo da loja sem depender do computador:

```bash
cd print-agent/android
./gradlew assembleRelease
```

O arquivo APK gerado estará em:
`print-agent/android/app/build/outputs/apk/release/app-release.apk`

---

## ⚙️ Configuração no App

1. Abra o app no dispositivo Android.
2. Clique no botão **⚙️ Config** no canto superior direito.
3. Insira a URL do backend (Ex: `https://the-burguer-backend.onrender.com`).
4. Selecione a impressora **Knup KP-1025** na lista de dispositivos Bluetooth pareados.
5. Clique em **Salvar Configurações**.
6. No painel principal, clique em **🖨️ Testar Impressão KP-1025** para verificar a impressão do cupom de teste.
