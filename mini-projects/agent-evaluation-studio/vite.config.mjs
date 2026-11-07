import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
const apiPort=Number(process.env.PROJECT_API_PORT??5292);
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:5192,strictPort:true,proxy:{'/api':`http://127.0.0.1:${apiPort}`}},preview:{host:'127.0.0.1',port:5192,strictPort:true,proxy:{'/api':`http://127.0.0.1:${apiPort}`}}});
