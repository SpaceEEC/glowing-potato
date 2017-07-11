/**
 * Represents a video from youtube as a consistent type.
 */
export type Video = {
	/**
	 * Video ID
	 */
	id: string;
	/**
	 * Title of the Video
	 */
	title: string;
	/**
	 * Length of the Video in seconds
	 */
	durationSeconds: number;
};
