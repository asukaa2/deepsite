import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { loader } from "@monaco-editor/react";
import "./assets/index.css";
import App from "./components/App.tsx";
// 导入 i18n 配置
import "./i18n";

// 配置 Monaco Editor 加载器，使用本地资源
loader.config({
  paths: {
    // 使用本地路径而不是 CDN
    vs: "/monaco-editor/min/vs"
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <ToastContainer />
  </StrictMode>
);
