import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
const apiPort=Number(process.env.PROJECT_API_PORT??5291);
const proxy={'/api':`http://127.0.0.1:${apiPort}`};
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:5191,strictPort:true,proxy},preview:{host:'127.0.0.1',port:5191,strictPort:true,proxy}});
