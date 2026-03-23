import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'vi';

interface Preferences {
  theme: Theme;
  language: Language;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    settings: 'Settings',
    login: 'Login',
    organization: 'Organization',
    flow_logic: 'Flow Logic',
    integration: 'Integration',
    analytics: 'Analytics',
    meta_utils: 'Meta & Utils',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    language: 'Language',
    save_project: 'Save Project',
    load_project: 'Load Project',
    app_settings: 'Application Settings',
    theme_desc: 'Choose your preferred visual appearance.',
    lang_desc: 'Select the language for the application interface.',
    function: 'FUNCTION',
    example: 'EXAMPLE',
    no_node_selected: 'No node selected',
    node_select_desc: 'Click on a node in the canvas to edit its properties.'
  },
  vi: {
    home: 'Trang chủ',
    settings: 'Cài đặt',
    login: 'Đăng nhập',
    organization: 'Tổ chức',
    flow_logic: 'Luồng Logic',
    integration: 'Tích hợp (API/DB)',
    analytics: 'Phân tích',
    meta_utils: 'Tiện ích & Meta',
    dark_mode: 'Chế độ Tối',
    light_mode: 'Chế độ Sáng',
    language: 'Ngôn ngữ',
    save_project: 'Lưu Dự Án',
    load_project: 'Mở Dự Án',
    app_settings: 'Cài đặt hệ thống',
    theme_desc: 'Tuỳ chỉnh giao diện sáng hoặc tối cho ứng dụng.',
    lang_desc: 'Lựa chọn ngôn ngữ hiển thị cho toàn bộ phần mềm.',
    function: 'CHỨC NĂNG',
    example: 'VÍ DỤ',
    no_node_selected: 'Chưa chọn Node',
    node_select_desc: 'Bấm vào một block trên khung vẽ để chỉnh sửa thuộc tính của nó.'
  }
};

export const PreferencesContext = createContext<Preferences>({
  theme: 'dark',
  language: 'vi',
  setTheme: () => {},
  setLanguage: () => {},
  t: (key) => key
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('vi');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <PreferencesContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
