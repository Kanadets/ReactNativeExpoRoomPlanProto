import ExpoModulesCore
import RoomPlan
import UIKit

class ExpoRoomPlanView: ExpoView {
    let onScanComplete = EventDispatcher()
    let onScanProcessing = EventDispatcher()
    var scanName: String = "Untitled"
    private var roomCaptureView: UIView?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        
        if #available(iOS 16.0, *) {
            let view = RoomCaptureView()
            view.delegate = self
            self.roomCaptureView = view
            addSubview(view)
            print("SWIFT: RoomCaptureView initialized and delegate set")
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        roomCaptureView?.frame = bounds
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        
        if #available(iOS 16.0, *) {
            guard let captureView = roomCaptureView as? RoomCaptureView else { return }
            
            if self.window != nil {
                // View is mounted -> Start Session
                var config = RoomCaptureSession.Configuration()
                captureView.captureSession.run(configuration: config)
                print("SWIFT: Session Started")
            } else {
                // View is unmounted -> Stop Session
                captureView.captureSession.stop()
                print("SWIFT: Session Stopped (View removed)")
            }
        }
    }
}

// MARK: - Delegate Implementation
@available(iOS 16.0, *)
extension ExpoRoomPlanView: RoomCaptureViewDelegate {
    func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool {
            if let error = error {
                print("SWIFT: Scan failed with error: \(error.localizedDescription)")
                onScanComplete([
                    "uuid": "",
                    "error": error.localizedDescription
                ])
                return false
            }
            
            print("SWIFT: Start processing")
            onScanProcessing([:])
            
            Task {
                do {
                    print("SWIFT: Starting RoomBuilder processing...")
                    
                    let builder = RoomBuilder(options: [.beautifyObjects])
                    let finalRoom = try await builder.capturedRoom(from: roomDataForProcessing)
                    
                    print("SWIFT: Processing Complete! UUID: \(finalRoom.identifier)")
                    
                    onScanComplete([
                        "uuid": finalRoom.identifier.uuidString,
                        "error": NSNull()
                    ])
                    
                } catch {
                    print("SWIFT: Builder Error: \(error.localizedDescription)")
                    
                    onScanComplete([
                        "uuid": "",
                        "error": error.localizedDescription
                    ])
                }
            }

            return false
        }
}
