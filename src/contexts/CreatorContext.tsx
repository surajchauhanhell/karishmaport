import { createContext, useContext, type ReactNode } from 'react';
import { defaults } from '../data/defaults';
import { useContent } from '../hooks/useContent';
const CreatorContext = createContext(defaults);
export function CreatorProvider({ children }: { children: ReactNode }) {
  const { data } = useContent('creator_settings');
  return <CreatorContext.Provider value={data[0] ?? defaults}>{children}</CreatorContext.Provider>;
}
export const useCreator = () => useContext(CreatorContext);
