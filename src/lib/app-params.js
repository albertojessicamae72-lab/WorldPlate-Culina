const isNode = typeof window === 'undefined';

const env = /** @type {{ env?: { VITE_BASE44_APP_ID?: string, VITE_BASE44_FUNCTIONS_VERSION?: string, VITE_BASE44_APP_BASE_URL?: string } }} */ (import.meta).env ?? {};

const getAccessToken = () =>
	!isNode ? window.localStorage.getItem('base44_access_token') || window.localStorage.getItem('token') : null;

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	window.localStorage.removeItem('base44_access_token');
	window.localStorage.removeItem('token');
}

const getAppParams = () => {
	if (isClearAccessTokenRequested()) {
		clearStoredAccessToken();
	}
	return {
		appId: env.VITE_BASE44_APP_ID,
		token: getAccessToken(),
		functionsVersion: env.VITE_BASE44_FUNCTIONS_VERSION,
		appBaseUrl: env.VITE_BASE44_APP_BASE_URL,
	}
}


export const appParams = {
	...getAppParams()
}
