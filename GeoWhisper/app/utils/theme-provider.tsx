import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { io } from "socket.io-client";

type ThemeContextType = {
  themeLightColor: string;
  themeDarkColor: string;
  appTheme: string;
  appMainColor: string;
};

// Create a context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeContextType>({
    themeLightColor: "#f2f2f2",
    themeDarkColor: "#282828",
    appTheme: "light",
    appMainColor: "rgb(33, 150, 243)",
  });
  //   TODO: Add fetching theme data from database
  //   useEffect(() => {
  //     const fetchThemeFromDatabase = async () => {
  //       try {
  //         const themeData = await fetchTheme(); // Function to fetch theme from database
  //         setTheme(themeData);
  //       } catch (error) {
  //         console.error("Error fetching theme from database:", error);
  //       }
  //     };

  //     fetchThemeFromDatabase();
  //   }, []);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
