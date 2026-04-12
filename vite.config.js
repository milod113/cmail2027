import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const devServerHost = env.VITE_DEV_SERVER_HOST || 'localhost';
    const devServerPort = Number(env.VITE_DEV_SERVER_PORT || 5173);

    return {
        plugins: [
            laravel({
                input: 'resources/js/app.tsx',
                refresh: true,
            }),
            react(),
        ],
        server: {
            host: '0.0.0.0',
            port: devServerPort,
            strictPort: true,
            hmr: {
                host: devServerHost,
                port: devServerPort,
            },
        },
    };
});
