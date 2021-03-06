/*
 * Heavily influenced by https://www.npmjs.com/package/simple-youtube-api
 * Mainly wrote this class to not install request and actually getting video duration rather than NaN/null/-1.
 */

import { get } from 'snekfetch';
import { parse } from 'url';
import { Logger } from 'yamdbf';

import { Video } from '../types/Video';

// very consistent api responses
// v3/videos
type VideoResponse =
	{
		items: VideoItem[];
	};

type VideoItem =
	{
		snippet:
		{
			title: string;
		};
		contentDetails:
		{
			duration: string;
		}
		id?: string;
	};

// v3/playlistitems
type PlaylistResponse =
	{
		items: PlaylistVideo[];
		nextPageToken: string;
	};

type PlaylistVideo =
	{
		snippet:
		{
			resourceId:
			{
				videoId: string;
			};
		};
	};

// v3/search
type SearchResponse =
	{
		items: SearchVideo[];
	};

type SearchVideo =
	{
		id:
		{
			kind: string;
			videoId: string;
		};
	};

/**
 * Static Util class to fetch videos or playlists from YouTube.
 * @static
 */
export class YouTubeUtil
{
	/**
	 * Fetches a video from a URL or its ID.
	 * @param {string} input URL or ID to fetch the video from
	 * @returns {Promise<Video>} The fetched video, ur null when no was found
	 * @static
	 */
	public static async getVideo(input: string): Promise<Video>
	{
		const { pathname, query: { v }, hostname }: {
			pathname?: string,
			hostname?: string,
			query?: {
				v: string,
			},
		} = parse(input, true) as any;
		if (!pathname) return null;

		const id: string = (!v || hostname === 'youtu.be') ? pathname.split('/').pop() : v;

		if (!id) return null;

		return YouTubeUtil._fetchVideos(id).then((videos: Video[]) => videos[0]);
	}

	/**
	 * Fetches all videos (up to set limit) from the playlist from its URL or ID.
	 * @param {string} input The URL or ID to fetch from
	 * @param {?number} limit The limit of videos to fetch
	 * @returns {Promise<Video[]>} The fetched videos
	 * @static
	 */
	public static async getPlaylist(input: string, limit: number): Promise<Video[]>
	{
		const { pathname, query: { list } }: {
			pathname?: string,
			query?: {
				list: string,
			},
		} = parse(input, true) as any;
		if (!pathname) return null;

		const id: string = list || pathname.split('/').pop();

		if (!id) return null;

		return YouTubeUtil._fetchPlaylist(id, limit);
	}

	/**
	 * Fetches videos from youtube by the specified searchquery.
	 * @param {string} input The search query
	 * @param {number} max Max amounts of videos to be listed
	 * @returns {Promise<Video[]>} The found videos
	 * @static
	 */
	public static async searchVideos(input: string, max: number): Promise<Video[]>
	{
		const { body, status, statusText, ok }: {
			body: SearchResponse,
			status: number,
			statusText: string,
			ok: boolean,
		} = await get(
			'https://www.googleapis.com/youtube/v3/search'
			+ '?part=snippet'
			+ `&maxResults=${max}`
			+ `&q=${encodeURIComponent(input)}`
			+ '&type=video'
			+ '&fields=items%2Fid'
			+ `&key=${process.env.GOOGLE_TOKEN}`,
		).catch((response: any) =>
		{
			if (!response.status && response instanceof Error) throw response;
			return response;
		}) as any;

		Logger.instance().debug('YouTubeUtil | searchVideos', String(status), statusText, String(ok));

		if (!body.items[0]) return null;

		const ids: string[] = [];
		for (const video of body.items)
		{
			ids.push(video.id.videoId);
		}

		return YouTubeUtil._fetchVideos(ids.join());
	}

	/**
	 * Multiplicator array for `YoutubeUtil._toSeconds`
	 * @private
	 * @static
	 */
	private static multiplicator: number[] = [1, 60, 3600];
	/**
	 * Regex parser fro `YoutubeUtil._toSeconds`
	 * @private
	 * @static
	 */
	private static parser: RegExp = /\d+/g;

