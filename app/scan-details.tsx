import { Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExpoRoomPlanModule, {
  ExpoRoomPlanModelView,
} from "@/modules/ExpoRoomPlan";

export default function ScanDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // This usually comes in as ".../Documents/MyRoom.usdz" or ".../Documents/MyRoom.json"
  // Note: This path might be "stale" (from a previous app session), so we only use the filename.
  const { scanPath } = useLocalSearchParams<{ scanPath: string }>();

  const [jsonData, setJsonData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // We calculate the correct paths for both files
  const [paths, setPaths] = useState<{ model: string; json: string } | null>(
    null
  );

  useEffect(() => {
    if (scanPath) {
      // 1. Extract just the filename (e.g., "5B18...8582.usdz")
      const fileName = scanPath.split("/").pop();
      if (!fileName) return;

      // 2. Remove extension to get the unique ID
      const baseName = fileName.replace(".json", "").replace(".usdz", "");

      // 3. Reconstruct the path using Expo's SAFE document directory constant.
      // Paths.document.uri is guaranteed to be valid for the current session.
      const safeDocPath = Paths.document.uri;

      if (safeDocPath) {
        // Construct the new "Fresh" paths
        // Note: safeDocPath always ends with a '/', so we don't add another one.
        const newPaths = {
          model: `${safeDocPath}${baseName}.usdz`,
          json: `${safeDocPath}${baseName}.json`,
        };

        console.log("📍 Reconstructed Path:", newPaths.model);
        setPaths(newPaths);
      } else {
        console.error("❌ Paths.document.uri is null");
      }
    }
  }, [scanPath]);

  useEffect(() => {
    if (paths?.json) {
      loadJsonData(paths.json);
    }
  }, [paths]);

  const loadJsonData = async (path: string) => {
    try {
      setLoading(true);
      const json = await ExpoRoomPlanModule.readScanJson(path);
      if (json) {
        try {
          const parsed = JSON.parse(json);
          setJsonData(JSON.stringify(parsed, null, 2));
        } catch {
          setJsonData(json);
        }
      } else {
        setJsonData("No JSON data found.");
      }
    } catch (e) {
      setJsonData("Error loading JSON.");
      console.log("JSON Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fileName = scanPath?.split("/").pop() || "Unknown";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{fileName}</Text>
        <Text style={styles.filePath} numberOfLines={1}>
          {paths?.model || "Locating file..."}
        </Text>
      </View>

      {/* 3D Model Section */}
      {paths?.model && (
        <View style={styles.modelViewerContainer}>
          <Text style={styles.sectionTitle}>3D Model</Text>
          <View style={styles.modelViewer}>
            <ExpoRoomPlanModelView
              modelPath={paths.model}
              style={styles.modelView}
            />
          </View>
        </View>
      )}

      {/* JSON Data Section */}
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { marginLeft: 15, marginTop: 15 }]}>
          Metadata
        </Text>
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            size="small"
            color="#007AFF"
          />
        ) : (
          <View style={styles.jsonContainer}>
            <Text style={styles.jsonText} selectable>
              {jsonData}
            </Text>
          </View>
        )}
      </ScrollView>
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
  title: { fontSize: 18, fontWeight: "600" },
  fileInfo: {
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  fileName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  filePath: { fontSize: 12, color: "#888" },
  modelViewerContainer: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  modelViewer: {
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  modelView: { flex: 1 },
  content: { flex: 1 },
  jsonContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    margin: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  jsonText: { fontFamily: "monospace", fontSize: 12, color: "#333" },
});
