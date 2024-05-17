import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { axiosInstance } from "./utils/axios-instance";
import { socket } from "./utils/socket";
import { ThemeProvider } from "./utils/theme-provider";

socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    socket.connect();
  }
});

const AppLayout = () => {
  const [userId, setUserId] = useState("");
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    socket.connect();
  }, [socket.connected]);

  useEffect(() => {
    const getUserId = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        setUserId(userId);
      }
    };
    if (!userId) {
      getUserId();
    }
  }, [userId]);
  useEffect(() => {
    (async () => {
      if (userId) {
        getLocation();
      }
      const intervalId = setInterval(() => {
        if (userId) {
          getLocation();
        }
      }, 5000);
      return () => clearInterval(intervalId);
    })();
  }, [userId]);

  const getLocation = async () => {
    try {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 10,
        },
        async (location) => {
          setCurrentLocation(location);
        }
      );
    } catch (error) {
      Toast.show({ type: "error", text1: "Błąd przy pobieraniu lokalizacji." });
    }
  };

  useEffect(() => {
    if (currentLocation) {
      const updateLocationOnChange = async () => {
        const { longitude, latitude } = currentLocation.coords;
        if (longitude && latitude && userId) {
          await axiosInstance.post("/update-location", {
            userId: userId,
            longitude: longitude,
            latitude: latitude,
          });
        }
      };
      updateLocationOnChange();
    }
  }, [currentLocation?.coords.latitude, currentLocation?.coords.longitude]);

  return (
    <>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="views/login-register-view/login-view" />
          <Stack.Screen name="views/main-view/index" />
          <Stack.Screen name="views/settings-view/index" />
          <Stack.Screen name="views/login-register-view/register-view" />
          <Stack.Screen name="views/chat-views/chat-view" />
          <Stack.Screen name="views/chat-views/chat-list-view" />
          <Stack.Screen name="views/chat-views/awaiting-chat-view" />
          <Stack.Screen name="views/settings-view/blocked-users" />
        </Stack>
        <Toast />
      </ThemeProvider>
    </>
  );
};

export default AppLayout;
