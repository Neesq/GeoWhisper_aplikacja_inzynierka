import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import { FC, useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import { ActivityIndicator, Button, Icon } from "react-native-paper";
import Toast from "react-native-toast-message";
import { AppHeaderTitle } from "./components/ui/app-header-title";
import { KeepLoggedIn } from "./utils/keep-logged-in-enum";

const HomePage: FC = () => {
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
        <ActivityIndicator testID="loading-indicator" size="large" />
      </View>
    );
  }
  if (localizationPermissions === "notGranted")
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          paddingTop: 50,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <AppHeaderTitle color="rgb(33, 150, 243)" />
        <View style={{ width: "80%", marginTop: 200 }}>
          <Text style={{ fontWeight: "bold", textAlign: "center" }}>
            Muszą zostać nadane uprawnienia do lokalizacji dla aplikacji
            GeoWhisper, w przeciwnym razie aplikacja nie będzie działać
          </Text>
        </View>
        <View style={{ width: "80%", justifyContent: "center" }}>
          <Text>
            Nadaj uprawnienia do lokalizacji zaznaczając te dwie opcje:
          </Text>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon source="checkbox-blank-circle" size={10} />
            <Text>Zezwalaj zawszę</Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon source="checkbox-blank-circle" size={10} />
            <Text>Użyj dokładnej lokalizacji</Text>
          </View>
        </View>
        <Button
          mode="contained"
          buttonColor="rgb(33, 150, 243)"
          onPress={() => Linking.openSettings()}
        >
          Przejdź do ustawień
        </Button>
      </View>
    );

  if (keepLoggedIn) {
    return <Redirect href="views/main-view" />;
  }

  return <Redirect href="views/login-register-view/login-view" />;
};
export default HomePage;
