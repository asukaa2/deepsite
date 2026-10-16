import { useState, useEffect } from "react";
import { useMount, useEvent, useLocalStorage, useSearchParam } from "react-use";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import TopBar from "./header/header";
import LanguageSwitcher from "./language-switcher/language-switcher";
import Sidebar from "./sidebar/sidebar";
import ChatPanel from "./chat/chat-panel";
import EditorPreview from "./editor/editor-preview";

import { defaultHTML } from "../../utils/consts";
import { useProvidersStore } from "../store/providersStore";
import { useChatStore } from "../store/chatStore";

function App() {
  const { t, i18n } = useTranslation();
  const [htmlStorage, , removeHtmlStorage] = useLocalStorage("html_content");
  const remix = useSearchParam("remix");

  const [html, setHtml] = useState((htmlStorage as string) ?? defaultHTML);
  const [previousPrompt, setPreviousPrompt] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("vanilla");
  const [selectedUI, setSelectedUI] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [modelParams, setModelParams] = useState<any>();
  const [pendingClone, setPendingClone] = useState<{ url: string } | null>(null);
  const [streaming, setStreaming] = useState(false);
  // Multi-file project mode (fullstack)
  const [projectFiles, setProjectFiles] = useState<Record<string, string> | null>(null);
  const [activeFile, setActiveFile] = useState<string>("index.html");

  const { providers, current, configs } = useProvidersStore();
  const { isWorking } = useChatStore();

  // Restore persisted settings
  useEffect(() => {
    const storedTemplateId = localStorage.getItem("selected_template");
    if (storedTemplateId) setSelectedTemplateId(storedTemplateId);
    const storedUI = localStorage.getItem("selected_ui");
    if (storedUI) setSelectedUI(storedUI);
    const storedTools = localStorage.getItem("selected_tools");
    if (storedTools) {
      try {
        setSelectedTools(JSON.parse(storedTools));
      } catch {}
    }
    const storedModelParams = localStorage.getItem("model_params");
    if (storedModelParams) {
      try {
        setModelParams(JSON.parse(storedModelParams));
      } catch {}
    }
  }, []);

  // Restore HTML content
  useMount(() => {
    if (htmlStorage) {
      removeHtmlStorage();
      toast.warn(t("toast.contentRestored"));
    }
    if (remix) {
      fetch(`/api/remix/${remix}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.html) {
            setHtml(data.html);
            toast.success(t("toast.remixLoaded"));
          }
        })
        .catch(() => toast.error(t("toast.remixFailed")));
      const url = new URL(window.location.href);
      url.searchParams.delete("remix");
      window.history.replaceState({}, document.title, url.toString());
    }
    localStorage.setItem("app_initialized", "true");
  });

  // Prevent accidental unload
  useEvent("beforeunload", (e) => {
    if (isWorking || html !== defaultHTML) {
      e.preventDefault();
      return "";
    }
  });

  // Auto-save HTML to localStorage
  useEffect(() => {
    if (html !== defaultHTML) {
      localStorage.setItem("html_content", html);
    }
  }, [html]);

  // Reflect isWorking as streaming flag for editor/preview
  useEffect(() => {
    setStreaming(isWorking);
  }, [isWorking]);

  const handleReset = () => {
    if (isWorking) {
      toast.warn(t("askAI.working"));
      return;
    }
    if (html !== defaultHTML && !window.confirm(t("editor.resetConfirm"))) return;
    setHtml(defaultHTML);
    setPreviousPrompt("");
    setProjectFiles(null);
    toast.success(t("toast.resetSuccess"));
  };

  const handleTemplateChange = (
    framework: string,
    ui: string | null,
    tools: string[]
  ) => {
    setSelectedTemplateId(framework);
    setSelectedUI(ui);
    setSelectedTools(tools);
    localStorage.setItem("selected_template", framework);
    if (ui) localStorage.setItem("selected_ui", ui);
    else localStorage.removeItem("selected_ui");
    if (tools.length > 0) localStorage.setItem("selected_tools", JSON.stringify(tools));
    else localStorage.removeItem("selected_tools");
    localStorage.setItem("last_template_id", framework);

    // Reset project mode if leaving a fullstack template
    if (!["nextjs-fullstack", "express-react", "mern-stack"].includes(framework)) {
      setProjectFiles(null);
    }

    // Try to fetch the template HTML
    if (html !== defaultHTML) {
      if (window.confirm(`Replace current HTML with ${framework} template?`)) {
        loadTemplate(framework);
      }
    } else {
      loadTemplate(framework);
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.template?.html) {
          setHtml(data.template.html);
          toast.success(t("toast.templateLoaded", { name: data.template.name }));
        }
      }
    } catch (e) {
      toast.error(t("toast.templateLoadError"));
    }
  };

  const handleModelParamsChange = (params: any) => {
    setModelParams(params);
    localStorage.setItem("model_params", JSON.stringify(params));
  };

  // Provider info for the top bar
  const provider = providers.find((p) => p.id === current);
  const cfg = configs[current] || { apiKey: "", baseUrl: "", model: "" };

  const currentLang = i18n.language?.startsWith("zh") ? "zh" : "en";

  // When AI streams a project (multi-file) output, switch to project mode
  const handleStreamingUpdate = (h: string) => {
    setHtml(h);
    // Detect multi-file markers <!--file:path--> ... <!--/file-->
    const fileMap: Record<string, string> = {};
    const re = /<!--file:([^\s]+)-->\n?([\s\S]*?)<!--\/file-->/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(h)) !== null) {
      // Strip an optional single pair of ```lang ... ``` fences around the content
      let content = m[2].trimEnd();
      const fenceMatch = content.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
      if (fenceMatch) content = fenceMatch[1];
      fileMap[m[1]] = content;
    }
    if (Object.keys(fileMap).length > 0) {
      setProjectFiles(fileMap);
      if (!fileMap[activeFile]) setActiveFile(Object.keys(fileMap)[0]);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <TopBar
        onReset={handleReset}
        providerName={provider?.name}
        modelName={cfg.model}
      >
        <LanguageSwitcher />
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <Sidebar
          html={html}
          onReset={handleReset}
          onTemplateChange={handleTemplateChange}
          selectedTemplateId={selectedTemplateId}
          selectedUI={selectedUI}
          selectedTools={selectedTools}
          modelParams={modelParams}
          onModelParamsChange={handleModelParamsChange}
          onClone={(data) => setPendingClone(data)}
          projectFiles={projectFiles}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
        />
        <EditorPreview
          html={html}
          setHtml={setHtml}
          isWorking={isWorking}
          isStreaming={streaming}
          projectFiles={projectFiles}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          setProjectFiles={setProjectFiles}
        />
        <div className="w-[440px] flex-none">
          <ChatPanel
            html={html}
            setHtml={setHtml}
            previousPrompt={previousPrompt}
            setPreviousPrompt={setPreviousPrompt}
            templateId={selectedTemplateId}
            language={currentLang}
            maxTokens={modelParams?.max_tokens ?? 64000}
            temperature={modelParams?.temperature ?? 0}
            onStreamingUpdate={handleStreamingUpdate}
            pendingClone={pendingClone}
            clearPendingClone={() => setPendingClone(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
