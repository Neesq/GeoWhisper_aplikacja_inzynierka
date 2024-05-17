import AsyncStorage from "@react-native-async-storage/async-storage";
import OtpVerificationDialogDialog from "app/components/dialog-components/otp-verification-dialog";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { axiosInstance } from "app/utils/axios-instance";
import { generateUserName } from "app/utils/generate-user-name";
import { hashPassword } from "app/utils/hash-password";
import { KeepLoggedIn } from "app/utils/keep-logged-in-enum";
import { useTheme } from "app/utils/theme-provider";
import { router, useNavigation } from "expo-router";
import { Formik, FormikHelpers } from "formik";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Button, Icon, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import * as yup from "yup";

interface RegisterValues {
  directionalNumber: number | null;
  phoneNumber: number | null;
  password: string;
  confirmPassword: string;
}

const initialValues: RegisterValues = {
  directionalNumber: null,
  phoneNumber: null,
  password: "",
  confirmPassword: "",
};

const RegisterView = () => {
  const [otpVerificationDialog, setOtpVerificationDialog] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [userData, setUserData] = useState<
    Omit<RegisterValues, "confirmPassword"> & { name: string }
  >({
    name: "",
    directionalNumber: null,
    phoneNumber: null,
    password: "",
  });
  const navigation = useNavigation();
  const theme = useTheme();

  const openOtpVerifictationDialog = () => {
    setOtpVerificationDialog(true);
  };
  const closeOtpVerifictationDialog = () => {
    setOtpVerificationDialog(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.appMainColor,
      },
      headerTitle: () => <AppHeaderTitle />,
      headerLeft: () => (
        <Pressable onPress={() => router.back()}>
          <Icon color="white" source="arrow-left" size={25} />
        </Pressable>
      ),
      headerTitleAlign: "center",
      headerBackVisible: false,
    });
  }, [navigation, theme]);

  const handleRegister = async (
    code: string,
    setOtpCode: (code: string) => void
  ) => {
    if (Number(sentCode) === Number(code)) {
      const response = await axiosInstance.post("/register", {
        user: {
          name: userData.name,
          directionalNumber: userData.directionalNumber,
          phoneNumber: userData.phoneNumber,
          password: userData.password,
        },
      });
      await AsyncStorage.setItem("keepLoggedIn", KeepLoggedIn.False);
      if (response.data.userId) {
        Toast.show({
          type: "success",
          text1: "Pomyślnie zarejestrowano konto.",
        });
        await AsyncStorage.setItem("userId", response.data.userId);
        router.replace("views/login-register-view/login-view");
      } else if (response.data.message) {
        Toast.show({ type: "error", text1: response.data.message });
      }
    } else {
      Toast.show({ type: "error", text1: "Błędny kod" });
      setOtpCode("");
    }
  };

  const handleSubmit = async (
    values: RegisterValues,
    formikHelpers: FormikHelpers<RegisterValues>
  ) => {
    const encryptedPassword = hashPassword(values.password);
    try {
      setUserData({
        name: generateUserName(),
        password: encryptedPassword,
        directionalNumber: values.directionalNumber,
        phoneNumber: values.phoneNumber,
      });
      const response = await axiosInstance.post("/send-code", {
        phoneNumber: values.phoneNumber,
        directionalNumber: values.directionalNumber,
        action: "register",
      });
      if (response.data.code) {
        setSentCode(response.data.code);
        openOtpVerifictationDialog();
      } else if (response.data.message) {
        Toast.show({ type: "error", text1: response.data.message });
      }
      return;
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <View
        style={{
          backgroundColor:
            theme.appTheme === "light"
              ? theme.themeLightColor
              : theme.themeDarkColor,
          height: "100%",
        }}
      >
        <View style={{ width: "100%", marginTop: 40, marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              textShadowColor: "rgba(0, 0, 0, 0.5)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
              textAlign: "center",
              color:
                theme.appTheme === "light"
                  ? theme.themeDarkColor
                  : theme.themeLightColor,
            }}
          >
            Zrejestruj nowe konto
          </Text>
        </View>
        <Formik<RegisterValues>
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={yup.object().shape({
            directionalNumber: yup
              .string()
              .matches(
                /^[0-9]{1,}$/,
                "Numer kierunkowy musi mieć co najmniej jedną cyfrę."
              )
              .required("Numer kierunkowy jest wymagany."),
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
                      style={{
                        textAlign: "center",
                        zIndex: 0,
                        backgroundColor:
                          theme.appTheme === "light"
                            ? theme.themeLightColor
                            : theme.themeDarkColor,
                      }}
                      textColor={
                        theme.appTheme === "light"
                          ? theme.themeDarkColor
                          : theme.themeLightColor
                      }
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
                      style={{
                        textAlign: "center",
                        zIndex: 0,
                        backgroundColor:
                          theme.appTheme === "light"
                            ? theme.themeLightColor
                            : theme.themeDarkColor,
                      }}
                      textColor={
                        theme.appTheme === "light"
                          ? theme.themeDarkColor
                          : theme.themeLightColor
                      }
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
                      <Text style={{ color: "red" }}>{errors.phoneNumber}</Text>
                    )}
                  </View>
                </View>
                <View>
                  <TextInput
                    label="Hasło"
                    style={{
                      textAlign: "center",
                      zIndex: 0,
                      backgroundColor:
                        theme.appTheme === "light"
                          ? theme.themeLightColor
                          : theme.themeDarkColor,
                    }}
                    textColor={
                      theme.appTheme === "light"
                        ? theme.themeDarkColor
                        : theme.themeLightColor
                    }
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
                    style={{
                      textAlign: "center",
                      zIndex: 0,
                      backgroundColor:
                        theme.appTheme === "light"
                          ? theme.themeLightColor
                          : theme.themeDarkColor,
                    }}
                    textColor={
                      theme.appTheme === "light"
                        ? theme.themeDarkColor
                        : theme.themeLightColor
                    }
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
                    alignItems: "center",
                    marginTop: 20,
                  }}
                >
                  <Button
                    mode="contained"
                    onPress={submitForm}
                    style={{
                      backgroundColor: theme.appMainColor,
                      width: "40%",
                      borderRadius: 5,
                    }}
                  >
                    Zarejestruj się
                  </Button>
                </View>
              </View>
            );
          }}
        </Formik>
      </View>
      {otpVerificationDialog && (
        <OtpVerificationDialogDialog
          handleConfirm={handleRegister}
          onClose={closeOtpVerifictationDialog}
          open={otpVerificationDialog}
        />
      )}
    </>
  );
};
export default RegisterView;
