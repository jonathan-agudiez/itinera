export type Role = 'USER' | 'ADMIN';
export type Access = 'OWNER' | 'WRITE' | 'READ' | 'ADMIN' | 'PUBLIC';
export type Permission = 'READ' | 'WRITE';
export type Category = 'transport' | 'stay' | 'food' | 'visit' | 'activity' | 'note';
export type PlanColor = 'sage' | 'sky' | 'lavender' | 'sand' | 'coral' | 'mint' | 'blue' | 'rose' | 'amber' | 'olive' | 'slate' | 'teal';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface Itinerary {
  id: string;
  ownerId: string;
  title: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  publicShareEnabled: boolean;
  shareTokenHint: string;
  createdAt: string;
  updatedAt: string;
  access?: Access;
}

export interface ItineraryEntry {
  id: string;
  itineraryId: string;
  entryDate: string;
  startTime: string;
  endTime: string | null;
  title: string;
  description: string;
  location: string;
  category: Category;
  color: PlanColor;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  userId: string;
  email: string;
  displayName: string;
  permission: Permission;
}

export interface ItineraryBundle {
  itinerary: Itinerary;
  entries: ItineraryEntry[];
  collaborators: Collaborator[];
  access: Access;
  shareUrl?: string;
}
