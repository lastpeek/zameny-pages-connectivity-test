'use client';
import {useEffect} from 'react';
import {staticPath} from '../src/ui/static-path';
export default function StageOneNotice(){useEffect(()=>{if('serviceWorker' in navigator)void navigator.serviceWorker.register(staticPath('/sw.js'),{scope:staticPath('/'),updateViaCache:'none'}).catch(()=>{});},[]);return null}
