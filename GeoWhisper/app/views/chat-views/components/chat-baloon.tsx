import { useTheme } from "app/utils/theme-provider";
import { FC } from "react";
import { View, StyleSheet } from "react-native";
import { Chip, Icon, Text } from "react-native-paper";

interface ChatBaloonProps {
  message: string;
  from: boolean;
}
export const ChatBaloon: FC<ChatBaloonProps> = ({ message, from }) => {
  const theme = useTheme();
  return (
    <View>
      {/* <Text>{new Date().toISOString()}</Text> */}
      <View
        style={[
          styles.messageContainer,
          !from
            ? { ...styles.sentMessage, backgroundColor: theme.appMainColor }
            : { ...styles.receivedMessage },
          !from ? styles.messageMarginRight : styles.messageMarginLeft,
        ]}
      >
        <Text
          style={
            from
              ? {
                  ...styles.messageTextReceived,
                  color:
                    theme.appTheme === "light"
                      ? theme.themeDarkColor
                      : theme.themeLightColor,
                }
              : styles.messageTextSent
          }
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: "70%",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "gray",
  },
  sentMessage: {
    alignSelf: "flex-end",
  },
  receivedMessage: {
    alignSelf: "flex-start",
  },
  messageTextReceived: {
    fontSize: 16,
  },
  messageTextSent: {
    fontSize: 16,
    color: "black",
  },

  messageMarginLeft: {
    marginLeft: 5,
  },
  messageMarginRight: {
    marginRight: 5,
  },
});
