import { FC } from "react";
import { View } from "react-native";
import { Icon, Text } from "react-native-paper";

interface AppHeaderTitleProps {
  color?: string;
}

export const AppHeaderTitle: FC<AppHeaderTitleProps> = ({ color }) => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: color ? color : "white", fontSize: 20 }}>
        GeoWhisper
      </Text>
      <Icon color={color ? color : "white"} source="map-marker" size={25} />
    </View>
  );
};
