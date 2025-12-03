import { Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExpoRoomPlanModule from "@/modules/ExpoRoomPlan";

export default function ScanDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { scanPath } = useLocalSearchParams<{ scanPath: string }>();

  const [jsonData, setJsonData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [paths, setPaths] = useState<{ model: string; json: string } | null>(
    null
  );

  useEffect(() => {
    if (scanPath) {
      const fileName = scanPath.split("/").pop();
      if (!fileName) return;

      const baseName = fileName.replace(".json", "").replace(".usdz", "");

      const safeDocPath = Paths.document.uri;

      if (safeDocPath) {
        const newPaths = {
          model: `${safeDocPath}${baseName}.usdz`,
          json: `${safeDocPath}${baseName}.json`,
        };

        console.log("Reconstructed Path:", newPaths.model);
        setPaths(newPaths);
      } else {
        console.error("Paths.document.uri is null");
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

  const handleExportJson = async () => {
    if (!paths?.json) {
      Alert.alert("Error", "JSON file path not available");
      return;
    }

    try {
      const fileName = paths.json.split("/").pop() || "scan.json";

      const fileUri = paths.json.startsWith("file://")
        ? paths.json
        : `file://${paths.json}`;

      await Share.share({
        url: fileUri,
        title: `Export ${fileName}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", `Failed to export JSON: ${error}`);
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
      {/* TODO: Add 3D model viewer */}
      {/* JSON Data Section */}
      <ScrollView style={styles.content}>
        <View style={styles.metadataHeader}>
          <Text
            style={[styles.sectionTitle, { marginLeft: 15, marginTop: 15 }]}
          >
            Metadata
          </Text>
          {!loading && paths?.json && (
            <TouchableOpacity
              onPress={handleExportJson}
              style={styles.exportButton}
            >
              <Text style={styles.exportButtonText}>Export JSON</Text>
            </TouchableOpacity>
          )}
        </View>

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
  metadataHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 15,
  },
  exportButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 15,
  },
  exportButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
