import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@/components/ui/app-logo";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/stores/authStore";

interface DashboardHeaderProps {
  locationLabel: string;
  notificationCount?: number;
}

export function DashboardHeader({
  locationLabel,
  notificationCount = 2,
}: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "F";
  const firstName = user?.name?.split(" ")[0] ?? "Farmer";

  return (
    <View style={s.container}>
      {/* Top row: avatar + greeting + notifications */}
      <View style={s.topRow}>
        {user ? (
          <View style={s.userSection}>
            {/* Avatar circle */}
            <View style={s.avatar}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
            <View>
              <Text style={s.greeting}>Good morning,</Text>
              <Text style={s.userName}>{firstName}</Text>
            </View>
          </View>
        ) : (
          <View style={s.userSection}>
            <AppLogo size={44} />
            <View>
              <Text style={s.greeting}>Welcome to</Text>
              <Text style={s.userName}>FarmBridge</Text>
            </View>
          </View>
        )}

        {/* Notifications + settings */}
        <View style={s.iconRow}>
          <Pressable
            style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.white}
            />
            {notificationCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Location bar */}
      <View style={s.locationRow}>
        <Ionicons name="location-sharp" size={14} color={Colors.accentLight} />
        <Text style={s.locationText}>{locationLabel}</Text>
        <View style={s.onlineDot} />
        <Text style={s.onlineText}>Online</Text>
      </View>

      {/* Auth buttons for guests */}
      {!user && (
        <View style={s.authRow}>
          <Link href="/(auth)/login" asChild>
            <Pressable
              style={({ pressed }) => [
                s.authBtnOutline,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={s.authBtnOutlineText}>Login</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/register" asChild>
            <Pressable
              style={({ pressed }) => [
                s.authBtnSolid,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={s.authBtnSolidText}>Register</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    // Subtle gradient effect via a bottom shadow
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  // Top row
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  userSection: { flexDirection: "row", alignItems: "center", gap: 12 },

  // Avatar
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 20, fontWeight: "800", color: "#fff" },
  avatarEmoji: { fontSize: 22 },

  // Greeting
  greeting: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 1 },
  userName: { fontSize: 18, fontWeight: "800", color: "#fff" },

  // Icon row
  iconRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Notification badge
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#fff" },

  // Location
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  locationText: { fontSize: 12, color: "rgba(255,255,255,0.85)" },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentLight,
    marginLeft: 6,
  },
  onlineText: { fontSize: 11, color: Colors.accentLight, fontWeight: "600" },

  // Auth buttons
  authRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  authBtnOutline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
  },
  authBtnOutlineText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  authBtnSolid: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  authBtnSolidText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
});
