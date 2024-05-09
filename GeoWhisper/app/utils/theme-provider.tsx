import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { axiosInstance } from "./axios-instance";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeContextType = {
  themeLightColor: string;
  themeDarkColor: string;
  themeModalDarkColor: string;
  appTheme: string;
  appMainColor: string;
  themeLoaded: boolean;
  updateTheme: (theme: Partial<ThemeContextType>) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeContextType>({
    themeLightColor: "#f2f2f2",
    themeDarkColor: "#282828",
    themeModalDarkColor: "#cccccc",
    appTheme: "light",
    appMainColor: "rgb(33, 150, 243)",
    themeLoaded: false,
    updateTheme: (updatedTheme: Partial<ThemeContextType>) =>
      setTheme((prevTheme) => ({ ...prevTheme, ...updatedTheme })),
  });
  useEffect(() => {
    const fetchThemeFromDatabase = async () => {
      const userId = await AsyncStorage.getItem("userId");
      try {
        if (userId) {
          const themeData = await axiosInstance.post("/user-settings-fetch", {
            userId: userId,
          });
          if (themeData.data) {
            theme.updateTheme({
              appTheme: themeData.data.appTheme,
              appMainColor: themeData.data.appMainColor,
            });
          }
        }
      } catch (error) {
        console.error("Błąd pobierania motywu z bazy danych:", error);
      }
    };

    fetchThemeFromDatabase();
  }, []);

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
