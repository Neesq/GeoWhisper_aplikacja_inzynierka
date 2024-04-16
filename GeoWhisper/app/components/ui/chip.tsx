import { View } from "react-native";
import { Icon, Text } from "react-native-paper";

interface ChipProps {
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  text: JSX.Element;
  backgroundColor: string;
}

export const Chip = ({
  leftIcon,
  rightIcon,
  text,
  backgroundColor,
}: ChipProps) => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 50,
        backgroundColor: backgroundColor,
        borderRadius: 30,
        padding: 10,
      }}
    >
      <View style={{ flex: 1, alignItems: "center" }}>
        {leftIcon ? leftIcon : <View></View>}
      </View>
      <View style={{ flex: 4, alignItems: "center" }}>{text}</View>
      <View style={{ flex: 1 }}>{rightIcon ? rightIcon : <View></View>}</View>
    </View>
  );
};
