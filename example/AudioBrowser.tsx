/* eslint-disable import/namespace */
import * as ExpoBanuba from "expo-banuba";
import { Button, SafeAreaView, Text } from "react-native";

export const AudioBrowser = () => {
  const onClose = () => {
    if (ExpoBanuba.closeAudioBrowser) {
      ExpoBanuba.closeAudioBrowser();
    }
  };

  const onSelectAudio = () => {
    if (ExpoBanuba.selectAudio) {
      ExpoBanuba.selectAudio(
        "<< FULL PATH TO M4A FILE >>",
        "Song name",
        "Artist name",
      );
    }
  };

  return (
    <SafeAreaView>
      <Text>Audio browser is working</Text>
      <Button onPress={onSelectAudio} title="Select audio" />
      <Button onPress={onClose} title="Close" />
    </SafeAreaView>
  );
};
