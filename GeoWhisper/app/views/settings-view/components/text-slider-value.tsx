import Slider from "@react-native-community/slider";
import { View, Text } from "react-native";

interface TextSliderValueProps {
  settingName: string;
  sliderColor: string;
  sliderMinVal: number;
  sliderMaxVal: number;
  sliderValue: number;
  sliderStep: number;
  sliderValueChange: (value: number) => void;
}

export const TextSliderValue = ({
  settingName,
  sliderColor,
  sliderMaxVal,
  sliderMinVal,
  sliderValue,
  sliderStep,
  sliderValueChange,
}: TextSliderValueProps) => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <Text>{settingName}</Text>
      <View
        style={{
          backgroundColor: "#2196F3",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 30,
          height: 30,
          marginTop: 5,
          borderRadius: 40,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
          {sliderValue}
        </Text>
      </View>
      <Slider
        style={{ width: 250, height: 40 }}
        minimumTrackTintColor={`${sliderColor}`}
        thumbTintColor={`${sliderColor}`}
        minimumValue={sliderMinVal}
        maximumValue={sliderMaxVal}
        step={sliderStep}
        value={sliderValue}
        onValueChange={sliderValueChange}
      />
    </View>
  );
};
