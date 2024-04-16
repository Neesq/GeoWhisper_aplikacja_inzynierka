import AsyncStorage from "@react-native-async-storage/async-storage";
import ConfirmDialog from "app/components/dialog-components/confirm-dialog";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { socket } from "app/utils/socket";
import axios from "axios";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Icon, IconButton } from "react-native-paper";
import Toast from "react-native-toast-message";
import { ChatBaloon } from "./components/chat-baloon";

const ChatView: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [stillInRange, setStillInRange] = useState(true);
  const [endChat, setEndChat] = useState(false);
  const [messages, setMessages] = useState<
    { from: string; to: string; message: string }[]
  >([]);
  const [userIds, setUserIds] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [userNameOfChatter, setUserNameOfChatter] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const openConfirmDialog = () => {
    Keyboard.dismiss();
    setConfirmDialog(true);
  };
  const closeConfirmDialog = () => {
    setConfirmDialog(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTitle: () => <AppHeaderTitle />,
      headerLeft: () => (
        <Pressable onPress={openConfirmDialog}>
          <Icon color="white" source="arrow-left" size={25} />
        </Pressable>
      ),
      headerTitleAlign: "center",
      headerBackVisible: false,
    });
  }, [navigation]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const setUserIdsInChat = async () => {
    const userId = await AsyncStorage.getItem("userId");
    const chattingWithUser = await AsyncStorage.getItem("invitedUserId");
    setUserIds({ from: userId!, to: chattingWithUser! });
    const response = await axios.get(
      `https://geowhisper-aplikacja-inzynierka.onrender.com/get-user-name/${chattingWithUser}`
    );
    if (response.data.userName) {
      setUserNameOfChatter(response.data.userName);
    }
  };
  useEffect(() => {
    setUserIdsInChat();
  }, []);

  const handleSendMessage = () => {
    if (inputText.trim() !== "") {
      setInputText("");
      const messageData = {
        from: userIds.from,
        to: userIds.to,
        message: inputText,
      };
      socket.emit("message", messageData);
    }
  };
  useEffect(() => {
    socket.on(
      "messageReceived",
      (messageData: { from: string; to: string; message: string }) => {
        setMessages((prevMessages) => [...prevMessages, messageData]);
      }
    );
    return () => {
      socket.off("messageReceived");
    };
  }, []);
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    socket.on("chatEnded", async (chatEnded: boolean) => {
      await AsyncStorage.removeItem("invitedUserId");
      socket.emit("stopRangeCheck");
      Toast.show({
        type: "info",
        text1: "Chat zakończył się zaraz zostaniesz przeniesiony.",
        visibilityTime: 1000,
      });
      intervalId = setInterval(() => {
        router.replace("views/main-view");
      }, 2000);
    });
    return () => {
      clearInterval(intervalId);
      socket.off("chatEnded");
    };
  }, []);
  const handleEndChat = () => {
    socket.emit("endChat", userIds.to);
    socket.emit("stopRangeCheck");
    closeConfirmDialog();
    router.replace("views/main-view");
  };

  useEffect(() => {
    if (userIds.from && userIds.to)
      socket.emit("startRangeCheck", {
        userId: userIds.from,
        userIdToCheck: userIds.to,
      });
  }, [userIds.from, userIds.to]);

  useEffect(() => {
    const handleUserInRange = () => {
      setStillInRange(true);
      if (endChat) {
        setEndChat(false);
        Toast.show({
          type: "info",
          text1: "Użytkownik wrócił, czat będzie kontynuowany.",
        });
      }
    };

    const handleUserOutOfRange = () => {
      setStillInRange(false);
      if (!endChat) {
        const timeoutId = setTimeout(() => {
          setEndChat(true);
          Toast.show({
            type: "info",
            text1:
              "Użytkownik poza zasięgiem. Jeżeli nie powróci, zostaniecie przeniesieni.",
            visibilityTime: 4000,
          });
          setTimeout(() => {
            socket.emit("stopRangeCheck");
            router.push("views/main-view");
          }, 5000);
        }, 5000);
        return () => clearTimeout(timeoutId);
      }
    };

    if (socket) {
      socket.on("userInRange", handleUserInRange);
      socket.on("userOutOfRange", handleUserOutOfRange);
    }

    return () => {
      if (socket) {
        socket.off("userInRange", handleUserInRange);
        socket.off("userOutOfRange", handleUserOutOfRange);
      }
    };
  }, [socket, endChat]);

  return (
    <>
      <View style={styles.container}>
        <View
          style={{
            width: "80%",
            alignSelf: "center",
            padding: 5,
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 50,
              backgroundColor: "white",
              borderRadius: 50,
              padding: 10,
            }}
          >
            <View style={{ flex: 4, alignItems: "center" }}>
              <Text>{userNameOfChatter}</Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item, index }) => (
            <ChatBaloon
              message={item.message}
              from={item.from !== userIds.from}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          style={styles.flatList}
          contentContainerStyle={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.inputContainer}
          enabled={!confirmDialog}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Napisz wiadomość ..."
            style={styles.input}
          />
          <IconButton
            icon="send"
            iconColor="#2196F3"
            onPress={handleSendMessage}
          />
        </KeyboardAvoidingView>
      </View>
      {confirmDialog && (
        <ConfirmDialog
          handleConfirm={handleEndChat}
          onClose={closeConfirmDialog}
          message="Czy na pewno chcesz zakończyć rozmowę? Nie będzie można do niej wrócić."
          open={confirmDialog}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "gray",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2196F3",
    padding: 5,
    paddingLeft: 10,
    borderRadius: 20,
  },
});

export default ChatView;
