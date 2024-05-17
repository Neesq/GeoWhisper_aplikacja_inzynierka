import { useTheme } from "app/utils/theme-provider";
import { Field, Formik } from "formik";
import { FC } from "react";
import { View, Text } from "react-native";
import { Button, Card, Checkbox, Modal, TextInput } from "react-native-paper";
import * as yup from "yup";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  handleConfirm: () => void;
  reportMessage: string;
  setReportMessage: (value: string) => void;
  blockUser: boolean;
  setBlockUser: (value: boolean) => void;
}
const ReportModal: FC<ReportModalProps> = ({
  open,
  onClose,
  handleConfirm,
  blockUser,
  reportMessage,
  setBlockUser,
  setReportMessage,
}) => {
  const theme = useTheme();
  return (
    <Modal visible={open} onDismiss={onClose}>
      <Card
        style={{
          width: "95%",
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
            marginBottom: 10,
            marginTop: 10,
          }}
        >
          <Text style={{ fontWeight: "bold", textAlign: "center" }}>
            Zgłoś użytkownika
          </Text>
        </View>
        <View
          style={{
            marginTop: 10,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <TextInput
            mode="outlined"
            value={reportMessage}
            onChangeText={setReportMessage}
            multiline
            numberOfLines={5}
            activeOutlineColor={theme.appMainColor}
            placeholder="Treść zgłoszenia ..."
            placeholderTextColor={
              theme.appTheme === "light"
                ? theme.themeDarkColor
                : theme.themeLightColor
            }
            style={{
              borderColor: theme.appMainColor,
              minWidth: "90%",
              maxWidth: "90%",
            }}
          />
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Checkbox
            status={blockUser ? "checked" : "unchecked"}
            color={theme.appMainColor}
            onPress={() => {
              setBlockUser(!blockUser);
            }}
          />
          <Text>Zablokuj użytkownika</Text>
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
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
            disabled={reportMessage.length === 0}
            onPress={handleConfirm}
          >
            <Text>Zgłoś</Text>
          </Button>
        </View>
      </Card>
    </Modal>
  );
};
export default ReportModal;
