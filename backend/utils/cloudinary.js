import { v2 as cloudinary } from 'cloudinary'

const configured = Boolean(process.env.CLOUDINARY_CLOUD_NAME)

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export const isCloudEnabled = () => configured

export const uploadBuffer = (file, folder = 'chathive') =>
  new Promise((resolve, reject) => {
    const options = { folder, resource_type: 'auto' }
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      resolve({ public_id: result.public_id, url: result.secure_url || result.url })
    })
    stream.end(file.buffer)
  })
