// Type definitions for colors 2.1.3
// Package: https://www.npmjs.com/package/command-line-args
// Definitions by: Ethan Sherr <https://github.com/DogsForArms/>

/*
require-2.1.8.d.ts may be freely distributed under the MIT license.
Copyright (c) 2013 Josh Baldwin https://github.com/jbaldwin/require.d.ts
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/


interface CommandLineConfig 
{
	name: string,
	alias?: string,
	type?: any,
	multiple?: boolean,
	defaultOption?: boolean,
	description?: string
}

interface CommandLineArgs 
{
	(args: CommandLineConfig[]): Cli
}

interface Cli 
{
	parse(): any
	getUsage(any): any
}



