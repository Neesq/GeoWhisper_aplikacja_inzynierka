import AsyncStorage from "@react-native-async-storage/async-storage";
import ConfirmExitSettingsDialog from "app/components/dialog-components/confirm-exit-settings-modal";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { areObjectsEqual } from "app/utils/are-objects-equal";
import { axiosInstance } from "app/utils/axios-instance";
import { KeepLoggedIn } from "app/utils/keep-logged-in-enum";
import { useTheme } from "app/utils/theme-provider";
import { handleUserAvailable } from "app/utils/toggle-user-available";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Divider, Icon, Switch, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import { TextSliderValue } from "./components/text-slider-value";
import { TwoRadioOptions } from "./components/two-radio-buttons";

interface SettingsObjectsType {
  usersInUsersList: number;
  searchRadius: number;
  red: number;
  green: number;
  blue: number;
  languagePref: {
    polish: boolean;
    english: boolean;
  };
  theme: {
    light: boolean;
    dark: boolean;
  };
}

let preSaveSettings: SettingsObjectsType = {
  usersInUsersList: 5,
  searchRadius: 50,
  red: 0,
  green: 0,
  blue: 0,
  languagePref: {
    polish: true,
    english: false,
  },
  theme: {
    light: true,
    dark: false,
  },
};
let currentSettings: SettingsObjectsType = {
  usersInUsersList: 5,
  searchRadius: 50,
  red: 0,
  green: 0,
  blue: 0,
  languagePref: {
    polish: true,
    english: false,
  },
  theme: {
    light: true,
    dark: false,
  },
};

