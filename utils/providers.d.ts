export interface Provider {
  name: string;
  max_tokens: number;
  id: string;
}

export interface Providers {
  [key: string]: Provider;
}

export const PROVIDERS: Providers; 