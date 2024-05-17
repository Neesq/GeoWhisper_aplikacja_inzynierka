import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { Chip } from "app/components/ui/chip";
import { axiosInstance } from "app/utils/axios-instance";
import { useTheme } from "app/utils/theme-provider";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "react-native-paper";
import Toast from "react-native-toast-message";

const BlockedUsers = () => {
  const { appMainColor, appTheme, themeDarkColor, themeLightColor } =
    useTheme();
  const [blockedUsersList, setBlockedUsersList] = useState<
    { id: string; name: string }[] | null
  >(null);

  const navigation = useNavigation();

  const fetchBlockedUsers = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await axiosInstance.post<
        { id: string; name: string }[] | null
      >("/fetch-blocked-users", { userId });

      if (response.data) {
        setBlockedUsersList(response.data);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas pobierania zablokowanych użytkowników.",
      });
    }
  };
  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblockUser = async (blockedUserId: string) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      await axiosInstance.post("/unblock-user", { userId, blockedUserId });
      setBlockedUsersList((prevList) => {
        if (!prevList) return null;
        const updatedList = prevList.filter(
          (user) => user.id !== blockedUserId
        );
        return updatedList.length > 0 ? updatedList : null;
      });
      Toast.show({
        type: "success",
        text1: "Pomyślnie odblokowano użytkownika",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd podczas odblokowywania użytkownika.",
      });
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: appMainColor,
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
  }, [navigation, appMainColor]);
  if (blockedUsersList && blockedUsersList.length === 0)
    return (
      <View
        style={{
          backgroundColor:
            appTheme === "light" ? themeLightColor : themeDarkColor,
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Text
          style={{
            color: appTheme === "light" ? themeDarkColor : themeLightColor,
            fontWeight: "bold",
          }}
        >
          Brak zablokowanych użytkowników.
        </Text>
      </View>
    );
  else {
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
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
              paddingTop: 20,
              paddingBottom: 20,
              gap: 20,
            }}
          >
            {blockedUsersList?.map((user) => {
              return (
                <View
                  key={user.name + user.id}
                  style={{
                    width: "90%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={{ width: "90%" }}>
                    <Chip
                      text={<Text style={{ color: "white" }}>{user.name}</Text>}
                      leftIcon={<Icon size={30} source="incognito" />}
                      backgroundColor={appMainColor}
                    />
                  </View>
                  <View>
                    <Pressable onPress={() => handleUnblockUser(user.id)}>
                      <Icon color="red" source="close-circle" size={40} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </>
    );
  }
};
export default BlockedUsers;
