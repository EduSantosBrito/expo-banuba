import { ConfigPlugin, createRunOncePlugin } from "@expo/config-plugins";

import { withAndroid } from "./android";
import { withIos } from "./ios";

const pkg = require("../../package.json");

export type BanubaPluginProps = {
  android: {
    assetsPath: string;
  };
  ios: {
    assetsPath: string;
  };
};

const withBanuba: ConfigPlugin<BanubaPluginProps> = (
  config,
  { android, ios },
) => {
  config = withAndroid(config, android);
  config = withIos(config, ios);
  return config;
};

export default createRunOncePlugin(withBanuba, pkg.name, pkg.version);
