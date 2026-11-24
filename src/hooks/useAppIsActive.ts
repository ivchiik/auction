import { useEffect, useState } from "react";
import { AppState } from "react-native";

/** False while the app is in the background or behind a system sheet. */
export const useAppIsActive = (): boolean => {
  const [isActive, setIsActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsActive(state === "active");
    });
    return () => subscription.remove();
  }, []);
  return isActive;
};
