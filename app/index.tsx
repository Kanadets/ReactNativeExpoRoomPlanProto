import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExpoRoomPlanModule from "@/modules/ExpoRoomPlan";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check Availability on Mount
  useEffect(() => {
    ExpoRoomPlanModule.checkAvailability().then((status) => {
      setIsAvailable(status.isAvailable);
    });
  }, []);

  // Load Projects whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProjects(false);
    }, [])
  );

  const loadProjects = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const docUri = Paths.document.uri;

      const docDirectory = new Directory(docUri);
      const items = await docDirectory.list();

      const projectFolders = [];

      for (const item of items) {
        if (item.name.startsWith(".")) continue;

        if (item instanceof Directory) {
          projectFolders.push(item.name);
        }
      }

      setProjects(projectFolders.reverse());
    } catch (e) {
      console.error("Error loading projects", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateNewProject = () => {
    if (!isAvailable) {
      Alert.alert("Not Supported", "Your device does not support RoomPlan.");
      return;
    }

    // Generate a unique ID for the new folder
    const newProjectId = `Room_${Date.now()}`;

    // Navigate immediately. ScanDetails will create the folder.
    router.push(`/scan-details?projectId=${newProjectId}`);
  };

  const handleDeleteProject = (folderName: string) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete ${folderName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const uri = `${Paths.document.uri}${folderName}`;

              // Use the new Directory API instead of deprecated deleteAsync
              const directory = new Directory(uri);
              await directory.delete();

              loadProjects();
            } catch (e) {
              Alert.alert("Error", "Could not delete project");
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "model/vnd.usdz+zip",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      const newProjectId = `Import_${Date.now()}`;
      const newFolderUri = `${Paths.document.uri}${newProjectId}/`;

      const newDirectory = new Directory(newFolderUri);
      await newDirectory.create({ intermediates: true });

      const sourceFile = new File(file.uri);
      const destFile = new File(`${newFolderUri}MasterView.usdz`);
      await sourceFile.copy(destFile);

      loadProjects();
      Alert.alert("Success", "Imported into new project: " + newProjectId);
    } catch (e) {
      Alert.alert("Import Failed", String(e));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rooms</Text>
        <TouchableOpacity onPress={handleImport}>
          <Text style={styles.importText}>Import USDZ</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProjects(true)}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No projects found.</Text>
            <Text style={styles.emptySubText}>
              Create a new project to start scanning.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/scan-details?projectId=${item}`)}
            onLongPress={() => handleDeleteProject(item)}
          >
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 24 }}>🏠</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item}</Text>
              <Text style={styles.cardSubtitle}>Tap to open</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.fab, !isAvailable && { backgroundColor: "#ccc" }]}
          disabled={!isAvailable}
          onPress={handleCreateNewProject}
        >
          <Text style={styles.fabText}>+ New Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#E5E5EA",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#000" },
  importText: { fontSize: 16, color: "#007AFF" },
  listContent: { padding: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#000" },
  cardSubtitle: { fontSize: 14, color: "#8E8E93", marginTop: 2 },
  chevron: { fontSize: 24, color: "#C7C7CC", fontWeight: "300" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#333" },
  emptySubText: { fontSize: 14, color: "#888", marginTop: 8 },
  footer: {
    padding: 20,
    backgroundColor: "transparent",
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
