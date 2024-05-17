import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import ConfirmChatDialog from "../../components/dialog-components/confirm-chat-dialog";
import { AppHeaderTitle } from "../../components/ui/app-header-title";
import { IncognitoIcon } from "../../components/ui/incognito-icon";
import { axiosInstance } from "../../utils/axios-instance";
import { generateUserName } from "../../utils/generate-user-name";
import { socket } from "../../utils/socket";
import { useTheme } from "../../utils/theme-provider";
import { handleUserAvailable } from "../../utils/toggle-user-available";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Pressable, View } from "react-native";
import { ActivityIndicator, Icon, RadioButton, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import UserNameDialog from "./components/user-name-dialog";

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
  const [userId, setUserId] = useState<string | null>(null);
  const [invitationUserName, setnvitationUserName] = useState<string | null>(
    null
  );
  const [userName, setUserName] = useState("");
  const theme = useTheme();

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && userId) {
        socket.emit("mapUserId", userId);
      }
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const fetchThemeFromDatabase = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const themeData = await axiosInstance.post("/user-settings-fetch", {
            userId: userId,
          });
          if (themeData.data) {
            theme.updateTheme({
              appTheme: themeData.data.appTheme,
              appMainColor: themeData.data.appMainColor,
              themeLoaded: true,
            });
          }
        } else {
          theme.updateTheme({
            themeLoaded: true,
          });
        }
      } catch (error) {
        Toast.show({
          text1: "Błąd pobierania motywu z bazy danych:",
          type: "error",
        });
      }
    };
    fetchThemeFromDatabase();
  }, []);

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
  useEffect(() => {
    socket.on("invitationCancelled", () => {
      closeInviteModal();
    });
    return () => {
      socket.off("invitationCancelled");
    };
  }, []);

  const getUserId = async () => {
    const userId = await AsyncStorage.getItem("userId");
    setUserId(userId);
  };

  useEffect(() => {
    if (!userId) {
      getUserId();
    }
  }, [userId]);

  const mapUser = async () => {
    if (!userMapped && userId) {
      socket.emit("mapUserId", userId);
      setUserMapped(true);
    }
  };
  useEffect(() => {
    mapUser();
  }, [userMapped, userId]);

  socket.on("invitationRecieved", async (invitationRecieved: string) => {
    try {
      const response = await axiosInstance.get(
        `/get-user-name/${invitationRecieved}`
      );
      if (response.data.userName) {
        setnvitationUserName(response.data.userName);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd pobierania nazwy zapraszającego.",
      });
    }
    setInvitationFromUser(invitationRecieved);
    openInviteModal();
  });

  const acceptDenyInvitation = async (accept: boolean) => {
    if (userId) {
      socket.emit("acceptDenyInvitation", {
        to: invitationFromUser,
        from: userId,
        accepted: accept,
      });
      closeInviteModal();
      if (accept) {
        await handleUserAvailable(userId, false);
        router.push({
          pathname: "views/chat-views/chat-view",
          params: { invitedUser: invitationFromUser },
        });
      }
    }
  };

  const handleChangeUserName = async () => {
    try {
      if (userId) {
        const newUserName = generateUserName();
        const response = await axiosInstance.post("/change-user-name", {
          userId: userId,
          userName: newUserName,
        });

        if (!response.data.message) {
          setUserName(newUserName);
        } else {
          Toast.show({ type: "error", text1: response.data.message });
        }
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Błąd zmiany nazwy użytkownika" });
    }
  };

  useEffect(() => {
    const getUserName = async () => {
      const userName = await axiosInstance.get(`/get-user-name/${userId}`);
      if (userName.data.userName) {
        setUserName(userName.data.userName);
      } else if (userName.data.message) {
        Toast.show({ type: "error", text1: userName.data.message });
      }
    };
    if (!userName && userId) {
      getUserName();
    }
  }, [userId]);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.appMainColor,
      },
      headerTitle: () => <AppHeaderTitle />,
      headerLeft: () => (
        <Pressable
          onPress={async () => {
            if (userId) await handleUserAvailable(userId, false);
            router.push("views/settings-view");
          }}
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
  }, [navigation, profileModalOpen, theme]);

  const handleSearchChats = async () => {
    try {
      if (numberOfChats.single) {
        if (userId) {
          const response = await axiosInstance.post<
            { userId: string; userName: string }[] | null
          >("/get-users-to-chat", {
            userId: userId,
            oneChat: numberOfChats.single,
          });

          if (response.data?.length) {
            socket.emit("sendInvite", {
              from: userId,
              to: response.data[0].userId,
            });
            await handleUserAvailable(userId, false);
            router.push({
              pathname: "views/chat-views/awaiting-chat-view",
              params: { invitedUser: response.data[0].userId },
            });
          } else {
            Toast.show({
              type: "info",
              text1: "Brak dostępnych użytkowników w okolicy.",
            });
          }
        }
      } else {
        if (userId) {
          await handleUserAvailable(userId, false);
          router.push("views/chat-views/chat-list-view");
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas szukania użytkowników do czatowania.",
      });
    }
  };

  if (!userId)
    return (
      <View
        testID="testoweid"
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );

  return (
    <>
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
              color:
                theme.appTheme === "light"
                  ? theme.themeDarkColor
                  : theme.themeLightColor,
            }}
          >
            Kliknij aby wylosować czat
          </Text>
          <Icon
            source="arrow-down"
            size={100}
            color={
              theme.appTheme === "light"
                ? theme.themeDarkColor
                : theme.themeLightColor
            }
          />
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
              color={theme.appMainColor}
              status={numberOfChats.single ? "checked" : "unchecked"}
              onPress={() =>
                setNumberOfChats({ single: true, multiple: false })
              }
            />
            <Text
              style={{
                fontSize: 20,
                color:
                  theme.appTheme === "light"
                    ? theme.themeDarkColor
                    : theme.themeLightColor,
              }}
            >
              Jeden czat
            </Text>
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
              color={theme.appMainColor}
              status={numberOfChats.multiple ? "checked" : "unchecked"}
              onPress={() =>
                setNumberOfChats({ single: false, multiple: true })
              }
            />

            <Text
              style={{
                fontSize: 20,
                color:
                  theme.appTheme === "light"
                    ? theme.themeDarkColor
                    : theme.themeLightColor,
              }}
            >
              Wiele czatów
            </Text>
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
          userName={invitationUserName!}
          onClose={() => acceptDenyInvitation(false)}
          open={inviteModalOpen}
        />
      )}
    </>
  );
};
export default MainView;
