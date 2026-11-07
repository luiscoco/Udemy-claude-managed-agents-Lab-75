import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:5193,strictPort:true,proxy:{'/api':{target:`http://127.0.0.1:${process.env.PROJECT_API_PORT??process.env.PORT??5293}`,changeOrigin:true}}}});
