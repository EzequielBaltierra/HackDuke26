import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

const TAB_ACTIVE = colors.bg;
const TAB_INACTIVE = colors.bgAccent;

/** Matches Figma home bar: feed, post, search, profile, leaderboard */
const TAB_ICONS = [
  'binoculars',
  'leaf',
  'search',
  'tree',
  'trophy',
] as const;

function TabIcon({ name, focused }: { name: (typeof TAB_ICONS)[number]; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <FontAwesome5
        name={name}
        size={22}
        color={focused ? TAB_ACTIVE : TAB_INACTIVE}
        solid
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.green,
          borderTopWidth: 2,
          borderTopColor: colors.greenAccent,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.redAccent,
        headerTitleStyle: type.navTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon name={TAB_ICONS[0]} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ focused }) => <TabIcon name={TAB_ICONS[1]} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon name={TAB_ICONS[2]} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={TAB_ICONS[3]} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused }) => <TabIcon name={TAB_ICONS[4]} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
