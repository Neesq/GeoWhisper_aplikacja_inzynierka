import Toast from "react-native-toast-message";
import { axiosInstance } from "./axios-instance";

export const handleUserAvailable = async (
  userId: string,
  availabilty: boolean
) => {
  try {
    if (userId) {
      await axiosInstance.post("/user-availabilty-status", {
        userId: userId,
        available: availabilty,
      });
    }
    return;
  } catch (error) {
    Toast.show({ type: "error", text1: "Błąd zmiany statusu użytkownika" });
  }
};
