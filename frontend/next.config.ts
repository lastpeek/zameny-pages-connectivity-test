import type {NextConfig} from 'next';
const basePath=process.env.PAGES_BASE_PATH||'';
if(basePath&&!/^\/[a-zA-Z0-9/_-]+$/.test(basePath))throw Error('Invalid PAGES_BASE_PATH');
const config:NextConfig={output:'export',basePath,trailingSlash:true,poweredByHeader:false,images:{unoptimized:true},env:{NEXT_PUBLIC_BASE_PATH:basePath},turbopack:{root:process.cwd()}};
export default config;
