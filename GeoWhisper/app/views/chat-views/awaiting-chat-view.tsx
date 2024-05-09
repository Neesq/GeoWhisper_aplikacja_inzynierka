import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { Chip } from "app/components/ui/chip";
import { axiosInstance } from "app/utils/axios-instance";
import { socket } from "app/utils/socket";
import { useTheme } from "app/utils/theme-provider";
import axios from "axios";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import Toast from "react-native-toast-message";

const AwaitingChatView = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const { invitedUser } = params;
  const [invitedUserName, setInvitedUserName] = useState<string>("");
  useEffect(() => {
    socket.on("inviteDecision", (inviteDecision: boolean) => {
      if (inviteDecision) {
        router.push({
          pathname: "views/chat-views/chat-view",
          params: { invitedUser },
        });
      } else {
        router.replace("views/main-view");
      }
    });
    return () => {
      socket.off("inviteDecision");
    };
  }, []);

  const handleUserAvailable = async () => {
    const userId = await AsyncStorage.getItem("userId");
    try {
      await axiosInstance.post("/user-availabilty-status", {
        userId: userId,
        available: false,
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Błąd zmiany statusu użytkownika" });
    }
  };

  useEffect(() => {
    handleUserAvailable();
  }, []);

  const getInvitedUserName = async () => {
    try {
      const response = await axiosInstance.get(`/get-user-name/${invitedUser}`);
      if (response.data && response.data.userName) {
        setInvitedUserName(response.data.userName);
      } else if (response.data && response.data.message) {
        Toast.show({
          type: "error",
          text1: "Nie znaleziono nazwy zaproszonego użytkownika.",
        });
      }
    } catch (error) {}
  };

  useEffect(() => {
    getInvitedUserName();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.appMainColor,
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
  }, [navigation, theme]);

  return (
    <View
      style={{
        backgroundColor:
          theme.appTheme === "light"
            ? theme.themeLightColor
            : theme.themeDarkColor,
        height: "100%",
      }}
    >
      <View
        style={{
          width: "90%",
          marginTop: 40,
          marginBottom: 40,
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
            color:
              theme.appTheme === "light"
                ? theme.themeDarkColor
                : theme.themeLightColor,
          }}
        >
          Oczekiwanie na odpowiedź użytkownika
        </Text>
        <View style={{ marginTop: 40 }}>
          <Chip
            text={<Text style={{ color: "black" }}>{invitedUserName}</Text>}
            leftIcon={<Icon size={30} source="incognito" />}
            backgroundColor={theme.appMainColor}
          />
        </View>
        <View
          style={{
            display: "flex",
            width: 250,
            height: 250,
            marginRight: "auto",
            marginLeft: "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Icon size={170} color="gray" source="incognito" />
        </View>
      </View>
    </View>
  );
};
export default AwaitingChatView;
