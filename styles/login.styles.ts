import { StyleSheet } from 'react-native';
import { Colors } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.background.primary,
    paddingHorizontal: 28,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text.primary,
  },
  subtitle: {
    textAlign: "center",
    color: colors.text.secondary,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: 18,
    marginBottom: 18,
    backgroundColor: colors.background.primary,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  forgot: {
    textAlign: "right",
    color: colors.brand.primary,
    marginBottom: 30,
    fontWeight: "600",
  },
  button: {
    height: 58,
    backgroundColor: colors.brand.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: "700",
  },
});