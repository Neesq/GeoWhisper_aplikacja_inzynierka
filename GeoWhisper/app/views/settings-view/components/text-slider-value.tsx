import Slider from "@react-native-community/slider";
import { useTheme } from "app/utils/theme-provider";
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
  const theme = useTheme();
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <Text
        style={{
          color:
            theme.appTheme === "light"
              ? theme.themeDarkColor
              : theme.themeLightColor,
        }}
      >
        {settingName}
      </Text>
      <View
        style={{
          backgroundColor: theme.appMainColor,
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
        maximumTrackTintColor={
          theme.appTheme === "light"
            ? theme.themeDarkColor
            : theme.themeLightColor
        }
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
