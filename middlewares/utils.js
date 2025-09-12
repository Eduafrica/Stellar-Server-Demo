import cloudinary from "cloudinary";
import multer from "multer";
import StudentModel from "../model/Student.js";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000, // 120 seconds
});

// Helper for uploading files to Cloudinary
export async function uploadToCloudinary(fileBuffer, folder, resourceType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const bufferStream = new PassThrough();
    bufferStream.end(fileBuffer); // End the stream with the buffer
    bufferStream.pipe(uploadStream); // Pipe the buffer to the Cloudinary stream
  });
}

// Configure Multer
const storage = multer.memoryStorage(); // Use memory storage for direct streaming
const upload = multer({ storage });

//MULTER MIDDLEWARE
export const uploadMiddleware = upload.fields([
  { name: "media", maxCount: 1 },
  { name: "medias", maxCount: 30 },
]);

export function multerErrorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            console.error(`Unexpected field: ${err.field}`);
            return res.status(400).json({ error: `Unexpected field: ${err.field}` });
        }
    }
    console.log('MULTER ERROR', err);
    next(err); // Pass to the next error handler if not a Multer error
}

//FORMAT DATE
export const formatDateAndTime = (createdAt) => {
    const date = new Date(createdAt);
  
    // Format date as "31 / 01 / 2024"
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, ' / ');
  
    // Format time as "05.30 PM"
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(':', '.');
  
    return { formattedDate, formattedTime };
  };


export async function calculateAverageRating(reviews = []) {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return Math.round((total / reviews.length) * 10) / 10; // round to 1 decimal place
}

export async function generateUniqueCode(length) {
    const generateUserId = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let userId = ''; 

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            userId += characters[randomIndex]; 
        }

        return userId;
    };

    let userId;
    let exists = true;

    while (exists) {
        userId = generateUserId();
        const existingId = await StudentModel.findOne({ userId: userId });
        exists = existingId !== null; 
    }

    return userId;
}

export const sendResponse = (res, statusCode, success, data, message) => {
    return res.status(statusCode).json({ success: success, data: data, message: message ? message : '' });
};


export async function validatePassword(password) {
  if (typeof password !== 'string') {
    return { success: false, message: 'Password must be a string.' };
  }
  if (password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[a-z]/.test(password)) {
    return { success: false, message: 'Password must include at least one lowercase letter.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { success: false, message: 'Password must include at least one uppercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { success: false, message: 'Password must include at least one number.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { success: false, message: 'Password must include at least one special character.' };
  }
  return { success: true, message: 'Password is valid.' };
}

export function maskEmail(email) {
  const [localPart, domain] = email.split("@");
  
  if (localPart.length <= 2) {
    // If too short, just mask everything except first char
    return localPart[0] + "*".repeat(localPart.length - 1) + "@" + domain;
  }

  return (
    localPart[0] +
    "*".repeat(localPart.length - 2) +
    localPart[localPart.length - 1] +
    "@" +
    domain
  );
}

export function stringToNumberArray(code) {
    return code.split('').map(Number);
}

