import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withProjectBuildGradle,
} from "@expo/config-plugins";
import {
  MergeResults,
  createGeneratedHeaderComment,
  removeGeneratedContents,
} from "@expo/config-plugins/build/utils/generateCode";
import { ExpoConfig } from "@expo/config-types";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

import { BanubaPluginProps } from "./withBanuba";
import copyFolderRecursiveSync from "./utils/copyFolderRecursiveSync";

// Because we need the package to be added AFTER the React and Google maven packages, we create a new allprojects.
// It's ok to have multiple allprojects.repositories, so we create a new one since it's cheaper than tokenizing
// the existing block to find the correct place to insert our camera maven.
const gradleMaven = `
allprojects {
    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/Banuba/banuba-ve-sdk")
            credentials {
                username = "Banuba"
                password = "\u0038\u0036\u0032\u0037\u0063\u0035\u0031\u0030\u0033\u0034\u0032\u0063\u0061\u0033\u0065\u0061\u0031\u0032\u0034\u0064\u0065\u0066\u0039\u0062\u0034\u0030\u0063\u0063\u0037\u0039\u0038\u0063\u0038\u0038\u0066\u0034\u0031\u0032\u0061\u0038"
            }
        }
        maven {
            name = "ARCloudPackages"
            url = uri("https://maven.pkg.github.com/Banuba/banuba-ar")
            credentials {
                username = "Banuba"
                password = "\u0038\u0036\u0032\u0037\u0063\u0035\u0031\u0030\u0033\u0034\u0032\u0063\u0061\u0033\u0065\u0061\u0031\u0032\u0034\u0064\u0065\u0066\u0039\u0062\u0034\u0030\u0063\u0063\u0037\u0039\u0038\u0063\u0038\u0038\u0066\u0034\u0031\u0032\u0061\u0038"
            }
        }
    }
}
`;

const banubaSdkVersion = "1.33.2";
const gradleImplements = `
  dependencies {
    implementation "com.banuba.sdk:ffmpeg:5.1.3"
    implementation "com.banuba.sdk:camera-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:camera-ui-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:core-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:core-ui-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-flow-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-timeline-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-ui-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-gallery-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-effects-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:effect-player-adapter:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-audio-browser-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ar-cloud:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-export-sdk:${banubaSdkVersion}"
    implementation "com.banuba.sdk:ve-playback-sdk:${banubaSdkVersion}"
  }  
  `;

const theme = `
<resources>
    <style name="Theme.Banuba" parent="Theme.MaterialComponents.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/surfaceDark</item>
        <item name="colorOnPrimary">@color/primaryBrandLight</item>
        <item name="colorSecondary">@color/primaryBrandDarkOpacity50</item>
        <item name="colorOnSecondary">@color/primaryBrandLight</item>
        <item name="android:statusBarColor">?attr/colorPrimary</item>
    </style>

    <!-- Extend VideoCreationTheme style to customize Video Editor appearance for your app.
         Specify your style in AndroidManifest.xml file for VideoCreationActivity. -->
    <style name="BanubaAppTheme" parent="VideoCreationTheme">
        <item name="android:windowBackground">@color/backgroundGlobalPrimary</item>

        <!-- WARNING: Here are the styles for Gallery module (ve-gallery-sdk). Gallery is
         an Optional module. Add these styles in the app if you use
          default SDK Gallery implementation -->
        <item name="galleryAlbumBlurViewStyle">@style/GalleryAlbumBlurViewStyle</item>
        <item name="galleryItemRadioButtonStyle">@style/GalleryItemRadioButtonStyle</item>
        <item name="galleryItemTextStyle">@style/GalleryItemTextStyle</item>
        <item name="selectedGalleryItemTextStyle">@style/SelectedGalleryItemTextStyle</item>
        <item name="galleryTitleTextStyle">@style/GalleryTitleTextStyle</item>
        <item name="galleryAlbumTitleTextStyle">@style/GalleryAlbumTitleTextStyle</item>
        <item name="galleryAlbumDescTextStyle">@style/GalleryAlbumDescTextStyle</item>
        <item name="galleryEmptyTextStyle">@style/GalleryEmptyTextStyle</item>
        <item name="galleryBackButtonStyle">@style/GalleryBackButtonStyle</item>
        <item name="galleryNextButtonStyle">@style/GalleryNextButtonStyle</item>
        <item name="galleryAutoCutNextButtonStyle">@style/GalleryAutoCutNextButtonStyle</item>
        <item name="galleryAutoCutButtonStyle">@style/GalleryAutoCutButtonStyle</item>
        <item name="gallerySelectionDescriptionStyle">@style/GallerySelectionDescriptionStyle
        </item>
        <item name="galleryNextParentStyle">@style/GalleryNextParentStyle</item>
        <item name="galleryImageViewStyle">@style/GalleryImageViewStyle</item>
        <item name="galleryColumnsNumber">wrap_content</item>
        <item name="galleryTabLayoutStyle">@style/GalleryTabLayoutStyle</item>
        <item name="galleryTabTextColors">@color/gallery_tab_color_state_list</item>

        <item name="gallery_bg_color">@color/black</item>
        <item name="gallery_item_corner_radius">0dp</item>
        <item name="gallery_item_margin">0.5dp</item>
        <item name="gallery_album_divider_color">@color/transparent</item>

        <item name="previewActionButtonStyle">@style/PreviewActionButtonStyle</item>
        <item name="previewContainerStyle">@style/PreviewContainerStyle</item>
    </style>
</resources>
`;

