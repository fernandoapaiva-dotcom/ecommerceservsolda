import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

// Executa imediatamente ao importar o módulo para evitar qualquer "flash" visual
const savedColors = localStorage.getItem('themeColors');
if (savedColors) {
  try {
    const colors = JSON.parse(savedColors);
    Object.keys(colors).forEach(key => {
      document.documentElement.style.setProperty(`--color-${key}`, colors[key]);
    });
  } catch (e) {
    console.error("Failed to parse cached colors", e);
  }
}

const savedFavicon = localStorage.getItem('themeFavicon');
if (savedFavicon) {
  try {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = savedFavicon;
  } catch (e) {
    console.error("Failed to apply cached favicon", e);
  }
}
const API_URL = 'http://127.0.0.1:5000';

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/configs`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.themeColors) {
          const colors = typeof data.themeColors === 'string' ? JSON.parse(data.themeColors) : data.themeColors;
          localStorage.setItem('themeColors', JSON.stringify(colors));
        }
        if (data.favicon) {
          const faviconUrl = `${API_URL}${data.favicon}`;
          localStorage.setItem('themeFavicon', faviconUrl);
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        }
      }
    } catch (error) {
      console.error('Error fetching global configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const applyThemeColors = () => {
      if (config && config.themeColors) {
        try {
          const colors = typeof config.themeColors === 'string' ? JSON.parse(config.themeColors) : config.themeColors;
          Object.keys(colors).forEach(key => {
            document.documentElement.style.setProperty(`--color-${key}`, colors[key]);
          });
          localStorage.setItem('themeColors', JSON.stringify(colors));
        } catch (e) {
          console.error("Failed to parse or apply theme colors", e);
        }
      }
      if (config?.favicon) {
        const faviconUrl = `${API_URL}${config.favicon}`;
        localStorage.setItem('themeFavicon', faviconUrl);
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = faviconUrl;
      }
    };
    applyThemeColors();
  }, [config]);

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
