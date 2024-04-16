import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import axios from "axios";
import { router, useNavigation } from "expo-router";
import { Field, Formik } from "formik";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Toast from "react-native-toast-message";
import { v4 as uuidv4 } from "uuid";

import { Button, Text, TextInput } from "react-native-paper";
import * as yup from "yup";
import ForgotPasswordDialog from "./components/forgot-password-dialog";
import { useTheme } from "app/utils/theme-provider";

interface LogInValues {
  directionalNumber: number | null;
  phoneNumber: number | null;
  password: string | null;
}

const initialValues: LogInValues = {
  directionalNumber: null,
  phoneNumber: null,
  password: null,
};

const LoginView = () => {
  const [forgotPasswordDialog, setForgotPasswordDialog] = useState(false);
  const theme = useTheme();

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTitle: () => <AppHeaderTitle />,
      headerTitleAlign: "center",
      headerBackVisible: false,
    });
  }, [navigation]);

  const openForgotPasswordModal = () => {
    setForgotPasswordDialog(true);
  };
  const closeForgotPasswordModal = () => {
    setForgotPasswordDialog(false);
  };

  const handleSubmit = async (
    values: LogInValues
    // formikHelpers: FormikHelpers<LogInValues>
  ) => {
    try {
      if (!values.password) {
        return;
      }
      const storedUserId = await AsyncStorage.getItem("userId");

      const response = await axios.post(
        "http://192.168.1.55:3000/get-user-id",
        {
          user: {
            directionalNumber: values.directionalNumber,
            phoneNumber: values.phoneNumber,
          },
        }
      );

      const loginResponse = await axios.post("http://192.168.1.55:3000/login", {
        user: {
          id: response.data.userId,
          directionalNumber: values.directionalNumber,
          phoneNumber: values.phoneNumber,
          password: values.password,
        },
      });
      if (loginResponse.data.message) {
        Toast.show({ type: "error", text1: loginResponse.data.message });
      } else if (loginResponse.data.userId) {
        await AsyncStorage.setItem("userId", loginResponse.data.userId);
        router.replace("views/main-view");
      }
      return;
    } catch (eror) {
      console.log(eror);
    }
    // router.replace("views/main-view");
  };

  return (
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
          }}
        >
          Zaloguj się do aplikacji
        </Text>
      </View>
      <Formik<LogInValues>
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
            .matches(/^[0-9]{9}$/, "Numer telefonu musi mieć dokładnie 9 cyfr.")
            .required("Numer telefonu jest wymagany."),
          password: yup
            .string()
            .min(8, "Hasło musi mieć conajmniej 8 znaków.")
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
        }) => (
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
                {touched.directionalNumber && !!errors.directionalNumber && (
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
                Zaloguj się
              </Button>
            </View>
          </View>
        )}
      </Formik>
      <View style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
        <Pressable onPress={openForgotPasswordModal}>
          <Text style={{ color: "#2196F3" }}>Zapomniałeś/aś hasła?</Text>
        </Pressable>
        <View style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontWeight: "bold" }}>Nie masz konta?</Text>
          <Text style={{ fontWeight: "bold", marginBottom: 20 }}>
            Kliknij w przycisk poniżej, aby się zarejestrować
          </Text>
          {/* TODO: handle register */}
          <Button
            mode="contained"
            style={{
              backgroundColor: "#2196F3",
              width: "40%",
              borderRadius: 5,
            }}
            onPress={() => {
              router.push("views/login-register-view/register-view");
            }}
          >
            Zarejestruj się
          </Button>
        </View>
      </View>
      {forgotPasswordDialog && (
        <ForgotPasswordDialog
          open={forgotPasswordDialog}
          onClose={closeForgotPasswordModal}
          handleConfirm={closeForgotPasswordModal}
        />
      )}
    </View>
  );
};
export default LoginView;
