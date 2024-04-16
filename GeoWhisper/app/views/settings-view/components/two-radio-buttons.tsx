import { Text, View } from "react-native";
import { RadioButton } from "react-native-paper";

interface TwoRadioOptionsProps<T extends Record<string, boolean>> {
  settingHeaderText: string;
  radioOptions: T;
  option1Text: string;
  option2Text: string;
  setRadioOptions: (value: T) => void;
}

export const TwoRadioOptions = <T extends Record<string, boolean>>({
  settingHeaderText,
  radioOptions,
  option1Text,
  option2Text,
  setRadioOptions,
}: TwoRadioOptionsProps<T>) => {
  const handleOptionPress = (key: keyof T) => {
    const updatedOptions = { ...radioOptions };
    for (const optionKey in updatedOptions) {
      if (optionKey === key) {
        updatedOptions[optionKey] = true as T[Extract<keyof T, string>];
      } else {
        updatedOptions[optionKey] = false as T[Extract<keyof T, string>];
      }
    }
    setRadioOptions(updatedOptions);
  };

  return (
    <View style={{ marginTop: 10, marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 15,
          color: "gray",
          textAlign: "center",
        }}
      >
        {settingHeaderText}
      </Text>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <RadioButton
            value="first"
            color="#2196F3"
            status={
              radioOptions[Object.keys(radioOptions)[0]]
                ? "checked"
                : "unchecked"
            }
            onPress={() => handleOptionPress(Object.keys(radioOptions)[0])}
          />
          <Text style={{ fontSize: 16 }}>{option1Text}</Text>
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <RadioButton
            value="second"
            color="#2196F3"
            status={
              radioOptions[Object.keys(radioOptions)[1]]
                ? "checked"
                : "unchecked"
            }
            onPress={() => handleOptionPress(Object.keys(radioOptions)[1])}
          />
          <Text style={{ fontSize: 16 }}>{option2Text}</Text>
        </View>
      </View>
    </View>
  );
};
