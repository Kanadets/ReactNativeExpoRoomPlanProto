import ExpoModulesCore
import QuickLook

public class ExpoRoomPlanModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoRoomPlan")

        Events("onScanComplete")

        AsyncFunction("checkAvailability") { () -> ExpoRoomPlanAvailability in
            return await getExpoRoomPlanAvailability()
        }

        AsyncFunction("readScanJson") { (path: String) -> String? in
            // Handle file:// prefix or raw path
            let cleanPath = path.replacingOccurrences(of: "file://", with: "")
            if FileManager.default.fileExists(atPath: cleanPath) {
                return try? String(contentsOfFile: cleanPath, encoding: .utf8)
            }
            return nil
        }

        AsyncFunction("previewScan") { (path: String) in
            // Ensure path is clean
            let cleanPath = path.replacingOccurrences(of: "file://", with: "")
            let url = URL(fileURLWithPath: cleanPath)
            
            // UI check on Main Thread
            DispatchQueue.main.async {
                // Ensure file actually exists before presenting
                if FileManager.default.fileExists(atPath: url.path) {
                    let previewController = QLPreviewController()
                    let dataSource = PreviewDataSource(url: url)
                    previewController.dataSource = dataSource
                    
                    if let currentVC = self.appContext?.utilities?.currentViewController() {
                        currentVC.present(previewController, animated: true)
                    }
                } else {
                    print("SWIFT: File does not exist at path \(url.path)")
                }
            }
        }

        View(ExpoRoomPlanView.self) {
            Prop("projectFolderPath") { (view: ExpoRoomPlanView, path: String) in
                view.projectFolderPath = path
            }
            Events("onScanProcessing")
        }
    }
}

private func getExpoRoomPlanAvailability() async -> ExpoRoomPlanAvailability {
    let availability = ExpoRoomPlanAvailability()
    if #available(iOS 17, *) {
        availability.isAvailable = true
        availability.deviceSupported = true
    } else {
        availability.availabilityReason = "Device doesn't support RoomPlan API."
    }
    return availability
}

class PreviewDataSource: NSObject, QLPreviewControllerDataSource {
    let url: URL
    init(url: URL) { self.url = url }
    func numberOfPreviewItems(in controller: QLPreviewController) -> Int { return 1 }
    func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { return url as QLPreviewItem }
}


