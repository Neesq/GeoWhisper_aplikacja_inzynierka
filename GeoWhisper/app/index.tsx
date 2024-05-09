import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import * as Location from "expo-location";
import { FC, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { axiosInstance } from "./utils/axios-instance";
import { useTheme } from "./utils/theme-provider";
import { View, Text } from "react-native";
import Toast from "react-native-toast-message";
import { KeepLoggedIn } from "./utils/keep-logged-in-enum";

const HomePage: FC = () => {
  const theme = useTheme();
  const [localizationPermissions, setLocalizationPermissions] = useState<
    "granted" | "notGranted" | "checking"
  >("checking");
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status !== "granted") {
        const { granted } = await Location.requestBackgroundPermissionsAsync();
        if (granted) {
          setLocalizationPermissions("granted");
        } else {
          setLocalizationPermissions("notGranted");
        }
      } else {
        setLocalizationPermissions("granted");
      }
    })();
  }, [localizationPermissions]);

  const checkUserKeepLoggedIn = async () => {
    try {
      const loggedIn = await AsyncStorage.getItem("keepLoggedIn");
      if (loggedIn !== null) {
        setKeepLoggedIn(loggedIn === KeepLoggedIn.True ? true : false);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas pobierania danych z lokalnego magazynu.",
      });
    }
  };
  useEffect(() => {
    if (keepLoggedIn === null) {
      checkUserKeepLoggedIn();
    }
  }, [keepLoggedIn]);

  if (localizationPermissions === "checking") {
    return (
      <View
        style={{
          display: "flex",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }
  //TODO: Add view informing user to grant localization permissions for the app
  if (localizationPermissions === "notGranted")
    return (
      <View>
        <Text>Włącz lokalizację </Text>
      </View>
    );

  if (keepLoggedIn) {
    return <Redirect href="views/main-view" />;
  }

  return <Redirect href="views/login-register-view/login-view" />;
};
export default HomePage;
