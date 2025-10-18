import { v2 as cloudinary } from 'cloudinary';

const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    // Do not log secrets; only indicate which keys are missing
    const missing = [
      !CLOUDINARY_CLOUD_NAME && 'CLOUDINARY_CLOUD_NAME',
      !CLOUDINARY_API_KEY && 'CLOUDINARY_API_KEY',
      !CLOUDINARY_API_SECRET && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean).join(', ');
    // Throw to fail fast so uploads don't error later with generic messages
    throw new Error(`Missing Cloudinary configuration: ${missing}`);
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
    timeout: 60000, // 60s timeout to reduce ETIMEDOUT on slow networks
  });
};

export default configureCloudinary;
