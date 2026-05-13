import { View, Text, Pressable, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Truck,
  Package,
  ArrowRightLeft,
  Shield,
  Settings,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { getTabsForSession } from '../constants/roles';

import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ProjectsScreen from '../screens/Projects/ProjectsScreen';
import POScreen from '../screens/PurchaseOrders/POScreen';
import DeliveriesScreen from '../screens/Deliveries/DeliveriesScreen';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import TransfersScreen from '../screens/Transfers/TransfersScreen';
import AdminScreen from '../screens/Admin/AdminScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();

const fallbackStyles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  body: { fontSize: 15, color: '#475569', marginBottom: 20 },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});

function NoTabsFallback() {
  const { logout } = useAuth();
  return (
    <View style={fallbackStyles.box}>
      <Text style={fallbackStyles.title}>No tabs</Text>
      <Text style={fallbackStyles.body}>Sign out and try again.</Text>
      <Pressable style={fallbackStyles.btn} onPress={() => logout()}>
        <Text style={fallbackStyles.btnText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const TAB_CONFIG = [
  {
    name: 'Dashboard',
    component: DashboardScreen,
    Icon: LayoutDashboard,
  },
  {
    name: 'Projects',
    component: ProjectsScreen,
    Icon: FolderKanban,
  },
  {
    name: 'POs',
    component: POScreen,
    Icon: FileText,
  },
  {
    name: 'Deliveries',
    component: DeliveriesScreen,
    Icon: Truck,
  },
  {
    name: 'Inventory',
    component: InventoryScreen,
    Icon: Package,
  },
  {
    name: 'Transfers',
    component: TransfersScreen,
    Icon: ArrowRightLeft,
  },
  {
    name: 'Admin',
    component: AdminScreen,
    Icon: Shield,
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    Icon: Settings,
  },
];

export default function TabNavigator() {
  const { session, canManageUsers } = useAuth();

  const tabs = getTabsForSession({ ...session, canManageUsers });
  const allowed = new Set(tabs);
  const visible = TAB_CONFIG.filter((t) => allowed.has(t.name));

  if (visible.length === 0) {
    return <NoTabsFallback />;
  }

  return (
    <Tab.Navigator
      style={{ flex: 1 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {visible.map(({ name, component, Icon }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
