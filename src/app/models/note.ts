import { Tag } from './tag';

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  tags?: Tag[];
} 