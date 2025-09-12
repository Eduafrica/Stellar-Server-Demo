import express from 'express'
import * as controllers from '../../controllers/upload.controllers.js'
import multer from 'multer';
import bodyParser from 'body-parser';

const router = express.Router()
const upload = multer();

//const upload = multer();
const handleUpload = [
    upload.single('file'), // Multer middleware for files
    bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }), // For blob data
  ];

//POST
router.post('/initiateUpload', controllers.initiateUpload)
router.post('/uploadFile', handleUpload, controllers.uploadFile)
router.post('/completeUpload', controllers.completeUpload)


//PUT ROUTES

export default router
