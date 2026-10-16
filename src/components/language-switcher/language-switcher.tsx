import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLanguage } from 'react-icons/md';
import classNames from 'classnames';

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  // 检查当前语言，如果以 'zh' 开头则认为是中文
  const isChinese = i18n.language.startsWith('zh');
  const currentLanguage = isChinese ? 'zh' : 'en';

  // 切换语言
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
    console.log('Language changed to:', lng);
    
    // 设置页面标题，以反映语言变化
    document.title = t('app.title');
  };

  // 检查是否是首次访问，仅在首次访问时添加闪烁效果
  const [highlight, setHighlight] = useState(false);
  
  useEffect(() => {
    // 检查本地存储，判断是否首次访问
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    // 如果是首次访问，添加闪烁效果并记录到本地存储
    if (!hasVisitedBefore) {
      const timer = setInterval(() => {
        setHighlight(prev => !prev);
      }, 1000);
      
      // 5秒后停止闪烁
      setTimeout(() => {
        clearInterval(timer);
        setHighlight(false);
        // 记录用户已访问
        localStorage.setItem('hasVisitedBefore', 'true');
      }, 5000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, []);

  return (
    <div className="relative">
      <button
        className={classNames(
          "relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-md text-xs lg:text-sm font-semibold py-1.5 px-3 text-white shadow-sm dark:shadow-highlight/20 mx-2 transition-all duration-300",
          {
            "bg-blue-600 hover:bg-blue-500": !highlight,
            "bg-pink-500 hover:bg-pink-400": highlight,
          }
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <MdLanguage className="mr-1 text-lg" />
        {isChinese ? '中文' : 'EN'}
      </button>
      
      <div
        className={classNames(
          "absolute top-full mt-2 right-0 z-30 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-75 overflow-hidden",
          {
            "opacity-0 pointer-events-none": !isOpen,
            "opacity-100": isOpen,
          }
        )}
      >
        <ul className="py-1 text-sm text-gray-700">
          <li>
            <button
              className={classNames(
                "w-full px-4 py-2 text-left hover:bg-gray-100",
                {
                  "font-bold bg-blue-50": currentLanguage === 'en',
                }
              )}
              onClick={() => changeLanguage('en')}
            >
              {t('language.en')}
            </button>
          </li>
          <li>
            <button
              className={classNames(
                "w-full px-4 py-2 text-left hover:bg-gray-100",
                {
                  "font-bold bg-blue-50": currentLanguage === 'zh',
                }
              )}
              onClick={() => changeLanguage('zh')}
            >
              {t('language.zh')}
            </button>
          </li>
        </ul>
      </div>
      
      {/* 点击外部关闭下拉框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default LanguageSwitcher; 