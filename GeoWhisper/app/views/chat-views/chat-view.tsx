import AsyncStorage from "@react-native-async-storage/async-storage";
import ConfirmDialog from "app/components/dialog-components/confirm-dialog";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { socket } from "app/utils/socket";
import axios from "axios";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
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
import { ActivityIndicator, Icon, IconButton } from "react-native-paper";
import Toast from "react-native-toast-message";
import { ChatBaloon } from "./components/chat-baloon";
import { axiosInstance } from "app/utils/axios-instance";
import { useTheme } from "app/utils/theme-provider";
import { CheckIfInRange } from "./components/check-if-in-range";

let disconnectTimerId: NodeJS.Timeout | null = null;
let rangeCheckIntervalId: NodeJS.Timeout | null = null;
let toasterShowed = false;

const ChatView: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(false);

  const params = useLocalSearchParams();
  const { invitedUser } = params;

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
  const theme = useTheme();
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
        backgroundColor: theme.appMainColor,
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
  }, [navigation, theme]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const setUserIdsInChat = async () => {
    const userId = await AsyncStorage.getItem("userId");
    const response = await axiosInstance.get(`/get-user-name/${invitedUser}`);
    if (response.data.userName) {
      setUserNameOfChatter(response.data.userName);
    }
    setUserIds({ from: userId!, to: String(invitedUser)! });
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
    socket.on("chatEnded", async (chatEnded: boolean) => {
      if (rangeCheckIntervalId) {
        clearInterval(rangeCheckIntervalId);
      }
      if (disconnectTimerId) {
        clearTimeout(disconnectTimerId);
      }
      Toast.show({
        type: "info",
        text1: "Chat zakończył się zaraz zostaniesz przeniesiony.",
        visibilityTime: 2000,
      });
      setTimeout(() => {
        router.replace("views/main-view");
      }, 2000);
    });
    return () => {
      socket.off("chatEnded");
    };
  }, []);
  const handleEndChat = () => {
    if (rangeCheckIntervalId) {
      clearInterval(rangeCheckIntervalId);
    }
    if (disconnectTimerId) {
      clearTimeout(disconnectTimerId);
    }
    socket.emit("endChat", userIds.to);
    closeConfirmDialog();
    router.replace("views/main-view");
  };

  if (!userIds.to || !userIds.from) return <ActivityIndicator />;

  return (
    <>
      <CheckIfInRange
        userIds={userIds}
        disconnectTimerId={disconnectTimerId}
        rangeCheckIntervalId={rangeCheckIntervalId}
        toasterShowed={toasterShowed}
      />
      <View
        style={{
          ...styles.container,
          backgroundColor:
            theme.appTheme === "light"
              ? theme.themeLightColor
              : theme.themeDarkColor,
          height: "100%",
        }}
      >
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
              borderRadius: 50,
              padding: 10,
              backgroundColor: theme.appTheme === "dark" ? "#88898a" : "white",
            }}
          >
            <View
              style={{
                flex: 4,
                alignItems: "center",
              }}
            >
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
          enabled={!confirmDialog || toasterShowed}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Napisz wiadomość ..."
            placeholderTextColor={
              theme.appTheme === "light"
                ? theme.themeDarkColor
                : theme.themeLightColor
            }
            style={{
              ...styles.input,
              borderColor: theme.appMainColor,
              color:
                theme.appTheme === "light"
                  ? theme.themeDarkColor
                  : theme.themeLightColor,
            }}
          />
          <IconButton
            icon="send"
            disabled={toasterShowed}
            iconColor={theme.appMainColor}
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
