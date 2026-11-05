import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

// The static export has one small, local Next stylesheet. Inline it to avoid
// a render-blocking round trip, and run the existing appearance + public data
// bootstrap before it. Fail the build rather than publishing a broken export.
const base = process.env.PAGES_BASE_PATH || '';
if (base && !/^\/[a-zA-Z0-9/_-]+$/.test(base)) throw Error('Invalid base path');
const output = path.resolve('out');
const htmlPath = path.join(output, 'index.html');
let html = await readFile(htmlPath, 'utf8');
const bootstrap = html.match(/<script id="zameny-early-bootstrap">[\s\S]*?<\/script>/g);
const links = html.match(/<link rel="stylesheet" href="[^"]+" data-precedence="next"\s*\/>/g);
if (bootstrap?.length !== 1 || links?.length !== 1) throw Error('Unexpected export head');
const href = links[0].match(/href="([^"]+)"/)[1];
const prefix = base + '/_next/static/css/';
if (!href.startsWith(prefix) || !/^[A-Za-z0-9._-]+\.css$/.test(href.slice(prefix.length))) throw Error('Unexpected stylesheet path');
const css = await readFile(path.join(output, '_next/static/css', href.slice(prefix.length)), 'utf8');
if (/<\/style/i.test(css)) throw Error('Unsafe stylesheet');
html = html.replace(bootstrap[0], '').replace(links[0], bootstrap[0] + '<style data-zameny-inline-css="true">' + css + '</style>');
await writeFile(htmlPath, html);
