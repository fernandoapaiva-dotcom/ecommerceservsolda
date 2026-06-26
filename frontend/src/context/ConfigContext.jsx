import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/configs');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
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
        } catch (e) {
          console.error("Failed to parse or apply theme colors", e);
        }
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
