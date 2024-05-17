import AsyncStorage from "@react-native-async-storage/async-storage";
import { axiosInstance } from "app/utils/axios-instance";
import { hashPassword } from "app/utils/hash-password";
import { useTheme } from "app/utils/theme-provider";
import { router } from "expo-router";
import { Formik, FormikHelpers } from "formik";
import { FC, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, Modal, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import * as yup from "yup";
interface ForgotPasswordValues {
  directionalNumber: number | null;
  phoneNumber: number | null;
  password: string;
  confirmPassword: string;
}

const initialValues: ForgotPasswordValues = {
  directionalNumber: null,
  phoneNumber: null,
  password: "",
  confirmPassword: "",
};

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  handleConfirm: () => void;
  appTheme: string;
  appMainColor: string;
  appDarkThemeColor: string;
  appLightThemeColor: string;
}
const ForgotPasswordDialog: FC<ForgotPasswordDialogProps> = ({
  open,
  onClose,
  handleConfirm,
}) => {
  const [otpVerificationDialog, setOtpVerificationDialog] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [userData, setUserData] = useState<
    Omit<ForgotPasswordValues, "confirmPassword">
  >({
    directionalNumber: null,
    phoneNumber: null,
    password: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const theme = useTheme();

  const openOtpVerifictationDialog = () => {
    setOtpVerificationDialog(true);
  };
  const closeOtpVerifictationDialog = () => {
    setOtpVerificationDialog(false);
  };

  const handleForgotPassword = async (code: string) => {
    try {
      if (Number(sentCode) === Number(code)) {
        const userId = await AsyncStorage.getItem("userId");
        const response = await axiosInstance.post("/forgot-password", {
          userId: userId,
          directionalNumber: userData.directionalNumber,
          phoneNumber: userData.phoneNumber,
          password: userData.password,
        });
        if (response) {
          Toast.show({
            type: "success",
            text1: "Pomyślnie zmieniono hasło.",
          });
          closeOtpVerifictationDialog();
          onClose();
        }
      } else {
        Toast.show({ type: "error", text1: "Błędny kod" });
        setOtpCode("");
      }
    } catch (error) {
      onClose();
      Toast.show({
        type: "error",
        text1:
          error instanceof Error ? error.message : "Błąd podczas zmiany hasła.",
      });
    }
  };

  const handleSubmit = async (
    values: ForgotPasswordValues,
    formikHelpers: FormikHelpers<ForgotPasswordValues>
  ) => {
    const encryptedPassword = hashPassword(values.password);
    try {
      setUserData({
        password: encryptedPassword,
        directionalNumber: values.directionalNumber,
        phoneNumber: values.phoneNumber,
      });
      const response = await axiosInstance.post("/send-code", {
        phoneNumber: values.phoneNumber,
        directionalNumber: values.directionalNumber,
        action: "forgotPassword",
      });
      if (response.data.message) {
        Toast.show({ type: "error", text1: response.data.message });
        formikHelpers.resetForm();
      } else if (response.data.code) {
        setSentCode(response.data.code);
        openOtpVerifictationDialog();
      }
      return;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal visible={open} onDismiss={onClose}>
      {!otpVerificationDialog && (
        <Card
          style={{
            backgroundColor:
              theme.appTheme === "light" ? "white" : theme.themeModalDarkColor,
          }}
        >
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
                textAlign: "center",
              }}
            >
              Zmień hasło
            </Text>
          </View>
          <Formik<ForgotPasswordValues>
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validationSchema={yup.object().shape({
              directionalNumber: yup
                .string()
                .matches(
                  /^[0-9]{1,}$/,
                  "Numer kierunkowy musi mieć co najmniej jedną cyfrę."
                )
                .required("Numer kierunkowy jest wymagany.")
                .nullable(),
              phoneNumber: yup
                .string()
                .matches(
                  /^[0-9]{9}$/,
                  "Numer telefonu musi mieć dokładnie 9 cyfr."
                )
                .required("Numer telefonu jest wymagany."),
              password: yup
                .string()
                .min(8, "Hasło musi mieć conajmniej 8 znaków.")
                .required("Hasło jest wymagane."),
              confirmPassword: yup
                .string()
                .min(8, "Hasło musi mieć conajmniej 8 znaków.")
                .test(
                  "passwords-match",
                  "Hasła muszą być takie same.",
                  function (value, context) {
                    return context.parent.password === value;
                  }
                )
                .required("Hasło jest wymagane."),
            })}
          >
            {({
              values,
              setFieldValue,
              handleBlur,
              touched,
              errors,
              submitForm,
              handleChange,
            }) => {
              return (
                <View
                  style={{
                    display: "flex",
                    width: "90%",
                    alignSelf: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1.5 }}>
                      <TextInput
                        label="Nr kierunkowy"
                        style={{ textAlign: "center" }}
                        onChangeText={handleChange("directionalNumber")}
                        onBlur={handleBlur("directionalNumber")}
                        value={
                          values.directionalNumber
                            ? String(values.directionalNumber)
                            : ""
                        }
                        activeOutlineColor={theme.appMainColor}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={3}
                      />
                      {touched.directionalNumber &&
                        !!errors.directionalNumber && (
                          <Text style={{ color: "red" }}>
                            {errors.directionalNumber}
                          </Text>
                        )}
                    </View>
                    <View style={{ flex: 2.5 }}>
                      <TextInput
                        style={{ textAlign: "center" }}
                        label="Numer telefonu"
                        onChangeText={handleChange("phoneNumber")}
                        onBlur={handleBlur("phoneNumber")}
                        value={
                          values.phoneNumber ? String(values.phoneNumber) : ""
                        }
                        activeOutlineColor={theme.appMainColor}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={9}
                      />
                      {touched.phoneNumber && !!errors.phoneNumber && (
                        <Text style={{ color: "red" }}>
                          {errors.phoneNumber}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View>
                    <TextInput
                      label="Hasło"
                      style={{ textAlign: "center" }}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      value={values.password ? String(values.password) : ""}
                      secureTextEntry={true}
                      activeOutlineColor={theme.appMainColor}
                      mode="outlined"
                    />
                    {touched.password && !!errors.password && (
                      <Text style={{ color: "red" }}>{errors.password}</Text>
                    )}
                  </View>
                  <View>
                    <TextInput
                      label="Potwierdź hasło"
                      style={{ textAlign: "center" }}
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                      value={
                        values.confirmPassword
                          ? String(values.confirmPassword)
                          : ""
                      }
                      secureTextEntry={true}
                      activeOutlineColor={theme.appMainColor}
                      mode="outlined"
                    />
                    {touched.confirmPassword && !!errors.confirmPassword && (
                      <Text style={{ color: "red" }}>
                        {errors.confirmPassword}
                      </Text>
                    )}
                  </View>

                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-around",
                      marginBottom: 20,
                      marginTop: 10,
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
                      onPress={submitForm}
                    >
                      <Text>Potwierdź</Text>
                    </Button>
                  </View>
                </View>
              );
            }}
          </Formik>
        </Card>
      )}

      {otpVerificationDialog && (
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
              Wpisz 6 cyfrowy kod, który wysłaliśmy Ci w wiadomości sms, aby
              zmienić hasło.
            </Text>
          </View>
          <View style={{ marginBottom: 20, display: "flex" }}>
            <TextInput
              mode="outlined"
              activeOutlineColor={theme.appMainColor}
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
              buttonColor={theme.appMainColor}
              style={{ borderRadius: 5 }}
              onPress={() => handleForgotPassword(otpCode)}
            >
              <Text>Potwierdź</Text>
            </Button>
          </View>
        </Card>
      )}
    </Modal>
  );
};
export default ForgotPasswordDialog;
