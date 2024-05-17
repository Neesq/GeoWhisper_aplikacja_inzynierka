import { useTheme } from "app/utils/theme-provider";
import { FC } from "react";
import { Text, View } from "react-native";
import { Button, Card, Chip, Modal } from "react-native-paper";

interface UserNameDialogProps {
  open: boolean;
  onClose: () => void;
  handleConfirm: () => void;
  userName: string;
}
const UserNameDialog: FC<UserNameDialogProps> = ({
  open,
  onClose,
  handleConfirm,
  userName,
}) => {
  const theme = useTheme();
  return (
    <Modal visible={open} onDismiss={onClose}>
      <Card
        style={{
          width: "80%",
          alignSelf: "center",
          backgroundColor:
            theme.appTheme === "light" ? "white" : theme.themeModalDarkColor,
        }}
      >
        <View style={{ display: "flex", alignItems: "center" }}>
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
              Kliknij w przycisk "Losuj", aby wygenerować nową nazwę użytkownika
            </Text>
          </View>
          <View style={{ marginBottom: 20 }}>
            <Chip
              style={{ backgroundColor: theme.appMainColor, borderRadius: 50 }}
            >
              <Text style={{ color: "white" }}>{userName}</Text>
            </Chip>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 40,
              marginBottom: 30,
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
              <Text>Losuj</Text>
            </Button>
          </View>
        </View>
      </Card>
    </Modal>
  );
};
export default UserNameDialog;
