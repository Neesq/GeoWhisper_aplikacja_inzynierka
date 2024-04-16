import { FC } from "react";
import { View, StyleSheet } from "react-native";
import { Chip, Icon, Text } from "react-native-paper";

interface ChatBaloonProps {
  message: string;
  from: boolean;
}
export const ChatBaloon: FC<ChatBaloonProps> = ({ message, from }) => {
  return (
    <View>
      {/* <Text>{new Date().toISOString()}</Text> */}
      <View
        style={[
          styles.messageContainer,
          !from ? styles.sentMessage : styles.receivedMessage,
          !from ? styles.messageMarginRight : styles.messageMarginLeft,
        ]}
      >
        <Text
          style={from ? styles.messageTextReceived : styles.messageTextSent}
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
    backgroundColor: "#2196F3",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  messageTextReceived: {
    fontSize: 16,
  },
  messageTextSent: {
    fontSize: 16,
    color: "white",
  },

  messageMarginLeft: {
    marginLeft: 5,
  },
  messageMarginRight: {
    marginRight: 5,
  },
});
