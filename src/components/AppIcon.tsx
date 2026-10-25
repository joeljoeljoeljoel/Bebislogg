import iconUrl from '../assets/app-icon.svg';

export function AppIcon({ size, radius }: { size: number; radius: number }) {
  return <img className="app-icon" src={iconUrl} alt="" width={size} height={size} style={{ borderRadius: radius }} />;
}
