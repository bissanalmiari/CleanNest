export interface ServiceProofTask {
  key: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
}

export interface ServiceProofPhoto {
  url: string;
  uploadedAt: string;
}

export interface ServiceProofIssue {
  description: string;
  photos: ServiceProofPhoto[];
  reportedAt: string;
}

export interface ServiceProofReport {
  id: string;
  bookingId: string;
  assignmentId: string;
  cleanerId: string;
  cleanerName: string;
  checklist: ServiceProofTask[];
  beforePhotos: ServiceProofPhoto[];
  afterPhotos: ServiceProofPhoto[];
  issues: ServiceProofIssue[];
  onMyWayAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  checkInLocation: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
    readyToComplete: boolean;
  };
}
