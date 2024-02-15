import ExpoBanubaModule from "./ExpoBanubaModule";

export async function initVideoEditor(licenseKey: string): Promise<null> {
  return ExpoBanubaModule.initVideoEditor(licenseKey);
}

export async function openVideoEditor(): Promise<void> {
  return ExpoBanubaModule.openVideoEditor();
}
