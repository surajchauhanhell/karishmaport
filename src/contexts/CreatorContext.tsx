import { createContext, useContext, type ReactNode } from 'react';
import { defaults } from '../data/defaults';
import { useContent } from '../hooks/useContent';
const CreatorContext = createContext(defaults);
export function CreatorProvider({ children }: { children: ReactNode }) {
  const { data } = useContent('creator_settings');
  const creator = data[0]
    ? { ...data[0], youtube_url: data[0].youtube_url?.trim() || defaults.youtube_url }
    : defaults;
  return <CreatorContext.Provider value={creator}>{children}</CreatorContext.Provider>;
}
export const useCreator = () => useContext(CreatorContext);
