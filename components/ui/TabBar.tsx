import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Typography from '@/constants/Typography';

// Map route names to Ionicons
const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index:     { active: 'home',        inactive: 'home-outline'        },
  market:    { active: 'cart',        inactive: 'cart-outline'        },
  transport: { active: 'car',         inactive: 'car-outline'         },
  community: { active: 'people',      inactive: 'people-outline'      },
  profile:   { active: 'person',      inactive: 'person-outline'      },
};

const LABELS: Record<string, string> = {
  index:     'Home',
  market:    'Market',
  transport: 'Transport',
  community: 'Community',
  profile:   'Profile',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icons = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
        const label = LABELS[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}>
            {/* Active indicator dot */}
            <View style={[styles.activeDot, isFocused ? styles.activeDotVisible : styles.activeDotHidden]} />

            <Ionicons
              name={isFocused ? icons.active : icons.inactive}
              size={24}
              color={isFocused ? Colors.primary : Colors.placeholder}
            />
            <Text style={[styles.label, { color: isFocused ? Colors.primary : Colors.placeholder }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.inputBorder,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 52,
  },
  activeDot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  activeDotVisible: {
    backgroundColor: Colors.primary,
  },
  activeDotHidden: {
    backgroundColor: 'transparent',
  },
  label: {
    ...Typography.small,
    fontSize: 10,
  },
});
