import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { ThemeProvider } from "./utils/theme-provider";
import axios from "axios";
import { socket } from "./utils/socket";

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
      let { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
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
          await axios.post(
            "https://geowhisper-aplikacja-inzynierka.onrender.com/update-location",
            {
              userId: userId,
              longitude: longitude,
              latitude: latitude,
            }
          );
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
        </Stack>
        <Toast />
      </ThemeProvider>
    </>
  );
};

export default AppLayout;