// Fork of config-plugins mergeContents, but appends the contents to the end of the file.
export function appendContents({
  src,
  newSrc,
  tag,
  comment,
}: {
  src: string;
  newSrc: string;
  tag: string;
  comment: string;
}): MergeResults {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    const contentsToAdd = [
      "",
      // @something
      header,
      // contents
      newSrc,
      // @end
      `${comment} @generated end ${tag}`,
    ].join("\n");

    return {
      contents: sanitizedTarget ?? src + contentsToAdd,
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
}

const valuesFolderPath = ["app", "src", "main", "res", "values"];

const withTheme: ConfigPlugin = (config): ExpoConfig => {
  return withDangerousMod(config, [
    "android",
    (modConfig) => {
      if (modConfig.modRequest.platform === "android") {
        const androidValuesPath = join(
          modConfig.modRequest.platformProjectRoot,
          ...valuesFolderPath
        );

        const targetPath = join(androidValuesPath, "themes.xml");
        if (existsSync(targetPath)) {
          unlinkSync(targetPath);
        }
        writeFileSync(targetPath, theme);
      }
      return modConfig;
    },
  ]);
};

const assetsFolderPath = ["app", "src", "assets"];

const withAssets = (config: ExpoConfig, assetsPath: string): ExpoConfig => {
  return withDangerousMod(config, [
    "android",
    (modConfig) => {
      if (modConfig.modRequest.platform === "android") {
        const androidAssetsPath = join(
          modConfig.modRequest.platformProjectRoot,
          ...assetsFolderPath
        );
        copyFolderRecursiveSync(assetsPath, androidAssetsPath);
      }
      return modConfig;
    },
  ]);
};

function addImport(src: string): MergeResults {
  return appendContents({
    tag: "expo-banuba-import",
    src,
    newSrc: gradleMaven,
    comment: "//",
  });
}

const withRootGradle: ConfigPlugin = (config): ExpoConfig => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addImport(
        config.modResults.contents
      ).contents;
    } else {
      throw new Error(
        "Cannot add banuba maven gradle because the build.gradle is not groovy"
      );
    }
    return config;
  });
};

function addImplements(src: string): MergeResults {
  return appendContents({
    tag: "expo-banuba-implements",
    src,
    newSrc: gradleImplements,
    comment: "//",
  });
}

const banubaPluginKotlinParcelize = `
  apply plugin: "org.jetbrains.kotlin.plugin.parcelize"
`;

const banubaPluginKotlinAndroid = `
  apply plugin: "org.jetbrains.kotlin.android"
  apply plugin: "org.jetbrains.kotlin.plugin.parcelize"
`;

function addPlugins(src: string, includesKotlinAndroid = false): MergeResults {
  return appendContents({
    tag: "expo-banuba-plugin",
    src,
    newSrc: includesKotlinAndroid
      ? banubaPluginKotlinParcelize
      : banubaPluginKotlinAndroid,
    comment: "//",
  });
}

const withAppGradle: ConfigPlugin = (config): ExpoConfig => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addImplements(
        config.modResults.contents
      ).contents;
      if (
        !config.modResults.contents.includes(
          "org.jetbrains.kotlin.plugin.parcelize"
        )
      ) {
        config.modResults.contents = addPlugins(
          config.modResults.contents,
          config.modResults.contents.includes("org.jetbrains.kotlin.android")
        ).contents;
      }
    } else {
      throw new Error(
        "Cannot add banuba maven gradle because the build.gradle is not groovy"
      );
    }
    return config;
  });
};

const withManifest: ConfigPlugin = (config): ExpoConfig => {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );

    app.$["xmlns:tools"] = "http://schemas.android.com/tools";

    const hasVideoCreationActivity = app.activity?.find(
      (activity) =>
        activity.$["android:name"] ===
        "com.banuba.sdk.ve.flow.VideoCreationActivity"
    );

    const VideoCreationActivity = {
      $: {
        "android:name": "com.banuba.sdk.ve.flow.VideoCreationActivity",
        "android:screenOrientation": "portrait",
        "android:theme": "@style/BanubaAppTheme",
        "android:windowSoftInputMode": "adjustResize",
        "tools:replace": "android:theme",
        "tools:ignore": "LockedOrientationActivity",
      },
    };

    if (!hasVideoCreationActivity) {
      app.activity?.push(VideoCreationActivity);
    }

    return config;
  });
};

export const withAndroid = (
  config: ExpoConfig,
  androidProps: BanubaPluginProps["android"]
): ExpoConfig => {
  config = withRootGradle(config);
  config = withAppGradle(config);
  config = withManifest(config);
  config = withAssets(config, androidProps.assetsPath);
  config = withTheme(config);
  config = AndroidConfig.Permissions.withPermissions(config, [
    "android.permission.CAMERA",
    "android.permission.RECORD_AUDIO",
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.INTERNET",
  ]);
  return config;
};
