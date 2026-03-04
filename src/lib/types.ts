export interface FileEntry {
  path: string;
  size: number;
  file: any;
}

export type ArchiveFormat =
  | 'zip'
  | 'tar'
  | 'tar.gz'
  | '7zip'
  | 'rar'
  | 'tar.bz2'
  | 'tar.xz';
