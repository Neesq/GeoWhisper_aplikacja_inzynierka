import { View } from "react-native";
import { Icon, Text } from "react-native-paper";

export const AppHeaderTitle = () => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 20 }}>GeoWhisper</Text>
      <Icon color="white" source="map-marker" size={25} />
    </View>
  );
};
