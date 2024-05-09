import { socket } from "app/utils/socket";
import { router } from "expo-router";
import { FC, useEffect, useState } from "react";
import Toast from "react-native-toast-message";

interface CheckIfInRangeProps {
  userIds: { to: string; from: string };
  disconnectTimerId: NodeJS.Timeout | null;
  rangeCheckIntervalId: NodeJS.Timeout | null;
  toasterShowed: boolean;
}

export const CheckIfInRange: FC<CheckIfInRangeProps> = ({
  userIds,
  disconnectTimerId,
  rangeCheckIntervalId,
  toasterShowed,
}) => {
  useEffect(() => {
    rangeCheckIntervalId = setInterval(() => {
      if (userIds.to && userIds.from)
        socket.emit("rangeCheck", {
          userId: userIds.from,
          userIdToCheck: userIds.to,
        });
    }, 3000);

    return () => {
      if (rangeCheckIntervalId) {
        clearInterval(rangeCheckIntervalId);
      }
    };
  }, []);

  const handleUserInRange = (inRange: boolean) => {
    if (!inRange) {
      if (!toasterShowed) {
        Toast.show({
          type: "info",
          text1: "Użytkownik poza zasięgiem",
          text2: "Czat zakończy się za 30 sek",
          text2Style: { fontSize: 10, color: "black" },
        });
        toasterShowed = true;
      }
      disconnectTimerId = setTimeout(() => {
        if (disconnectTimerId) {
          socket.off("userInRange");
          socket.off("rangeCheck");
          router.replace("views/main-view");
          clearInterval(rangeCheckIntervalId!);
          clearTimeout(disconnectTimerId!);
        }
      }, 30000);
    } else {
      if (toasterShowed) {
        Toast.show({
          type: "info",
          text1: "Użytkownik w zasięgu",
          text2: "Czat zostanje wznowiony",
          text2Style: { fontSize: 10, color: "black" },
        });
        toasterShowed = false;
      }
      if (disconnectTimerId) {
        clearTimeout(disconnectTimerId);
        disconnectTimerId = null;
      }
    }
  };

  useEffect(() => {
    socket.on("userInRange", handleUserInRange);

    return () => {
      socket.off("userInRange");
      if (disconnectTimerId) {
        clearTimeout(disconnectTimerId);
      }
    };
  }, [disconnectTimerId, toasterShowed]);
  return null;
};
