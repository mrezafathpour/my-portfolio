import { createContext, useContext, useMemo, useState } from "react";

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
	const [handleIntro, setHandleIntro] = useState(null);

	const value = useMemo(
		() => ({ handleIntro, setHandleIntro }),
		[handleIntro]
	);

	return (
		<NavigationContext.Provider value={value}>
			{children}
		</NavigationContext.Provider>
	);
}

export function useNavigation() {
	const context = useContext(NavigationContext);

	if (!context) {
		throw new Error("useNavigation must be used within NavigationProvider");
	}

	return context;
}