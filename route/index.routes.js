import { Router } from "express";
import StudentRoutes from "./routes/student.routes.js";
import InstructorRoutes from "./routes/instructor.routes.js";
import StellarRoutes from "./routes/stellar.routes.js";
import UploadRoutes from "./routes/upload.routes.js";
import CourseRoutes from "./routes/course.routes.js";

const router = Router();

router.use("/upload", UploadRoutes);
router.use("/student", StudentRoutes);
router.use("/instructor", InstructorRoutes);
router.use("/stellar", StellarRoutes);
router.use("/course", CourseRoutes);


export default router;
