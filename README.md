# LocalMind 🧠

![LocalMind Chat Demo](image%20copy%202.png)
![LocalMind Downloading Demo](image%20copy.png)
![LocalMind Settings Demo](image%20copy%203.png)

**LocalMind** is a production-grade, privacy-first AI chatbot that runs **100% offline directly in your web browser**. By leveraging WebGPU and the WebLLM engine, LocalMind downloads quantized open-source models (like Llama 3 and Mistral) directly to your local device and executes them using your own hardware. 

No backend servers. No API keys. Absolute privacy.

## ✨ Features

- **100% Local Inference**: All AI computations are handled by your GPU via WebGPU. Your prompts and data never leave your device.
- **Agentic File System Access**: Connect a local folder to the app, and the AI can autonomously read, list, and write to your local files using tool-calling (compatible with Hermes models).
- **Progressive Web App (PWA)**: Install LocalMind on your desktop or mobile device. Once the models are downloaded, the app works entirely offline without an internet connection.
- **Multiple Models**: Seamlessly switch between highly capable quantized models including **Llama 3.2**, **Qwen 2.5**, and **Hermes Pro**.
- **Data Persistence**: All your conversations, settings, and downloaded model weights are securely cached in your browser's IndexedDB (via Dexie).
- **Modern UI**: A premium, responsive interface built with Tailwind CSS, Framer Motion, and React 19.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **AI Engine**: `@mlc-ai/web-llm` (WebGPU)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB wrapper)
- **UI Components**: Framer Motion, React Virtuoso, Lucide React
- **Markdown**: React Markdown + Syntax Highlighter

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A modern browser with WebGPU support (Chrome, Edge, Brave).
- A device with at least 4-8GB of shared or dedicated RAM (depending on the model you intend to run).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/localmind.git
   cd localmind
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (exposed to your local network):
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local address provided by Vite (e.g., `http://localhost:5174`).

### Building for Production

To build the optimized, PWA-ready production bundle:
```bash
npm run build
```
This generates a `dist/` directory that can be statically hosted anywhere (Vercel, Netlify, GitHub Pages, etc.).

## 📂 Agentic File System (Tool Calling)

**LocalMind** features an advanced "Regex Interceptor Harness". By clicking **"Connect Folder"** in the sidebar, you grant the browser access to a local directory. If you are using a capable tool-calling model (like **Hermes-2-Pro-Mistral-7B**), the AI can autonomously execute read/write commands on your file system to help you code, analyze data, and refactor files offline.

> **Note**: The browser will explicitly ask for your permission before the AI is allowed to write or modify any files on your local disk.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to add support for new WebLLM models, feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
