import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  absoluteFooter: {
    position: "absolute",
    bottom: -2,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  singleEmojiTimePillMy: {
    backgroundColor: '#F8A871',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    bottom: 4,
    right: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  singleEmojiTimePillOther: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    bottom: 4,
    right: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  time: {
    fontSize: 11,
  },
  myTimeText: {
    color: "rgba(17,24,39,0.6)", 
  },
  otherTimeText: {
    color: "#8696A0",
  },
  tickIcon: {
    marginLeft: 2,
  },
});