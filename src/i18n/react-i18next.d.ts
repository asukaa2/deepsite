import 'react-i18next';

// 这里声明翻译的类型结构
declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: {
        app: {
          title: string;
          subtitle: string;
        };
        header: {
          new: string;
        };
        settings: {
          title: string;
          aiInfo: string;
          maxTokenLimit: string;
          configHint: string;
        };
        tabs: {
          editor: string;
          preview: string;
        };
        editor: {
          resetConfirm: string;
        };
        deploy: {
          deploy: string;
          login: string;
          deploying: string;
          success: string;
          error: string;
          fixErrors: string;
        };
        askAI: {
          placeholder: string;
          working: string;
          clear: string;
        };
        toast: {
          contentRestored: string;
          remixLoaded: string;
          remixFailed: string;
        };
        language: {
          en: string;
          zh: string;
        };
      };
    };
  }
} 