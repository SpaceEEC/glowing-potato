export type ExecError = {
	code: number,
	cmd: string,
	killed: boolean,
	signal: any,
	stderr: string,
	stdout: string,
} & Error;
