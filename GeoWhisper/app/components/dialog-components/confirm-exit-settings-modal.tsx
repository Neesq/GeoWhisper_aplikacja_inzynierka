import { useTheme } from "app/utils/theme-provider";
import { Field, Formik } from "formik";
import { FC } from "react";
import { View, Text } from "react-native";
import { Button, Card, Modal, TextInput } from "react-native-paper";
import * as yup from "yup";

interface ConfirmExitSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  handleConfirm: () => void;
  message: string;
}
const ConfirmExitSettingsDialog: FC<ConfirmExitSettingsDialogProps> = ({
  open,
  onClose,
  handleConfirm,
  message,
}) => {
  const theme = useTheme();
  return (
    <Modal visible={open} onDismiss={onClose}>
      <Card
        style={{
          width: "80%",
          alignSelf: "center",
          display: "flex",
          alignItems: "center",
          backgroundColor:
            theme.appTheme === "light" ? "white" : theme.themeModalDarkColor,
        }}
      >
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "80%",
            marginBottom: 10,
            marginTop: 10,
          }}
        >
          <Text style={{ fontWeight: "bold", textAlign: "center" }}>
            {message}
          </Text>
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 40,
            marginBottom: 20,
          }}
        >
          <Button
            mode="contained"
            buttonColor="#0000001a"
            style={{ borderRadius: 5 }}
            onPress={onClose}
          >
            <Text style={{ color: "black" }}>Anuluj</Text>
          </Button>
          <Button
            mode="contained"
            buttonColor={theme.appMainColor}
            style={{ borderRadius: 5 }}
            onPress={handleConfirm}
          >
            <Text>Potwierdź</Text>
          </Button>
        </View>
      </Card>
    </Modal>
  );
};
export default ConfirmExitSettingsDialog;
