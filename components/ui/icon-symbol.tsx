import { LucideIcon } from 'lucide-react-native';
import { OpaqueColorValue, StyleProp, View, ViewStyle } from 'react-native';

export function IconSymbol({
  icon: Icon,
  size = 24,
  color,
  style,
}: {
  icon: LucideIcon;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Icon size={size} color={color as string} />
    </View>
  );
}
