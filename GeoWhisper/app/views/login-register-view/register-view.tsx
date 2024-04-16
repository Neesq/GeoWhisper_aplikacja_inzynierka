import OtpVerificationDialogDialog from "app/components/dialog-components/otp-verification-dialog";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { router, useNavigation } from "expo-router";
import { Field, Formik, FormikHelpers } from "formik";
import { useEffect, useState } from "react";
import bcrypt from "react-native-bcrypt";
import { Pressable, View } from "react-native";
import { Button, Icon, Text, TextInput } from "react-native-paper";
import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";
import axios from "axios";
import { generateUserName } from "app/utils/generate-user-name";

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

  const openOtpVerifictationDialog = () => {
    setOtpVerificationDialog(true);
  };
  const closeOtpVerifictationDialog = () => {
    setOtpVerificationDialog(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: "#2196F3",
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
  }, [navigation]);

  const handleRegister = async (code: string) => {
    if (Number(sentCode) === Number(code)) {
      await axios.post(
        "https://geowhisper-aplikacja-inzynierka.onrender.com/register",
        {
          user: {
            name: userData.name,
            directionalNumber: userData.directionalNumber,
            phoneNumber: userData.phoneNumber,
            password: userData.password,
          },
        }
      );
      router.replace("views/login-register-view/login-view");
    }
  };

  const handleSubmit = async (
    values: RegisterValues,
    formikHelpers: FormikHelpers<RegisterValues>
  ) => {
    const encryptedPassword = bcrypt.hashSync(values.password, 6);
    try {
      setUserData({
        name: generateUserName(),
        password: encryptedPassword,
        directionalNumber: values.directionalNumber,
        phoneNumber: values.phoneNumber,
      });
      const response = await axios.post<{ code: string }>(
        "https://geowhisper-aplikacja-inzynierka.onrender.com/send-code",
        {
          phoneNumber: values.phoneNumber,
          directionalNumber: values.directionalNumber,
        }
      );
      setSentCode(response.data.code);
      openOtpVerifictationDialog();
      return;
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <View>
        <View style={{ width: "100%", marginTop: 40, marginBottom: 40 }}>
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
            setFieldValue,
            handleBlur,
            touched,
            errors,
            submitForm,
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
                    <Field
                      as={TextInput}
                      name="directionalNumber"
                      label="Nr kierunkowy"
                      style={{ textAlign: "center", zIndex: 0 }}
                      onChangeText={(value: string) =>
                        setFieldValue("directionalNumber", value)
                      }
                      onBlur={() => handleBlur("directionalNumber")}
                      value={values.directionalNumber}
                      activeOutlineColor="#2196F3"
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
                    <Field
                      as={TextInput}
                      style={{ textAlign: "center", zIndex: 0 }}
                      name="phoneNumber"
                      label="Numer telefonu"
                      onChangeText={(value: string) =>
                        setFieldValue("phoneNumber", value)
                      }
                      onBlur={handleBlur("phoneNumber")}
                      value={values.phoneNumber?.toString()}
                      activeOutlineColor="#2196F3"
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
                  <Field
                    as={TextInput}
                    name="password"
                    label="Hasło"
                    style={{ textAlign: "center", zIndex: 0 }}
                    onChangeText={(value: string) =>
                      setFieldValue("password", value)
                    }
                    onBlur={() => handleBlur("password")}
                    value={values.password}
                    secureTextEntry={true}
                    activeOutlineColor="#2196F3"
                    mode="outlined"
                  />
                  {touched.password && !!errors.password && (
                    <Text style={{ color: "red" }}>{errors.password}</Text>
                  )}
                </View>
                <View>
                  <Field
                    as={TextInput}
                    name="confirmPassword"
                    label="Potwierdź hasło"
                    style={{ textAlign: "center", zIndex: 0 }}
                    onChangeText={(value: string) =>
                      setFieldValue("confirmPassword", value)
                    }
                    onBlur={() => handleBlur("confirmPassword")}
                    value={values.confirmPassword}
                    secureTextEntry={true}
                    activeOutlineColor="#2196F3"
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
                      backgroundColor: "#2196F3",
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
