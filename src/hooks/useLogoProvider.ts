import { useSyncExternalStore } from "react";
import {
  getLogoProvider,
  setLogoProvider,
  subscribeLogoProvider,
  type LogoProviderId,
} from "../utils/logoProvider";

export function useLogoProvider(): [
  LogoProviderId,
  (provider: LogoProviderId) => void,
] {
  const provider = useSyncExternalStore(
    subscribeLogoProvider,
    getLogoProvider,
    getLogoProvider
  );
  return [provider, setLogoProvider];
}
