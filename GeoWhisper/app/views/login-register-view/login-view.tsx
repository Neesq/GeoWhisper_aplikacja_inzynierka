import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeaderTitle } from "app/components/ui/app-header-title";
import { router, useNavigation } from "expo-router";
import { Field, Formik, FormikHelpers } from "formik";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Toast from "react-native-toast-message";
import { axiosInstance } from "app/utils/axios-instance";
import { useTheme } from "app/utils/theme-provider";
import { Button, Text, TextInput } from "react-native-paper";
import * as yup from "yup";
import ForgotPasswordDialog from "./components/forgot-password-dialog";

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
        backgroundColor: theme.appMainColor,
      },
      headerTitle: () => <AppHeaderTitle />,
      headerTitleAlign: "center",
      headerBackVisible: false,
    });
  }, [navigation, theme]);

  const openForgotPasswordModal = () => {
    setForgotPasswordDialog(true);
  };
  const closeForgotPasswordModal = () => {
    setForgotPasswordDialog(false);
  };

  const handleSubmit = async (
    values: LogInValues,
    formikHelpers: FormikHelpers<LogInValues>
  ) => {
    try {
      if (!values.password) {
        return;
      }
      const response = await axiosInstance.post("/get-user-id", {
        directionalNumber: values.directionalNumber,
        phoneNumber: values.phoneNumber,
      });

      await AsyncStorage.setItem("userId", response.data.userId);
      const loginResponse = await axiosInstance.post("/login", {
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
        formikHelpers.resetForm();
        router.replace("views/main-view");
      }
      return;
    } catch (eror) {
      Toast.show({ type: "error", text1: "Bąd podczas logowania." });
    }
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
            color:
              theme.appTheme === "light"
                ? theme.themeDarkColor
                : theme.themeLightColor,
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
          password: yup.string().required("Hasło jest wymagane."),
        })}
      >
        {({
          values,
          handleBlur,
          touched,
          errors,
          submitForm,
          handleChange,
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
                {touched.directionalNumber && !!errors.directionalNumber && (
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
                  value={values.phoneNumber ? String(values.phoneNumber) : ""}
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
                Zaloguj się
              </Button>
            </View>
          </View>
        )}
      </Formik>
      <View style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
        <Pressable onPress={openForgotPasswordModal}>
          <Text style={{ color: theme.appMainColor }}>
            Zapomniałeś/aś hasła?
          </Text>
        </Pressable>
        <View style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
          <Text
            style={{
              fontWeight: "bold",
              color:
                theme.appTheme === "light"
                  ? theme.themeDarkColor
                  : theme.themeLightColor,
            }}
          >
            Nie masz konta?
          </Text>
          <Text
            style={{
              fontWeight: "bold",
              marginBottom: 20,
              color:
                theme.appTheme === "light"
                  ? theme.themeDarkColor
                  : theme.themeLightColor,
            }}
          >
            Kliknij w przycisk poniżej, aby się zarejestrować
          </Text>
          <Button
            mode="contained"
            style={{
              backgroundColor: theme.appMainColor,
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
          appTheme={theme.appTheme}
          appMainColor={theme.appMainColor}
          appDarkThemeColor={theme.themeDarkColor}
          appLightThemeColor={theme.themeLightColor}
        />
      )}
    </View>
  );
};
export default LoginView;
