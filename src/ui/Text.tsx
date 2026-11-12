import { StyleSheet, Text as RNText, type TextProps } from "react-native";
import { fontFamilyFor } from "@/theme/typography";

/** Texto con Inter: elige la familia según el `fontWeight` del estilo. */
export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, ...others } = flat;
  return <RNText {...rest} style={[{ fontFamily: fontFamilyFor(fontWeight) }, others]} />;
}
