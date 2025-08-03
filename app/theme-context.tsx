import React from "react";

export const ThemeContext = React.createContext({
  theme: "light",
  toggleTheme: () => {},
});

// Default export for Metro bundler
export default ThemeContext; 