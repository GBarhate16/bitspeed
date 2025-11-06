export type LinkPrecedence = 'primary' | 'secondary';

export interface ContactRow {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: LinkPrecedence;
  createdAt: string; // ISO from pg
  updatedAt: string; // ISO from pg
  deletedAt: string | null; // ISO from pg
}


