import ExpoBanubaModule from "./ExpoBanubaModule";

type ExportedVideo = {
  thumbnail: string;
  video: string;
};

export async function initVideoEditor(
  licenseKey: string,
): Promise<null | ExportedVideo> {
  const response = await ExpoBanubaModule.initVideoEditor(licenseKey);
  if (!response) {
    return null;
  }
  return JSON.parse(response) as ExportedVideo;
}

export async function openVideoEditor(): Promise<void> {
  return ExpoBanubaModule.openVideoEditor();
}
