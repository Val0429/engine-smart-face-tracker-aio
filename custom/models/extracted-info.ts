export interface IRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IExtractedInfo {
    /// extended face image
    imageUri: string;
    /// face feature
    feature: string;
    /// extended face image rect
    imageRect: IRect;
    /// real face image rect
    faceRect: IRect;
    
    confidenceScore: number;
    /// positive: turn up. negative: turn down
    pitch: number;
    /// positive: turn right. negative: turn left
    yaw: number;
}
