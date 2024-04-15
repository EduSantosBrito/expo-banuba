import * as ExpoBanuba from "expo-banuba";
import {
  AppRegistry,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AudioBrowser } from "./AudioBrowser";

AppRegistry.registerComponent("expo_banuba_audio_browser", () => AudioBrowser);

export default function App() {
  const onPress = async () => {
    const response = await ExpoBanuba.initVideoEditor(
      process.env.EXPO_PUBLIC_BANUBA_KEY!,
      process.env.EXPO_PUBLIC_GIPHY_KEY!,
    );
    if (!response && Platform.OS === "android") {
      ExpoBanuba.openVideoEditor().then(console.log).catch(console.log);
    }
  };
  return (
    <View style={styles.container}>
      <Text>Running a</Text>
      <Button title="test" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
