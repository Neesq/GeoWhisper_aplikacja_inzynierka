import { useTheme } from "app/utils/theme-provider";
import { FC } from "react";
import { Text, View } from "react-native";
import { Button, Card, Modal } from "react-native-paper";

interface ConfirmExitChatDialogProps {
  open: boolean;
  onClose: () => void;
  handleConfirm: () => void;
  message: string;
}
const ConfirmExitChatDialog: FC<ConfirmExitChatDialogProps> = ({
  open,
  onClose,
  handleConfirm,
  message,
}) => {
  // TODO: Add handle click function to get users to chat
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
            <Text style={{ color: "black" }}>Zamknij</Text>
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
export default ConfirmExitChatDialog;
