import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { IncognitoIcon } from "app/components/ui/incognito-icon";
import { generateUserName } from "app/utils/generate-user-name";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Icon, RadioButton, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import UserNameDialog from "./components/user-name-dialog";
import { socket } from "app/utils/socket";
import ConfirmChatDialog from "app/components/dialog-components/confirm-chat-dialog";

const MainView = () => {
  const [numberOfChats, setNumberOfChats] = useState<{
    single: boolean;
    multiple: boolean;
  }>({ single: true, multiple: false });
  const navigation = useNavigation();
  const [userMapped, setUserMapped] = useState(false);
  const [profileModalOpen, setIsProfileModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitationFromUser, setInvitationFromUser] = useState<string | null>(
    null
  );
  const [userName, setUserName] = useState("");
  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };
  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };
  const openInviteModal = () => {
    setInviteModalOpen(true);
  };
  const closeInviteModal = () => {
    setInviteModalOpen(false);
  };

  const mapUser = async () => {
    if (!userMapped) {
      const userId = await AsyncStorage.getItem("userId");
      socket.emit("mapUserId", userId);
      setUserMapped(true);
    }
  };
  useEffect(() => {
    mapUser();
  }, [userMapped]);

  const handleUserAvailable = async () => {
    const userId = await AsyncStorage.getItem("userId");
    try {
      await axios.post(
        "https://geowhisper-aplikacja-inzynierka.onrender.com/user-availabilty-status",
        {
          userId: userId,
          available: true,
        }
      );
      return;
    } catch (error) {
      console.log(error);
      Toast.show({ type: "error", text1: "Błąd zmiany statusu użytkownika" });
    }
  };

  useEffect(() => {
    handleUserAvailable();
  }, [handleUserAvailable]);

  socket.on("invitationRecieved", (invitationRecieved: string) => {
    setInvitationFromUser(invitationRecieved);
    openInviteModal();
  });

  const acceptDenyInvitation = (accept: boolean) => {
    socket.emit("acceptDenyInvitation", {
      to: invitationFromUser,
      accepted: accept,
    });
    closeInviteModal();
    if (accept) {
      router.push("views/chat-views/chat-view");
    }
  };

  const handleChangeUserName = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const newUserName = generateUserName();
      const response = await axios.post(
        "https://geowhisper-aplikacja-inzynierka.onrender.com/change-user-name",
        {
          userId: userId,
          userName: newUserName,
        }
      );

      if (!response.data.message) {
        setUserName(newUserName);
      } else {
        Toast.show({ type: "error", text1: response.data.message });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Błąd zmiany nazwy użytkownika" });
    }
  };

  useEffect(() => {
    const getUserName = async () => {
      const userId = await AsyncStorage.getItem("userId");
      const userName = await axios.get(
        `https://geowhisper-aplikacja-inzynierka.onrender.com/get-user-name/${userId}`
      );

      if (userName.data.userName) {
        setUserName(userName.data.userName);
      } else if (userName.data.message) {
        Toast.show({ type: "error", text1: userName.data.message });
      }
    };
    if (!userName) {
      getUserName();
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTitle: () => <AppHeaderTitle />,
      headerLeft: () => (
        <Pressable
          onPress={() => router.push("views/settings-view")}
          disabled={profileModalOpen}
        >
          <Icon color="white" source="cog" size={25} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={openProfileModal} disabled={profileModalOpen}>
          <Icon color="white" source="account" size={25}></Icon>
        </Pressable>
      ),
      headerTitleAlign: "center",
      headerBackVisible: false,
    });
  }, [navigation, profileModalOpen]);

  const handleSearchChats = async () => {
    try {
      if (numberOfChats.single) {
        const userId = await AsyncStorage.getItem("userId");
        const response = await axios.post<
          { userId: string; userName: string }[] | null
        >(
          "https://geowhisper-aplikacja-inzynierka.onrender.com/get-users-to-chat",
          {
            userId: userId,
            oneChat: numberOfChats.single,
          }
        );

        if (response.data?.length) {
          console.log(response.data[0].userId);
          await AsyncStorage.setItem("invitedUserId", response.data[0].userId);
          socket.emit("sendInvite", {
            from: userId,
            to: response.data[0].userId,
          });
          router.push("views/chat-views/awaiting-chat-view");
        } else {
          Toast.show({
            type: "info",
            text1: "Brak dostępnych użytkowników w okolicy.",
          });
        }
      } else {
        router.push("views/chat-views/chat-list-view");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas szukania użytkowników do czatowania.",
      });
    }
  };

  return (
    <>
      <View>
        <View
          style={{
            display: "flex",
            width: "100%",
            marginTop: 40,
            marginBottom: 40,
            gap: 10,
            justifyContent: "center",
            alignItems: "center",
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
            Kliknij aby wylosować czat
          </Text>
          <Icon source="arrow-down" size={100} />
          <IncognitoIcon
            handleClick={() => {
              handleSearchChats();
            }}
          />
        </View>
        <View
          style={{
            display: "flex",
            width: "50%",
            alignSelf: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <RadioButton
              value="first"
              color="#2196F3"
              status={numberOfChats.single ? "checked" : "unchecked"}
              onPress={() =>
                setNumberOfChats({ single: true, multiple: false })
              }
            />
            <Text style={{ fontSize: 20 }}>Jeden czat</Text>
          </View>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <RadioButton
              value="second"
              color="#2196F3"
              status={numberOfChats.multiple ? "checked" : "unchecked"}
              onPress={() =>
                setNumberOfChats({ single: false, multiple: true })
              }
            />

            <Text style={{ fontSize: 20 }}>Wiele czatów</Text>
          </View>
        </View>
      </View>
      {profileModalOpen && (
        <UserNameDialog
          handleConfirm={handleChangeUserName}
          onClose={closeProfileModal}
          open={profileModalOpen}
          userName={userName}
        />
      )}
      {inviteModalOpen && (
        <ConfirmChatDialog
          handleConfirm={() => acceptDenyInvitation(true)}
          userName={invitationFromUser!}
          onClose={() => acceptDenyInvitation(false)}
          open={inviteModalOpen}
        />
      )}
    </>
  );
};
export default MainView;
