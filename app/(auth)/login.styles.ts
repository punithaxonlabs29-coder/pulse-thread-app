import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
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
    borderColor: "#E5E7EB",
    paddingHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },

  forgot: {
    textAlign: "right",
    color: "#F97316",
    marginBottom: 30,
    fontWeight: "600",
  },

  button: {
    height: 58,
    backgroundColor: "#F97316",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

});