	/**
	 * Fetches all videos from that Playlist up to the specified limit.
	 * @param {string} id ID of the playlist to fetch from
	 * @param {number} finalamount Amount of videos to fetch at max
	 * @param {?string} [pagetoken=null] Token of the page to query
	 * @param {?Video[]} [arr=[]] Array of already fetched videos
	 * @returns {Promise<Video[]>} Array of fetched video IDs
	 * @private
	 * @static
	 */
	private static async _fetchPlaylist(id: string, finalamount: number, pagetoken: string = null, arr: Video[] = [])
		: Promise<Video[]>
	{
		const requestamount: number = Math.min(finalamount, 50);
		finalamount -= requestamount;

		const { body, status, statusText, ok }: {
			body: PlaylistResponse,
			status: number,
			statusText: string,
			ok: boolean,
		} = await get(
			'https://www.googleapis.com/youtube/v3/playlistItems'
			+ '?part=snippet'
			+ `&maxResults=${requestamount}`
			+ `&playlistId=${encodeURIComponent(id)}`
			+ (pagetoken ? `&pageToken=${pagetoken}` : '')
			+ `&fields=items%2Fsnippet%2FresourceId%2FvideoId`
			+ `&key=${process.env.GOOGLE_TOKEN}`,
		).catch((response: any) =>
		{
			if (!response.status && response instanceof Error) throw response;
			return response;
		}) as any;

		Logger.instance().debug('YouTubeUtil | fetchPlaylist', String(status), statusText, String(ok));

		if (!body.items) return arr.length ? arr : null;

		const ids: string[] = [];
		for (const video of body.items)
		{
			ids.push(video.snippet.resourceId.videoId);
		}

		const tempArray: Video[] = await YouTubeUtil._fetchVideos(ids.join());

		arr = arr.concat(tempArray);

		if (!body.nextPageToken || !finalamount) return arr;
		return YouTubeUtil._fetchPlaylist(id, finalamount, body.nextPageToken, arr);
	}

	/**
	 * Fetches all necessary data from the specified video IDs.
	 * @param {string} ids By a space seperated video IDs to fetch data from
	 * @returns {Video[]} The fetched videos
	 * @private
	 * @static
	 */
	private static async _fetchVideos(ids: string): Promise<Video[]>
	{
		const { body, status, statusText, ok, text }: {
			body: VideoResponse,
			status: number,
			statusText: string,
			ok: boolean,
			text: string,
		} = await get(
			'https://www.googleapis.com/youtube/v3/videos'
			+ '?part=snippet%2CcontentDetails'
			+ `&id=${encodeURIComponent(ids)}`
			+ '&fields=items(contentDetails%2Fduration%2Cid%2Csnippet%2Ftitle)'
			+ `&key=${process.env.GOOGLE_TOKEN}`,
		).catch((response: any) =>
		{
			if (!response.status && response instanceof Error) throw response;
			else return response;
		}) as any;

		Logger.instance().debug('YouTubeUtil | fetchVideos', String(status), statusText, String(ok), !ok ? text : undefined);

		const videos: Video[] = [];
		for (const video of body.items)
		{
			videos.push(
				{
					durationSeconds: YouTubeUtil._toSeconds(video.contentDetails.duration),
					id: video.id,
					title: video.snippet.title,
				},
			);
		}

		return videos;
	}

	/**
	 * Converts an ISO 8601 string to seconds.
	 * @param {string} input The ISO 8601 string
	 * @returns {number} Converted seconds
	 * @private
	 * @static
	 */
	private static _toSeconds(input: string): number
	{
		let a: any[] = input.match(YouTubeUtil.parser);

		if (!input.includes('H') && input.includes('M') && !input.includes('S'))
		{
			a = [0, a[0], 0];
		}
		else if (input.includes('H') && input.includes('S'))
		{
			a = [a[0], 0, a[1]];
		}
		else if (input.includes('H'))
		{
			a = [a[0], 0, 0];
		}

		// a reverse for in loop, but with an incrementing secondary index
		let duration: number = 0;
		let i2: number = 0;
		for (let i: number = a.length; i >= 1; ++i2)
		{
			duration += parseInt(a[--i]) * YouTubeUtil.multiplicator[i2];
		}

		return duration;
	}
}
