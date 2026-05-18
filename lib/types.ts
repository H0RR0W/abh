export interface Document {
  id: string;
  type: string;
  name: string;
  status: string;
  uploadedAt: string;
  filePath?: string;
}

export interface Payment {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  description: string;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
  address: string;
}

export interface Migrant {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  citizenship: string;
  passportNumber: string;
  passportSeries?: string | null;
  passportIssuedBy?: string | null;
  passportIssueDate?: string | null;
  passportExpiry?: string | null;
  phone: string;
  birthDate: string;
  status: string;
  registrationDate: string;
  registrationExpiry: string;
  employed: boolean;
  employer: string | null;
  photo: string | null;
  selfiePhoto?: string | null;
  identityStatus?: string;
  address: string;
  violations: number;
  lat: number;
  lng: number;
  lastSeen: string;
  documents: Document[];
  payments: Payment[];
  locationHistory: LocationPoint[];
}
