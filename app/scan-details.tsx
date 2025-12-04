import { Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
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

  console.log("scanPath", scanPath);

  useEffect(() => {
    if (scanPath) {
      const fileName = scanPath.split("/").pop();
      if (!fileName) return;

      const baseName = fileName.replace(".json", "").replace(".usdz", "");
      const safeDocPath = Paths.document.uri;

      if (safeDocPath) {
        setPaths({
          model: `${safeDocPath}${baseName}.usdz`,
          json: `${safeDocPath}${baseName}.json`,
        });
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

          // --- CHANGE 1: Remove the heavy "coreModel" data ---
          if (parsed.coreModel) {
            delete parsed.coreModel;
            // Optional: Add a note so you know it was removed
            parsed["_NOTE_"] = "coreModel removed for display performance";
          }

          // Re-stringify the cleaner object
          setJsonData(JSON.stringify(parsed, null, 2));
        } catch (parseError) {
          console.log("JSON Parse Error:", parseError);
          // If parsing fails, fall back to raw text (truncated just in case)
          setJsonData(json.slice(0, 1000) + "\n... (JSON Parse Failed)");
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "80%",
          }}
        >
          <Text style={styles.fileName}>{fileName}</Text>
          <Button
            title="Preview"
            onPress={() => ExpoRoomPlanModule.previewScan(scanPath)}
          />
        </View>
        <Text style={styles.filePath} numberOfLines={1}>
          {paths?.model || "Locating file..."}
        </Text>
      </View>

      <View style={styles.metadataHeader}>
        <Text style={[styles.sectionTitle, { marginLeft: 15, marginTop: 15 }]}>
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            size="small"
            color="#007AFF"
          />
        ) : (
          <View style={styles.jsonContainer}>
            {/* --- CHANGE 2: Removed slice() to show full content --- */}
            <Text style={styles.jsonText} selectable>
              {jsonData || "No data loaded"}
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
    width: "100%",
  },
  fileName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  filePath: { fontSize: 12, color: "#888" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  content: { flex: 1 },
  jsonContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    margin: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  jsonText: {
    // Kept the fix for iOS fonts
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: "#333",
  },
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
