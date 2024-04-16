import { Field, Formik } from "formik";
import { FC, useState } from "react";
import { View, Text } from "react-native";
import { Button, Card, Modal, TextInput } from "react-native-paper";
import * as yup from "yup";

interface OtpVerificationDialogDialogProps {
  open: boolean;
  onClose: () => void;
  handleConfirm: (code: string) => void;
}
const OtpVerificationDialogDialog: FC<OtpVerificationDialogDialogProps> = ({
  open,
  onClose,
  handleConfirm,
}) => {
  const [otpCode, setOtpCode] = useState("");

  return (
    <Modal visible={open} onDismiss={onClose}>
      <Card
        style={{
          width: "80%",
          alignSelf: "center",
          display: "flex",
          alignItems: "center",
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
            Wpisz 6 cyfrowy kod, który wysłaliśmy Ci w wiadomości sms, aby
            potwierdzić rejestrację.
          </Text>
        </View>
        <View style={{ marginBottom: 20, display: "flex" }}>
          <TextInput
            mode="outlined"
            activeOutlineColor="#2196F3"
            placeholder="Wpisz kod"
            label="Kod"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="numeric"
            maxLength={6}
          />
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
            buttonColor="#2196F3"
            style={{ borderRadius: 5 }}
            onPress={() => handleConfirm(otpCode)}
          >
            <Text>Potwierdź</Text>
          </Button>
        </View>
      </Card>
    </Modal>
  );
};
export default OtpVerificationDialogDialog;
