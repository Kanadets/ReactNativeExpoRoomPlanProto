import ARKit
import ExpoModulesCore
import RoomPlan
import UIKit

class ExpoRoomPlanView: ExpoView {
    
    var projectFolderPath: String? {
        didSet {
            attemptInitialization()
        }
    }
    
    // Strong reference to session
    private var internalARSession: ARSession?
    private var roomCaptureView: RoomCaptureView?
    private var hasInitialized = false
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        roomCaptureView?.frame = bounds
    }
    
    override func willMove(toWindow newWindow: UIWindow?) {
        super.willMove(toWindow: newWindow)
        
        if newWindow == nil {
            print("SWIFT: View detaching. Pausing session.")
            
            roomCaptureView?.captureSession.stop()
            internalARSession?.pause()
        }
    }
    
   
    deinit {
        print("SWIFT: View Deinit. Full Cleanup.")
        
        roomCaptureView?.captureSession.stop()
        internalARSession?.pause()
        internalARSession = nil
        roomCaptureView = nil
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        attemptInitialization()
    }
    
    @available(iOS 17.0, *)
    private func attemptInitialization() {
        guard let folderPath = projectFolderPath, self.window != nil, !hasInitialized else {
            return
        }
        
        hasInitialized = true
        
        // Create fresh session
        let arSession = ARSession()
        self.internalARSession = arSession
        
        let arConfig = ARWorldTrackingConfiguration()
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            arConfig.sceneReconstruction = .mesh
        }
        arConfig.planeDetection = [.horizontal, .vertical]
        
        // Load Map
        let worldMapURL = URL(fileURLWithPath: folderPath).appendingPathComponent("WorldScan.map")
        
        // Debug Log
        if FileManager.default.fileExists(atPath: worldMapURL.path) {
             print("SWIFT: Map file exists at \(worldMapURL.path)")
             if let data = try? Data(contentsOf: worldMapURL),
                let worldMap = try? NSKeyedUnarchiver.unarchivedObject(ofClass: ARWorldMap.self, from: data) {
                 arConfig.initialWorldMap = worldMap
                 print("SWIFT: Loaded existing WorldMap. Relocalizing...")
             } else {
                 print("SWIFT: Map exists but failed to load data.")
             }
        } else {
             print("SWIFT: No existing WorldMap file found (First scan?).")
        }
        
        // Run Session
        arSession.run(arConfig, options: [.resetTracking, .removeExistingAnchors])
        
        let captureView = RoomCaptureView(frame: bounds, arSession: arSession)
        captureView.delegate = self
        captureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        self.addSubview(captureView)
        self.roomCaptureView = captureView
        
        var roomConfig = RoomCaptureSession.Configuration()
        roomConfig.isCoachingEnabled = true
        captureView.captureSession.run(configuration: roomConfig)
    }
}

@available(iOS 17.0, *)
extension ExpoRoomPlanView: RoomCaptureViewDelegate {
    
    func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool {
        
        if let error = error {
            self.appContext?.eventEmitter?.sendEvent(withName: "onScanComplete", body: ["error": error.localizedDescription])
            return false
        }
        
        self.appContext?.eventEmitter?.sendEvent(withName: "onScanProcessing", body: [:])
        
        guard let folderPath = projectFolderPath else { return false }
        
        
        // Capture the session object locally so it can't be nil
        guard let arSession = self.internalARSession else {
             print("SWIFT ERROR: Internal ARSession is nil! (Race condition triggered)")
             return false
        }

        print("SWIFT: Starting WorldMap generation...")
        
        arSession.getCurrentWorldMap { worldMap, error in
            if let error = error {
                print("SWIFT ERROR: Map generation failed: \(error.localizedDescription)")
            } else if let map = worldMap {
                // Check if map is empty
                if map.rawFeaturePoints.points.isEmpty {
                    print("SWIFT WARNING: Map has 0 feature points. Not saving.")
                } else {
                    do {
                        let data = try NSKeyedArchiver.archivedData(withRootObject: map, requiringSecureCoding: true)
                        let worldMapURL = URL(fileURLWithPath: folderPath).appendingPathComponent("WorldScan.map")
                        try data.write(to: worldMapURL)
                        print("SWIFT SUCCESS: Saved WorldMap to \(worldMapURL.path)")
                    } catch {
                        print("SWIFT ERROR: Save failed: \(error)")
                    }
                }
            } else {
                print("SWIFT ERROR: WorldMap was nil.")
            }
        }
        
        Task {
            do {
                let builder = RoomBuilder(options: [.beautifyObjects])
                let currentRoom = try await builder.capturedRoom(from: roomDataForProcessing)
                
                let folderURL = URL(fileURLWithPath: folderPath)
                if !FileManager.default.fileExists(atPath: folderURL.path) {
                    try FileManager.default.createDirectory(at: folderURL, withIntermediateDirectories: true)
                }
                
                let newRoomUUID = currentRoom.identifier.uuidString
                let newRoomJsonURL = folderURL.appendingPathComponent("\(newRoomUUID).json")
                try JSONEncoder().encode(currentRoom).write(to: newRoomJsonURL)
                
                let masterViewURL = folderURL.appendingPathComponent("MasterView.usdz")
                
                let fileURLs = try FileManager.default.contentsOfDirectory(at: folderURL, includingPropertiesForKeys: nil)
                var allRooms: [CapturedRoom] = []
                
                for url in fileURLs {
                    if url.pathExtension == "json" {
                        if let data = try? Data(contentsOf: url),
                           let room = try? JSONDecoder().decode(CapturedRoom.self, from: data) {
                            allRooms.append(room)
                        }
                    }
                }
                
                if FileManager.default.fileExists(atPath: masterViewURL.path) {
                    try FileManager.default.removeItem(at: masterViewURL)
                }
                
                if allRooms.count > 1 {
                    do {
                        let structureBuilder = StructureBuilder(options: [.beautifyObjects])
                        let mergedStructure = try await structureBuilder.capturedStructure(from: allRooms)
                        try mergedStructure.export(to: masterViewURL)
                    } catch {
                        try currentRoom.export(to: masterViewURL)
                    }
                } else {
                    try currentRoom.export(to: masterViewURL)
                }
                
                let payload: [String: Any] = [
                    "usdzUri": masterViewURL.path,
                    "jsonUri": newRoomJsonURL.path,
                    "totalRooms": allRooms.count
                ]
                
                DispatchQueue.main.async {
                    self.appContext?.eventEmitter?.sendEvent(withName: "onScanComplete", body: payload)
                }
                
            } catch {
                DispatchQueue.main.async {
                    self.appContext?.eventEmitter?.sendEvent(withName: "onScanComplete", body: ["error": error.localizedDescription])
                }
            }
        }
        
        return false
    }
}
