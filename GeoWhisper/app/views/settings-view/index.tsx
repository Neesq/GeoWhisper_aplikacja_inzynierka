import { AppHeaderTitle } from "app/components/ui/app-header-title";
import axios from "axios";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Divider, Icon, Text } from "react-native-paper";
import { TextSliderValue } from "./components/text-slider-value";
import { TwoRadioOptions } from "./components/two-radio-buttons";

const SettingsView = () => {
  // TODO: Add handle click function to get users to chat
  const navigation = useNavigation();
  const [usersInUsersList, setUsersInUsersList] = useState(5);
  const [searchRadius, setSearchRadius] = useState(50);
  const [red, setRed] = useState(0);
  const [green, setGreen] = useState(0);
  const [blue, setBlue] = useState(0);
  const [languagePref, setLanguagePref] = useState<{
    polish: boolean;
    english: boolean;
  }>({ polish: true, english: false });
  const [theme, setTheme] = useState<{
    light: boolean;
    dark: boolean;
  }>({ light: true, dark: false });

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTitle: () => <AppHeaderTitle />,
      headerLeft: () => (
        <Pressable onPress={() => router.back()}>
          <Icon color="white" source="arrow-left" size={25} />
        </Pressable>
      ),
      headerTitleAlign: "center",
      headerBackVisible: false,
    });
  }, [navigation]);

  return (
    <ScrollView>
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
          }}
        >
          Ustawienia konta
        </Text>
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 15,
              color: "gray",
              textAlign: "center",
            }}
          >
            Ustawienia wyszukiwania czatu
          </Text>
          <TextSliderValue
            settingName="Ilość czatów w liście"
            sliderColor="#2196F3"
            sliderMinVal={5}
            sliderMaxVal={20}
            sliderStep={5}
            sliderValue={usersInUsersList}
            sliderValueChange={setUsersInUsersList}
          />
          <TextSliderValue
            settingName="Obręb szukania czatów (metry)"
            sliderColor="#2196F3"
            sliderMinVal={50}
            sliderMaxVal={500}
            sliderStep={50}
            sliderValue={searchRadius}
            sliderValueChange={setSearchRadius}
          />
          <Divider />
          <TwoRadioOptions
            settingHeaderText="Preferencje językowe czatu"
            radioOptions={languagePref}
            setRadioOptions={setLanguagePref}
            option1Text="Polski"
            option2Text="Angielski"
          />
          <Divider />
          <TwoRadioOptions
            settingHeaderText="Motyw aplikacji"
            radioOptions={theme}
            setRadioOptions={setTheme}
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
            sliderValue={red}
            sliderValueChange={setRed}
          />
          <TextSliderValue
            settingName="Zielony"
            sliderColor="green"
            sliderMinVal={0}
            sliderMaxVal={255}
            sliderStep={1}
            sliderValue={green}
            sliderValueChange={setGreen}
          />
          <TextSliderValue
            settingName="Niebieski"
            sliderColor="blue"
            sliderMinVal={0}
            sliderMaxVal={255}
            sliderStep={1}
            sliderValue={blue}
            sliderValueChange={setBlue}
          />
          <View style={{ width: "40%", alignSelf: "center", marginTop: 10 }}>
            {/* TODO: Add function to handle saving settings */}
            <Button
              onPress={async () => {
                try {
                  await axios.post("http://192.168.1.55:3000/witam");
                } catch (eror) {
                  console.log(eror);
                }
              }}
              mode="contained"
              style={{ backgroundColor: "#2196F3" }}
            >
              Zapisz
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
export default SettingsView;
