/*
 * Heavily influenced by https://www.npmjs.com/package/simple-youtube-api
 * Mainly wrote this class to not install request and actually getting video duration rather than NaN/null/-1.
 */

import { parse } from 'url';
import { silly } from 'winston';

const { get }: { get: any } = require('snekfetch');
const { googletoken }: { googletoken: string } = require('../../config.json');

const multiplicator: number[] = [1, 60, 3600];
const parser: RegExp = /\d+/g;

// very consistent api responses
type videoResponse = {
	items: videoItem[];
};

type videoItem = {
	snippet: {
		title: string;
	};
	contentDetails: {
		duration: string;
	}
	id?: string;
};

type playlistResponse = {
	items: playlistVideo[];
	nextPageToken: string;
};

type playlistVideo = {
	snippet: {
		resourceId: {
			videoId: string;
		}
	}
};

type searchResponse = {
	items: searchVideo[];
};

type searchVideo = {
	id: {
		kind: string;
		videoId: string;
	};
};

/**
 * Represents a video from youtube as a consistent type.
 */
export type video = {
	/**
	 * Video ID
	 */
	id: string;
	/**
	 * Title of the Video.
	 */
	title: string;
	/**
	 * Length of the Video in seconds.
	 */
	durationSeconds: number;
};

/**
 * Util class to fetch videos or playlists from YouTube.
 */
export class Youtube {
	/**
	 * Fetches a video from a URL or its ID.
	 * @param {string} input URL or ID to fetch the video from.
	 * @returns {Promise<video>} The fetched video, ur null when no was found.
	 * @static
	 */
	public static async getVideo(input: string): Promise<video> {
		const { pathname, query, hostname }: { pathname?: string, hostname?: string, query?: { v: string } } = parse(input, true);
		let id: string;

		if (query.v) id = query.v;
		else if (hostname === 'youtu.be' || !id) id = pathname.split('/').pop();

		if (!id) return null;

		return Youtube._fetchVideos(id).then((videos: video[]) => videos[0]);
	}

	/**
	 * Fetches all videos (up to set limit) from the playlist from its URL or ID.
	 * @param {string} input The URL or ID to fetch from.
	 * @param {?number} limit The limit of videos to fetch.
	 * @returns {Promise<video[]>} The fetched videos.
	 * @static
	 */
	public static async getPlaylist(input: string, limit: number): Promise<video[]> {
		let id: string;
		const { pathname, query }: { pathname?: string, query?: { list: string } } = parse(input, true);
		if (query.list) id = query.list;
		else id = pathname.split('/').pop();
		if (!id) return null;

		return Youtube._fetchPlaylist(id, limit);
	}

	/**
	 * Fetches videos from youtube by the specified searchquery.
	 * @param {string} input The search query.
	 * @param {number} max Max amounts of videos to be listed.
	 * @returns {Promise<video[]>} The found videos.
	 * @static
	 */
	public static async searchVideos(input: string, max: number): Promise<video[]> {
		const { body: search, status, statusText, ok }: { body: searchResponse, status: number, statusText: string, ok: boolean } = await get(
			'https://www.googleapis.com/youtube/v3/search'
			+ '?part=snippet'
			+ `&maxResults=${max}`
			+ `&q=${encodeURIComponent(input)}`
			+ '&type=video'
			+ '&fields=items%2Fid'
			+ `&key=${googletoken}`
		).catch((response: any) => response);
		silly('searchVideos', status, statusText, ok);

		if (!search.items[0]) return null;

		const ids: string[] = [];
		for (const video of search.items) ids.push(video.id.videoId);

		return Youtube._fetchVideos(ids.join());
	}

	/**
	 * Fetches all videos from that Playlist up to the specified limit.
	 * @param {string} id ID of the playlist to fetch from.
	 * @param {number} finalamount Amount of videos to fetch at max.
	 * @param {?string} [pagetoken=null] Token of the page to query.
	 * @param {?string[]} [arr=[]] Array of already fetched videos.
	 * @returns {Promise<video[]>} Array of fetched video IDs.
	 * @static
	 * @private
	 */
	private static async _fetchPlaylist(id: string, finalamount: number, pagetoken: string = null, arr: video[] = []): Promise<video[]> {
		const requestamount: number = Math.min(finalamount, 50);
		finalamount -= requestamount;

		const { body: playlist, status, statusText, ok }: { body: playlistResponse, status: number, statusText: string, ok: boolean } = await get(
			'https://www.googleapis.com/youtube/v3/playlistItems'
			+ '?part=snippet'
			+ `&maxResults=${requestamount}`
			+ `&playlistId=${id}`
			+ `${pagetoken ? `&pageToken=${pagetoken}` : ''}`
			+ `&fields=items%2Fsnippet%2FresourceId%2FvideoId`
			+ `&key=${googletoken}`).catch((response: any) => response);
		silly('fetchPlaylist', status, statusText, ok);

		if (!playlist.items) return arr.length ? arr : null;

		const ids: string[] = [];
		for (const video of playlist.items) ids.push(video.snippet.resourceId.videoId);

		const tempArray: video[] = await Youtube._fetchVideos(ids.join());

		arr = arr.concat(tempArray);

		if (!playlist.nextPageToken || !finalamount) return arr;
		else return Youtube._fetchPlaylist(id, finalamount, playlist.nextPageToken, arr);
	}

	/**
	 * Fetches all necessary data from the specified video IDs.
	 * @param {string} ids IDs, sperated by spaces, to fetch data from.
	 * @returns {video[]} The fetched videos.
	 * @static
	 * @private
	 */
	private static async _fetchVideos(ids: string): Promise<video[]> {
		const { body: videoResponse, status, statusText, ok }: { body: videoResponse, status: number, statusText: string, ok: boolean } = await get(
			'https://www.googleapis.com/youtube/v3/videos'
			+ '?part=snippet%2CcontentDetails'
			+ `&id=${encodeURIComponent(ids)}`
			+ '&fields=items(contentDetails%2Fduration%2Cid%2Csnippet%2Ftitle)'
			+ `&key=${googletoken}`
		).catch((response: any) => response);
		silly('fetchVideos', status, statusText, ok);

		const videos: video[] = [];
		for (const video of videoResponse.items) {
			videos.push(
				{
					id: video.id,
					title: video.snippet.title,
					durationSeconds: Youtube._toSeconds(video.contentDetails.duration)
				}
			);
		}

		return videos;
	}

	/**
	 * Converts an ISO 8601 string to seconds.
	 * @param {string} input The ISO 8601 string.
	 * @returns {number} Converted seconds.
	 * @static
	 * @private
	 */
	private static _toSeconds(input: string): number {
		let a: any[] = input.match(parser);

		if (!input.includes('H') && input.includes('M') && !input.includes('S')) {
			a = [0, a[0], 0];
		} else if (input.includes('H') && input.includes('S')) {
			a = [a[0], 0, a[1]];
		} else if (input.includes('H')) {
			a = [a[0], 0, 0];
		}

		// a reverse for in loop, but with an incrementing secondary index
		let duration: number = 0;
		let i2: number = 0;
		for (let i: number = a.length; i >= 1; ++i2) {
			duration += parseInt(a[--i]) * multiplicator[i2];
		}

		return duration;
	}
};
