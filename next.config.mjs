/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.externals.push(
        'firebase-functions',
        'genkit',
        /^@genkit-ai\/.*/
      );
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyCFEh6UhMey_OBJ2EJSmpH_4TvRjZ22qaU",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "babylist-x9t27.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "babylist-x9t27",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "babylist-x9t27.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1079756906455",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:1079756906455:web:f7e8a967c9158b30a63592",
  }
};

export default nextConfig;