const SettingsView = () => {
  const {
    updateTheme,
    appMainColor,
    appTheme,
    themeDarkColor,
    themeLightColor,
  } = useTheme();
  const regex = /(\d+),\s*(\d+),\s*(\d+)/;
  const matches = appMainColor.match(regex);
  const navigation = useNavigation();
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [settings, setSettings] = useState<SettingsObjectsType>({
    usersInUsersList: 5,
    searchRadius: 50,
    red: matches ? Number(matches[1]) : 0,
    green: matches ? Number(matches[2]) : 0,
    blue: matches ? Number(matches[3]) : 0,
    languagePref: { polish: true, english: false },
    theme:
      appTheme === "light"
        ? { light: true, dark: false }
        : { light: false, dark: true },
  });
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  const openConfirmationModal = () => {
    setConfirmationModal(true);
  };
  const closeConfirmationModal = () => {
    setConfirmationModal(false);
  };

  const toggleTheme = () => {
    updateTheme({ appTheme: settings.theme.light ? "light" : "dark" });
  };
  const updateMianAppColor = () => {
    updateTheme({
      appMainColor: `rgb(${settings.red}, ${settings.green}, ${settings.blue})`,
    });
  };

  useEffect(() => {
    currentSettings = { ...settings };
  }, [settings]);

  const fetchUserSettings = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await axiosInstance.post("/user-settings-fetch", {
        userId,
      });
      if (response.data) {
        const regex = /(\d+),\s*(\d+),\s*(\d+)/;
        const matches = response.data.appMainColor.match(regex);
        setSettings({
          searchRadius: response.data.searchRadius,
          usersInUsersList: response.data.numberOfChats,
          theme: {
            light: response.data.appTheme === "light",
            dark: response.data.appTheme !== "light",
          },
          languagePref: {
            polish: response.data.languagePrefference === "PL",
            english: response.data.languagePrefference !== "PL",
          },
          red: Number(matches[1]),
          green: Number(matches[2]),
          blue: Number(matches[3]),
        });
        preSaveSettings = {
          searchRadius: response.data.searchRadius,
          usersInUsersList: response.data.numberOfChats,
          theme: {
            light: response.data.appTheme === "light",
            dark: response.data.appTheme !== "light",
          },
          languagePref: {
            polish: response.data.languagePrefference === "PL",
            english: response.data.languagePrefference !== "PL",
          },
          red: Number(matches[1]),
          green: Number(matches[2]),
          blue: Number(matches[3]),
        };
        const loggedIn = await AsyncStorage.getItem("keepLoggedIn");
        if (loggedIn !== null) {
          setIsSwitchOn(loggedIn === KeepLoggedIn.True ? true : false);
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas pobierania ustawień.",
      });
    }
  };
  useEffect(() => {
    fetchUserSettings();
  }, []);

  useEffect(() => {
    updateMianAppColor();
  }, [settings.red, settings.blue, settings.green]);
  useEffect(() => {
    toggleTheme();
  }, [settings.theme]);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: appMainColor,
      },
      headerTitle: () => <AppHeaderTitle />,
      headerLeft: () => (
        <Pressable onPress={handleBack} disabled={confirmationModal}>
          <Icon color="white" source="arrow-left" size={25} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => router.push("views/settings-view/blocked-users")}
        >
          <Icon color="white" source="account-cancel" size={25} />
        </Pressable>
      ),
      headerTitleAlign: "center",
      headerBackVisible: false,
    });
  }, [navigation, appMainColor, confirmationModal]);

  const handleBack = async () => {
    const settingsDidntChange = areObjectsEqual<SettingsObjectsType>(
      preSaveSettings,
      currentSettings
    );
    if (settingsDidntChange) {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) await handleUserAvailable(userId, true);
      router.back();
    } else {
      openConfirmationModal();
    }
  };
  const handleConfirmExitSettings = () => {
    updateTheme({
      appMainColor: `rgb(${preSaveSettings.red}, ${preSaveSettings.green}, ${preSaveSettings.blue})`,
      appTheme: preSaveSettings.theme.light ? "light" : "dark",
    });
    closeConfirmationModal();
    router.back();
  };
  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const appMainColor = `rgb(${settings.red}, ${settings.green}, ${settings.blue})`;
      await AsyncStorage.setItem(
        "keepLoggedIn",
        isSwitchOn ? KeepLoggedIn.True : KeepLoggedIn.False
      );
      const data = {
        userId: userId,
        searchRadius: settings.searchRadius,
        numberOfChats: settings.usersInUsersList,
        languagePrefference: settings.languagePref.polish ? "PL" : "EN",
        appTheme: settings.theme.light ? "light" : "dark",
        appMainColor: appMainColor,
      };
      preSaveSettings = currentSettings;
      const response = await axiosInstance.post("/user-settings-save", data);
      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Pomyślnie zapisano ustawienia.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Coś poszło nie tak nie zapisano ustawień.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas zapisywania ustawień.",
      });
    }
  };
  const handleLogOut = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      await AsyncStorage.setItem("keepLoggedIn", KeepLoggedIn.False);
      await axiosInstance.get(`/logout/${userId}`);
      router.replace("views/login-register-view/login-view");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas wylogowywania.",
      });
    }
  };

  return (
    <>
      <ScrollView
        style={{
          backgroundColor:
            appTheme === "light" ? themeLightColor : themeDarkColor,
        }}
      >
        <View
          style={{
            width: "90%",
            marginTop: 20,
            marginBottom: 20,
            marginRight: "auto",
            marginLeft: "auto",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              textShadowColor: "rgba(0, 0, 0, 0.5)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
              textAlign: "center",
              color: appTheme === "light" ? themeDarkColor : themeLightColor,
            }}
          >
            Ustawienia konta
          </Text>
          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                fontSize: 15,
                color: appTheme === "light" ? "gray" : themeLightColor,
                textAlign: "center",
              }}
            >
              Ustawienia wyszukiwania czatu
            </Text>
            <TextSliderValue
              settingName="Ilość czatów w liście"
              sliderColor={appMainColor}
              sliderMinVal={5}
              sliderMaxVal={20}
              sliderStep={5}
              sliderValue={settings.usersInUsersList}
              sliderValueChange={(value: number) => {
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  usersInUsersList: value,
                }));
              }}
            />
            <TextSliderValue
              settingName="Obręb szukania czatów (metry)"
              sliderColor={appMainColor}
              sliderMinVal={50}
              sliderMaxVal={500}
              sliderStep={50}
              sliderValue={settings.searchRadius}
              sliderValueChange={(value: number) => {
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  searchRadius: value,
                }));
              }}
            />
            <Divider />
            <TwoRadioOptions
              settingHeaderText="Preferencje językowe czatu"
              radioOptions={settings.languagePref}
              setRadioOptions={(value: {
                polish: boolean;
                english: boolean;
              }) => {
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  languagePref: value,
                }));
              }}
              option1Text="Polski"
              option2Text="Angielski"
            />
            <Divider />
            <TwoRadioOptions
              settingHeaderText="Motyw aplikacji"
              radioOptions={settings.theme}
              setRadioOptions={(value: { light: boolean; dark: boolean }) => {
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  theme: value,
                }));
              }}
              option1Text="Jasny"
              option2Text="Ciemny"
            />
            <Divider />
            <TextSliderValue
              settingName="Czerwony"
              sliderColor="red"
              sliderMinVal={0}
              sliderMaxVal={255}
              sliderStep={1}
              sliderValue={settings.red}
              sliderValueChange={(value: number) => {
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  red: value,
                }));
              }}
            />
            <TextSliderValue
              settingName="Zielony"
              sliderColor="green"
              sliderMinVal={0}
              sliderMaxVal={255}
              sliderStep={1}
              sliderValue={settings.green}
              sliderValueChange={(value: number) => {
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  green: value,
                }));
              }}
            />
            <TextSliderValue
              settingName="Niebieski"
              sliderColor="blue"
              sliderMinVal={0}
              sliderMaxVal={255}
              sliderStep={1}
              sliderValue={settings.blue}
              sliderValueChange={(value: number) => {
                setSettings((prevSettings) => ({
                  ...prevSettings,
                  blue: value,
                }));
              }}
            />
            <Divider />
            <View style={{ marginTop: 10 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: appTheme === "light" ? "gray" : themeLightColor,
                  textAlign: "center",
                }}
              >
                Logowanie i wylogowywanie z aplikacji
              </Text>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color:
                      appTheme === "light" ? themeDarkColor : themeLightColor,
                  }}
                >
                  Zostań zalogowany w aplikacji
                </Text>
                <Switch
                  value={isSwitchOn}
                  onValueChange={onToggleSwitch}
                  color={appMainColor}
                />
              </View>
              <View
                style={{
                  width: "40%",
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              >
                <Button
                  onPress={handleLogOut}
                  mode="outlined"
                  textColor={appMainColor}
                  style={{ borderColor: appMainColor }}
                >
                  Wyloguj się
                </Button>
              </View>
            </View>
            <Divider />
            <View
              style={{
                width: "60%",
                alignSelf: "center",
                marginTop: 10,
              }}
            >
              {/* TODO: Add function to handle saving settings */}
              <Button
                onPress={handleSave}
                mode="contained"
                style={{ backgroundColor: appMainColor }}
              >
                Zapisz ustawienia
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
      {confirmationModal && (
        <ConfirmExitSettingsDialog
          handleConfirm={handleConfirmExitSettings}
          message="Ustawienia nie zostały zapisane. Czy na pewno chcesz opuścić widok?"
          onClose={closeConfirmationModal}
          open={confirmationModal}
        />
      )}
    </>
  );
};
export default SettingsView;
