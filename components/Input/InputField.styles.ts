import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    height: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 18,

    marginTop: 15,
  },

  input: {
    flex: 1,

    marginLeft: 12,

    fontSize: 16,
  },
});