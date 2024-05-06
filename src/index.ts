import { Platform } from "react-native";

import ExpoBanubaModule from "./ExpoBanubaModule";

type ExportedVideo = {
  thumbnail: string;
  video: string;
};

export async function initVideoEditor(
  licenseKey: string,
  giphyApiKey: string,
): Promise<null | ExportedVideo> {
  if (Platform.OS === "ios") {
    const response = await ExpoBanubaModule.initVideoEditor(
      licenseKey,
      giphyApiKey,
    );
    return JSON.parse(response) as ExportedVideo;
  }

  return await ExpoBanubaModule.initVideoEditor(licenseKey);
}

export async function openVideoEditor(): Promise<void> {
  return ExpoBanubaModule.openVideoEditor();
}

export async function closeAudioBrowser(): Promise<void> {
  return ExpoBanubaModule.closeAudioBrowser();
}

export async function selectAudio(
  audioURL: string,
  musicName: string,
  artistName: string,
): Promise<void> {
  return ExpoBanubaModule.selectAudio(audioURL, musicName, artistName);
}
