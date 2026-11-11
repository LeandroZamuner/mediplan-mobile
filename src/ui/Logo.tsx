import { SvgXml } from "react-native-svg";
import { LOGO_SVG } from "./logo-svg";

export function Logo({ width = 120 }: { width?: number }) {
  return <SvgXml xml={LOGO_SVG} width={width} height={(width * 36) / 191} />;
}
