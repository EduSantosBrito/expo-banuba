import {
  createGeneratedHeaderComment,
  mergeContents,
} from "@expo/config-plugins/build/utils/generateCode";
import { ExpoConfig } from "@expo/config-types";
import {
  IOSConfig,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} from "expo/config-plugins";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { basename, join, resolve } from "path";

import copyFolderRecursiveSync from "./utils/copyFolderRecursiveSync";
import { BanubaPluginProps } from "./withBanuba";

const MUSIC_LIBRARY_USAGE =
  "Allow $(PRODUCT_NAME) to access your music library";
const MICROPHONE_USAGE = "Allow $(PRODUCT_NAME) to access your microphone";
const CAMERA_USAGE = "Allow $(PRODUCT_NAME) to access your camera";
const PHOTO_LIBRARY_USAGE =
  "Allow $(PRODUCT_NAME) to access your photo library";

const sources = `
source 'https://github.com/Banuba/specs.git'
source 'https://github.com/CocoaPods/Specs.git'
source 'https://github.com/sdk-banuba/banuba-sdk-podspecs.git'
\n
`;

const withSource = (config: ExpoConfig): ExpoConfig => {
  return withDangerousMod(config, [
    "ios",
    (modConfig) => {
      if (modConfig.modRequest.platform === "ios") {
        const { platformProjectRoot } = modConfig.modRequest;
        const podfile = resolve(platformProjectRoot, "Podfile");
        const contents = readFileSync(podfile, "utf-8");
        const newContent = sources;
        const tag = "expo-banuba-source";
        const header = createGeneratedHeaderComment(newContent, tag, "#");
        if (!contents.includes(header)) {
          const mergedSource = mergeContents({
            tag,
            src: contents,
            newSrc: newContent,
            anchor: "flipper_config = FlipperConfiguration.disabled",
            offset: 0,
            comment: "#",
          });
          writeFileSync(podfile, mergedSource.contents);
        }
      }
      return modConfig;
    },
  ]);
};

const withAssets = (config: ExpoConfig, assetsPath: string): ExpoConfig => {
  return withXcodeProject(config, (modConfig) => {
    const sourceRoot = IOSConfig.Paths.getSourceRoot(
      modConfig.modRequest.projectRoot
    );
    const projectName = modConfig.modRequest.projectName as string;

    const paths: { source: string; destination: string }[] = [
      {
        source: join(assetsPath, "Assets.xcassets"),
        destination: join(sourceRoot, "Assets.xcassets"),
      },
      {
        source: join(assetsPath, "luts"),
        destination: join(sourceRoot, "luts"),
      },
      {
        source: join(assetsPath, "en.lproj"),
        destination: join(sourceRoot, "en.lproj"),
      },
    ];

    for (const { source, destination } of paths) {
      const fileName = basename(source);
      if (!existsSync(destination)) {
        mkdirSync(destination);
      }
      copyFolderRecursiveSync(source, destination);
      if (!modConfig.modResults.hasFile(`${projectName}/${fileName}`)) {
        modConfig.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
          filepath: `${projectName}/${fileName}`,
          groupName: projectName,
          isBuildFile: true,
          project: modConfig.modResults,
        });
      }
    }
    return modConfig;
  });
};

const withPermissions = (config: ExpoConfig): ExpoConfig => {
  return withInfoPlist(config, (modConfig) => {
    modConfig.modResults.NSAppleMusicUsageDescription =
      modConfig.modResults.NSAppleMusicUsageDescription || MUSIC_LIBRARY_USAGE;
    modConfig.modResults.NSMicrophoneUsageDescription =
      modConfig.modResults.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
    modConfig.modResults.NSCameraUsageDescription =
      modConfig.modResults.NSCameraUsageDescription || CAMERA_USAGE;
    modConfig.modResults.NSPhotoLibraryUsageDescription =
      modConfig.modResults.NSPhotoLibraryUsageDescription ||
      PHOTO_LIBRARY_USAGE;
    return modConfig;
  });
};
export const withIos = (
  config: ExpoConfig,
  iosProps: BanubaPluginProps["ios"]
): ExpoConfig => {
  config = withSource(config);
  config = withAssets(config, iosProps.assetsPath);
  config = withPermissions(config);
  return config;
};
