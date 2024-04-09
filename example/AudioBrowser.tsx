/* eslint-disable import/namespace */
import * as ExpoBanuba from "expo-banuba";
import { Button, SafeAreaView, Text } from "react-native";

export const AudioBrowser = () => {
  const onClose = () => {
    if (ExpoBanuba.closeAudioBrowser) {
      ExpoBanuba.closeAudioBrowser();
    }
  };

  return (
    <SafeAreaView>
      <Text>Audio browser is working</Text>
      <Button onPress={onClose} title="Close" />
    </SafeAreaView>
  );
};
