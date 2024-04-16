import { FC } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Icon, Text } from "react-native-paper";

interface IncognitoIconProps {
  handleClick: () => void;
}

export const IncognitoIcon: FC<IncognitoIconProps> = ({ handleClick }) => {
  return (
    <View
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#dddddd",
        borderRadius: 180,
        borderColor: "#2196F3",
        borderWidth: 10,
        shadowColor: "black",
        shadowOffset: { width: 100, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        width: 250,
        height: 250,
      }}
    >
      <Pressable onPress={handleClick}>
        <Icon source="incognito" size={170} />
      </Pressable>
    </View>
  );
};
