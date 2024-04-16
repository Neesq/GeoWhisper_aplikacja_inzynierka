import { Slot, router } from "expo-router";
import { FC, useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";

const HomePage: FC = () => {
  useEffect(() => {
    const checkUserId = async () => {
      const userId = await AsyncStorage.getItem("userId");

      if (userId) {
        router.replace("views/login-register-view/login-view");
      } else {
        // await AsyncStorage.removeItem("userId");
        router.replace("views/main-view");
      }
    };
    checkUserId();
  }, []);
  return (
    <>
      <View
        style={{ display: "flex", height: "100%", justifyContent: "center" }}
      >
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    </>
  );
};
export default HomePage;
