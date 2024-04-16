import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { Chip } from "app/components/ui/chip";
import { socket } from "app/utils/socket";
import axios from "axios";
import { router, useNavigation } from "expo-router";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import Toast from "react-native-toast-message";

const AwaitingChatView = () => {
  const navigation = useNavigation();
  // TODO: Add handle click function to get users to chat
  useEffect(() => {
    socket.on("inviteDecision", (inviteDecision: boolean) => {
      if (inviteDecision) {
        router.push("views/chat-views/chat-view");
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
      await axios.post("http://192.168.1.55:3000/user-availabilty-status", {
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
    <View>
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
          }}
        >
          Oczekiwanie na odpowiedź użytkownika
        </Text>
        <View style={{ marginTop: 40 }}>
          <Chip
            text={<Text style={{ color: "black" }}>Użytkownik</Text>}
            leftIcon={<Icon size={30} source="incognito" />}
            backgroundColor="#2196F3"
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
