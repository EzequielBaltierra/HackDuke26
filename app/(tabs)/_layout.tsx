import { Tabs } from 'expo-router';
import { Dimensions, View } from 'react-native';
import { TabBarIcon } from '../../src/components/icons/TabBarIcon';
import { colors } from '../../src/theme/colors';

function tabIcon(
  icon: 'binoculars' | 'trophy' | 'leaf' | 'magnifyingGlass' | 'tree',
  focused: boolean,
) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', opacity: focused ? 1 : 0.55 }}>
      <TabBarIcon
        name={icon}
        color={focused ? colors.tabIconActive : colors.tabIconInactive}
        size={26}
      />
    </View>
  );
}

/** Screenshot order: Feed → Leaderboard → Post → Search → Profile */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          width: Dimensions.get('window').width,
          alignSelf: 'stretch',
          backgroundColor: colors.greenBase,
          borderTopWidth: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: colors.tabIconActive,
        tabBarInactiveTintColor: colors.tabIconInactive,
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: colors.greenBase }} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => tabIcon('binoculars', focused),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused }) => tabIcon('trophy', focused),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ focused }) => tabIcon('leaf', focused),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => tabIcon('magnifyingGlass', focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => tabIcon('tree', focused),
        }}
      />
    </Tabs>
  );
}
