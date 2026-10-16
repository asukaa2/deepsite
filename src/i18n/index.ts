import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入本地化文件
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

// 初始化 i18n
i18n
  .use(LanguageDetector) // 自动检测用户浏览器语言
  .use(initReactI18next) // 初始化 react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      zh: {
        translation: zhTranslation
      }
    },
    fallbackLng: 'en', // 如果检测不到语言或者当前语言没有对应翻译则使用英文
    debug: true, // 开发环境开启调试模式，帮助排查问题
    interpolation: {
      escapeValue: false // 不使用 React 已经安全的转义
    },
    detection: {
      // 语言检测选项
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng', // URL参数名称，例如：?lng=zh
      lookupCookie: 'i18next', // Cookie名称
      lookupLocalStorage: 'i18nextLng', // localStorage键名
      caches: ['localStorage', 'cookie'], // 缓存用户语言选择
    }
  });

// 输出当前检测到的语言，便于调试
console.log('i18next initialized with language:', i18n.language);

// 监听语言变化
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});

export default i18n; 