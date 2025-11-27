//
//  Records.swift
//  ExpoRoomPlan
//
//  Created by Dmitrii Fomin on 2025-11-26.
//

import Foundation
import ExpoModulesCore

struct ExpoRoomPlanAvailability: Record {
    @Field
    var isAvailable: Bool = false
    
    @Field
    var availabilityReason: String? = nil
    
    @Field
    var deviceSupported: Bool = false
    
    @Field
    var osVersion: String = ProcessInfo.processInfo.operatingSystemVersionString
}

struct ExpoRoomPlanScanResult: Record {
    @Field
    var uuid: String? = nil
    
    @Field
    var usdzUri: String? = nil 
    
    @Field
    var jsonUri: String? = nil
    
    @Field
    var error: String? = nil
}
