# 🚀 T-Base Workflow & Zen AI Assistant

**T-Base Workflow** is a powerful desktop application built with **Electron, React, TypeScript, and Vite**, designed for advanced project management and AI-driven productivity. It combines a visual, node-based workflow builder with a sophisticated AI assistant named **Zen**.

---

## 🌟 Key Features

### 1. Visual Workflow Builder (Node-Based)
Manage your projects and tasks through an interactive, drag-and-drop canvas powered by **React Flow**.
- **Nodes**: Create specialized nodes for Members, Tasks, and Projects.
- **Connections**: Define relationships, assignments, and dependencies using visual edges.
- **Properties Editor**: Real-time attribute editing via a glassmorphism-styled panel.
- **Persistence**: Save and load your entire workflow as `.json` files locally.

### 2. Zen AI Assistant
A high-performance AI side panel fully integrated into your workspace.
- **Multi-Provider Support**: Seamlessly connect to providers like DeepSeek, Gemini, and more.
- **Persistent Conversations**: Smart history management that restores model context and chat memory.
- **Account Management**: Centralized dashboard to manage AI API keys and provider settings.
- **Quick Switcher**: Effortlessly toggle between different models within the chat footer.

### 3. Elara Backend Service
An internal, high-efficiency backend service running within the Electron main process.
- **Local API**: Provides a RESTful API for AI orchestration, workspace management, and system integration.
- **Persistence Layer**: Uses **SQLite (better-sqlite3)** for robust local data storage.

---

## 🏗️ Architecture Overview

The project follows a modern Electron architecture:

- **`src/main`**: Core Electron logic and the **Elara** backend service.
- **`src/preload`**: Secure IPC (Inter-Process Communication) bridge.
- **`src/renderer`**: The React-based frontend application.
    - `features/AiAssistant`: The "Zen" interface and its logic.
    - `components/WorkflowCanvas`: The visual builder core.
    - `contexts/`: Global state management for preferences and workflows.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, React Flow.
- **Backend**: Express 5, Node.js.
- **Desktop**: Electron.
- **Database**: SQLite (better-sqlite3), LanceDB (vector search/memory).
- **AI**: Zod for schema validation, Tiktoken for tokenization.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Launch the application in development mode:
```bash
npm run dev
```

### Building for Production
Create a production-ready package for your OS:
```bash
npm run build:win  # For Windows
npm run build:mac  # For macOS
npm run build:linux # For Linux
```

---

## 📝 Vietnamese Summary (Tóm tắt)

**T-Base Workflow** là ứng dụng desktop tích hợp giữa trình quản lý công việc dạng sơ đồ (Node-based) và trợ lý ảo AI **Zen**. 

- **Workflow Builder**: Sử dụng React Flow để tạo sơ đồ công việc trực quan.
- **Zen AI Assistant**: Hỗ trợ nhiều model AI (DeepSeek, Gemini), tự động lưu trữ và khôi phục ngữ cảnh hội thoại.
- **Elara Service**: Dịch vụ backend chạy ngầm trong Electron giúp xử lý dữ liệu AI và hệ thống file cục bộ một cách bảo mật và hiệu quả.

---
*Developed with ❤️ focusing on Visual Excellence and AI Integration.*
