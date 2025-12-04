import { Directory, File, Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExpoRoomPlanModule, {
  ExpoRoomPlanScanResult,
  ExpoRoomPlanView,
} from "@/modules/ExpoRoomPlan";

export default function ScanDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const safeProjectId = projectId || "MyDefaultProject";

  // PATHS
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [masterViewPath, setMasterViewPath] = useState<string | null>(null);

  // DATA
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomCount, setRoomCount] = useState(0);

  const loadJsonData = async (path: string) => {
    try {
      setLoading(true);
      const json = await ExpoRoomPlanModule.readScanJson(path);
      if (json) {
        const parsed = JSON.parse(json);
        if (parsed.coreModel) delete parsed.coreModel;
        setJsonData(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      setJsonData("Error loading JSON");
    } finally {
      setLoading(false);
    }
  };

  // SETUP FOLDER
  useEffect(() => {
    const setupFolder = async () => {
      const folderUri = `${Paths.document.uri}${safeProjectId}/`;
      const dir = new Directory(folderUri);
      if (!dir.exists) {
        await dir.create({ intermediates: true });
      }

      // Store clean path for Swift
      const cleanPath = folderUri.replace("file://", "");
      setProjectPath(cleanPath);
      setMasterViewPath(`${cleanPath}MasterView.usdz`);
    };

    setupFolder();
  }, [safeProjectId]);

  // LOAD EXISTING SCANS
  useEffect(() => {
    const loadExistingScans = async () => {
      if (!projectPath) return;

      try {
        setLoading(true);
        const folderUri = `${Paths.document.uri}${safeProjectId}/`;
        const dir = new Directory(folderUri);

        if (!dir.exists) {
          setLoading(false);
          return;
        }

        const items = await dir.list();
        const jsonFiles: File[] = [];
        let masterViewExists = false;

        for (const item of items) {
          if (item instanceof File) {
            if (item.name.endsWith(".json")) {
              jsonFiles.push(item);
            } else if (item.name === "MasterView.usdz") {
              masterViewExists = true;
            }
          }
        }

        // Set room count based on JSON files found
        setRoomCount(jsonFiles.length);

        // Set masterViewPath if MasterView.usdz exists
        if (!masterViewExists) {
          setMasterViewPath(null);
        }

        // Load the last JSON file (most likely the most recent)
        // Since we can't easily get modification time with the new API,
        // we'll just load the last file from the list
        if (jsonFiles.length > 0) {
          const lastJsonFile = jsonFiles[jsonFiles.length - 1];
          const jsonPath = lastJsonFile.uri.replace("file://", "");
          await loadJsonData(jsonPath);
        }
      } catch (e) {
        console.error("Error loading existing scans:", e);
      } finally {
        setLoading(false);
      }
    };

    loadExistingScans();
  }, [projectPath, safeProjectId]);

  // LISTEN FOR EVENTS
  useEffect(() => {
    const subscription = ExpoRoomPlanModule.addListener(
      "onScanComplete",
      (event: ExpoRoomPlanScanResult) => {
        console.log("Scan Complete Event:", event);
        onScanComplete(event);
      }
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const onScanComplete = (event: ExpoRoomPlanScanResult) => {
    console.log("Scan Complete Payload:", event);
    const { usdzUri, jsonUri, totalRooms, error } = event;

    if (error) {
      alert(`Error: ${error}`);
      setScanning(false);
      return;
    }

    if (totalRooms) setRoomCount(totalRooms);

    // Update the master path from the event, just in case
    if (usdzUri) {
      setMasterViewPath(usdzUri);
    }

    if (jsonUri) loadJsonData(jsonUri);

    setScanning(false);
  };

  const handlePreview = () => {
    if (masterViewPath) {
      const cleanPath = masterViewPath.replace("file://", "");
      console.log("Previewing Path:", cleanPath);
      ExpoRoomPlanModule.previewScan(cleanPath);
    } else {
      alert("No MasterView.usdz found yet.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {safeProjectId}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.fileInfo}>
        <View style={styles.row}>
          <View>
            <Text style={styles.fileName}>
              {roomCount > 0 ? `${roomCount} Rooms in Project` : "No scans yet"}
            </Text>
            <Text style={styles.filePath}>MasterView.usdz</Text>
          </View>

          <Button title="Preview Full House" onPress={handlePreview} />
        </View>
      </View>

      <View style={{ padding: 15 }}>
        <Button
          title={roomCount > 0 ? "Scan Another Room" : "Start First Scan"}
          onPress={() => setScanning(true)}
        />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.jsonContainer}>
            <Text style={styles.jsonTitle}>Last Scanned Room Data:</Text>
            <Text style={styles.jsonText} selectable>
              {jsonData || "Scan a room to see details..."}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={scanning}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setScanning(false)}
      >
        {projectPath && (
          <ExpoRoomPlanView
            style={{ flex: 1 }}
            projectFolderPath={projectPath}
            onScanProcessing={() => console.log("Scan Processing")}
          />
        )}
        <View style={styles.overlay}>
          <Button title="Cancel Scan" onPress={() => setScanning(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: "#007AFF" },
  title: { fontSize: 18, fontWeight: "600", maxWidth: 200 },
  fileInfo: {
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fileName: { fontSize: 16, fontWeight: "600" },
  filePath: { fontSize: 12, color: "#888", marginTop: 4 },
  content: { flex: 1 },
  jsonContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    margin: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  jsonTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  jsonText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10,
    color: "#333",
  },
  overlay: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
