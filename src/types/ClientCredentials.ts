export type ClientCredentials = {
	/**
	 * The access token, which is required to use the api
	 */
	access_token: string;
	/**
	 * The type of the token
	 */
	token_type: string;
	/**
	 * The timestamp indicating when the token expires
	 */
	expires: number;
	/**
	 * The time in seconds until the token expires
	 */
	expires_in: number;
};
