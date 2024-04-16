import { Field, Formik } from "formik";
import { FC } from "react";
import { View, Text } from "react-native";
import { Button, Card, Modal, TextInput } from "react-native-paper";
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
}
const ForgotPasswordDialog: FC<ForgotPasswordDialogProps> = ({
  open,
  onClose,
  handleConfirm,
}) => {
  // TODO: Add handle click function to get users to chat

  return (
    <Modal visible={open} onDismiss={onClose}>
      <Card>
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
          onSubmit={handleConfirm}
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
          }) => {
            console.log(errors);

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
                      style={{ textAlign: "center" }}
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
                      style={{ textAlign: "center" }}
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
                    style={{ textAlign: "center" }}
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
                    style={{ textAlign: "center" }}
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
                    buttonColor="#2196F3"
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
    </Modal>
  );
};
export default ForgotPasswordDialog;
