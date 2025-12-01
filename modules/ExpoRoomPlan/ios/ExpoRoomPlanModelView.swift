import ExpoModulesCore
import QuickLook
import UIKit

class ExpoRoomPlanModelView: ExpoView {
    private var previewController: QLPreviewController?
    private var currentDataSource: ModelPreviewDataSource?
    
    var modelPath: String? {
        didSet {
            if window != nil {
                DispatchQueue.main.async { self.updateModelView() }
            }
        }
    }
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        clipsToBounds = true
        // DEBUG: Set base view to RED to see if it's even rendering
        self.backgroundColor = UIColor.red.withAlphaComponent(0.1)
    }
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            updateModelView()
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        // Ensure child fills the view
        previewController?.view.frame = bounds
    }
    
    private func updateModelView() {
        guard let modelPath = modelPath, !modelPath.isEmpty else {
            clearPreview()
            return
        }
        
        // 1. Handle URI encoded spaces if present
        var cleanPath = modelPath.replacingOccurrences(of: "file://", with: "")
        cleanPath = cleanPath.removingPercentEncoding ?? cleanPath
        
        // 2. CHECK FILE EXISTENCE & SIZE
        let fileManager = FileManager.default
        if !fileManager.fileExists(atPath: cleanPath) {
            print("❌ [ExpoRoomPlan] File DOES NOT EXIST at: \(cleanPath)")
            return
        }
        
        do {
            let attr = try fileManager.attributesOfItem(atPath: cleanPath)
            let size = attr[.size] as? Int64 ?? 0
            print("✅ [ExpoRoomPlan] Loading file. Size: \(size) bytes")
            
            if size == 0 {
                print("⚠️ [ExpoRoomPlan] File is empty (0 bytes)")
                return
            }
        } catch {
            print("❌ [ExpoRoomPlan] Error checking file attributes: \(error)")
        }
        
        let fileURL = URL(fileURLWithPath: cleanPath)
        loadPreview(url: fileURL)
    }
    
    private func loadPreview(url: URL) {
        if let current = currentDataSource, current.url == url, previewController != nil { return }
        clearPreview()
        
        let dataSource = ModelPreviewDataSource(url: url)
        self.currentDataSource = dataSource
        
        let controller = QLPreviewController()
        controller.dataSource = dataSource
        
        // DEBUG: Set controller background to GREEN
        controller.view.backgroundColor = UIColor.green.withAlphaComponent(0.1)
        
        guard let parentVC = self.findViewController() else { return }
        
        parentVC.addChild(controller)
        addSubview(controller.view)
        
        // Set frame immediately AND force layout
        controller.view.frame = bounds
        controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        controller.didMove(toParent: parentVC)
        self.previewController = controller
        
        // Force a layout pass to ensure visibility
        self.setNeedsLayout()
        self.layoutIfNeeded()
    }
    
    private func clearPreview() {
        previewController?.willMove(toParent: nil)
        previewController?.view.removeFromSuperview()
        previewController?.removeFromParent()
        previewController = nil
        currentDataSource = nil
    }

    private func findViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while let nextResponder = responder?.next {
            if let viewController = nextResponder as? UIViewController {
                return viewController
            }
            responder = nextResponder
        }
        return nil
    }
}

// Data Source Class handles providing the item to the controller
class ModelPreviewDataSource: NSObject, QLPreviewControllerDataSource {
    let url: URL
    init(url: URL) { self.url = url }
    
    func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
        return 1
    }
    
    func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
        return url as QLPreviewItem
    }
}
