export interface Application {
  Title: string;
  Footer: string;
  OpenAppNewTab: boolean;
  OpenBookmarkNewTab: boolean;
  ShowTitle: boolean;
  Greetings: string;
  ShowSearchComponent: boolean;
  DisabledSearchAutoFocus: boolean;
  ShowDateTime: boolean;
  ShowApps: boolean;
  ShowBookmarks: boolean;
  HideSettingsButton: boolean;
  HideHelpButton: boolean;
  Theme: string;
  EnableEncryptedLink: boolean;
  IconMode: string;
  KeepLetterCase: boolean;
}

export interface Bookmark {
  id?: number;
  type: 'app' | 'bookmark';
  name: string;
  url: string;
  icon: string;
  desc: string;
  private: number;
  category_id: string | null;
  sort_order: number;
}

export interface Category {
  id: string;
  type: string;
  title: string;
  sort_order: number;
}

export interface Palette {
  background: string;
  primary: string;
  accent: string;
}

export interface Theme {
  name: string;
  colors: Palette;
}

export interface PageRef {
  Name: string;
  Title: string;
  Path: string;
}
