import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { Chip } from "app/components/ui/chip";
import { axiosInstance } from "app/utils/axios-instance";
import { socket } from "app/utils/socket";
import { useTheme } from "app/utils/theme-provider";
import { handleUserAvailable } from "app/utils/toggle-user-available";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import Toast from "react-native-toast-message";

const ChatListView = () => {
  const navigation = useNavigation();
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);
  const theme = useTheme();
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

  const handleSearchChats = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await axiosInstance.post<
        { userId: string; userName: string }[] | null
      >("/get-users-to-chat", {
        userId: userId,
        oneChat: false,
      });
      if (response.data) {
        const userList = response.data.map((user) => ({
          id: user.userId,
          name: user.userName,
        }));
        setUserList(userList);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas szukania użytkowników do czatowania.",
      });
    }
  };
  useEffect(() => {
    handleSearchChats();
  }, []);

  useEffect(() => {
    socket.on("userUnavailable", (data: { message: string }) => {
      Toast.show({ type: "info", text1: data.message });
    });
    return () => {
      socket.off("userUnavailable");
    };
  }, []);

  const handleSendInvite = async (userId: string) => {
    const senderId = await AsyncStorage.getItem("userId");
    if (senderId) {
      socket.emit("sendInvite", {
        from: senderId,
        to: userId,
      });
      await handleUserAvailable(senderId, false);
      router.push({
        pathname: "views/chat-views/awaiting-chat-view",
        params: { invitedUser: userId },
      });
    }
  };

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
          Kliknij w jednego z użytkowników, aby wysłać prośbę o rozpoczęcie
          czatu
        </Text>
        <View style={{ marginTop: 40 }}>
          {userList.map((user) => (
            // TODO: add clicked user
            <View key={user.name + user.id} style={{ marginBottom: 15 }}>
              <Pressable
                onPress={() => {
                  handleSendInvite(user.id);
                }}
              >
                <Chip
                  text={<Text style={{ color: "white" }}>{user.name}</Text>}
                  leftIcon={<Icon size={30} source="incognito" />}
                  rightIcon={<Icon size={30} source="chat-question-outline" />}
                  backgroundColor={theme.appMainColor}
                />
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
export default ChatListView;
