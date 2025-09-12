import { generateUniqueCode, sendResponse } from "../middlewares/utils.js"
import CourseInfoModel from "../model/CourseInfo.js"

//new course (instructor)
export async function newCourse(req, res) {
    const { userId } = req.user
    const { title, image, about, description, price } = req.body
    if(!title) return sendResponse(res, 400, false, null, 'Provide a course title')
    if(!description) return sendResponse(res, 400, false, null, 'Provide a course description')
    if(!price) return sendResponse(res, 400, false, null, 'Provide a course price')

    try {
        const newId = await generateUniqueCode(9)
        const courseId = `EDU${newId}CO`

        const createCourse = await CourseInfoModel.create({
            userId,
            courseId,
            title,
            image,
            about,
            description,
            price
        })

        sendResponse(res, 201, true, createCourse, 'New course created successful')
    } catch (error) {
        console.log('UNABLE TO CREATE NEW COURSE', error)
        sendResponse(res, 500, false, null, 'Unable to create new course')
    }
}

//update course (instructor)
export async function editCourse(req, res) {
    const { userId } = req.user
    const { courseId, title, image, about, description, price } = req.body
    if(!courseId) return sendResponse(res, 400, false, null, 'Provide a course Id')

    try {
        const getCourse = await CourseInfoModel.findOne({ courseId })
        if(userId !== getCourse.userId) return sendResponse(res, 403, false, null, 'Not Allowed')

        if(title) getCourse.title = title 
        if(image) getCourse.image = image 
        if(about) getCourse.about = about
        if(description) getCourse.description = description 
        if(price) getCourse.price = price

        await getCourse.save()

        sendResponse(res, 201, true, getCourse, 'Course updated successful')
    } catch (error) {
        console.log('UNABLE TO UPDATE COURSE', error)
        sendResponse(res, 500, false, null, 'Unable to update course')
    }
}

//delete course (instructor)
export async function deletCourse(req, res) {
    const { userId } = req.user
    const { courseId } = req.body
    
    try {
        const removeCourse = await CourseInfoModel.findOne({ courseId })
        if(!removeCourse) return sendResponse(res, 404, false, null, 'Course not found')
        if(userId !== removeCourse.userId) return sendResponse(res, 403, false, null, 'Not Allowed')

        if(removeCourse.totalStudent > 0) {
            removeCourse.active = false,
            await removeCourse.save()

            sendResponse(res, 200, true, null, 'Course already has student. course has been deactivated')
            return
        } else {
            const dropCourse  = await CourseInfoModel.deleteOne({ courseId })

            sendResponse(res, 200, true, null, 'Course deleted successful')
            return
        }
    } catch (error) {
        console.log('UNABLE TO DELETE COURSE', error)
        sendResponse(res, 500, false, null, 'Unable to delete course')
    }
}

//get instructor courses (instructor)
export async function getInstructorCourse(req, res) {
  const { userId } = req.user; // instructor ID
  let { limit = 10, page = 1 } = req.query;

  // Convert query params to numbers
  limit = parseInt(limit, 10);
  page = parseInt(page, 10);

  // Ensure sane defaults
  if (isNaN(limit) || limit <= 0) limit = 10;
  if (isNaN(page) || page <= 0) page = 1;

  const skip = (page - 1) * limit;

  try {
    // Get total count for pagination
    const totalCourses = await CourseInfoModel.countDocuments({ userId });

    // Get paginated courses
    const getCourses = await CourseInfoModel.find({ userId })
      .select('-_id -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Prepare pagination info
    const data = {
        courses: getCourses,
        total: totalCourses,
        page,
        limit,
        totalPages: Math.ceil(totalCourses / limit),
    };

    return sendResponse(res, 200, true, data, 'Instructor courses');
  } catch (error) {
    console.log('UNABLE TO GET INSTRUCTOR COURSES', error);
    return sendResponse(res, 500, false, null, 'Unable to get instructor courses');
  }
}

//get all course (student)
export async function getCourses(req, res) {
  let { limit = 10, page = 1, search, } = req.query;
  const query = { active: true };

  // Add search support (case-insensitive)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },        
      { description: { $regex: search, $options: "i" } },  
      { userId: { $regex: search, $options: "i" } },  
      { courseId: { $regex: search, $options: "i" } },  
    ];
  }

  // Convert query params to numbers
  limit = parseInt(limit, 10);
  page = parseInt(page, 10);

  if (isNaN(limit) || limit <= 0) limit = 10;
  if (isNaN(page) || page <= 0) page = 1;

  const skip = (page - 1) * limit;

  try {
    // Count total courses matching query
    const totalCourses = await CourseInfoModel.countDocuments(query);

    // Fetch paginated results
    const getCourses = await CourseInfoModel.find(query)
      .select("-_id -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Response payload
    const data = {
      courses: getCourses,
      total: totalCourses,
      page,
      limit,
      totalPages: Math.ceil(totalCourses / limit),
    };

    return sendResponse(res, 200, true, data, "Available courses");
  } catch (error) {
    console.log("UNABLE TO GET COURSES", error);
    return sendResponse(res, 500, false, null, "Unable to get courses");
  }
}

//get a course
export async function getCourse(req, res) {
    const { courseId } = req.params

    try {
        const course = await CourseInfoModel.findOne({ courseId }).select('-_id -__v')
        if(!course) return sendResponse(res, 404, false, null, 'Course not found')

        sendResponse(res, 200, true, course, 'Course fetched successful')
    } catch (error) {
        console.log('UNABLE TO GET COURSE', error)
        sendResponse(res, 500, false, null, 'Unable to get course')
    }
}

//get my course (student)
export async function getStudentCourses(req, res) {
  let { limit = 10, page = 1 } = req.query;
  const { courses } = req.user;

  limit = parseInt(limit, 10);
  page = parseInt(page, 10);

  if (isNaN(limit) || limit <= 0) limit = 10;
  if (isNaN(page) || page <= 0) page = 1;

  const skip = (page - 1) * limit;

  try {
    if (!courses || courses.length === 0) {
      return sendResponse(res, 200, true, { courses: [], total: 0, page, limit, totalPages: 0 }, "No courses found for student");
    }

    // total courses
    const totalCourses = await CourseInfoModel.countDocuments({ courseId: { $in: courses } });

    //paginate courses
    const studentCourses = await CourseInfoModel.find({ courseId: { $in: courses } })
      .select("-_id -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Response payload
    const data = {
      courses: studentCourses,
      total: totalCourses,
      page,
      limit,
      totalPages: Math.ceil(totalCourses / limit),
    };

    return sendResponse(res, 200, true, data, "Student courses");
  } catch (error) {
    console.log("UNABLE TO GET STUDENT COURSES", error);
    return sendResponse(res, 500, false, null, "Unable to get student courses");
  }
}
