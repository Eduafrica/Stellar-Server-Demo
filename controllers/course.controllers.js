import { generateUniqueCode, sendResponse } from "../middlewares/utils.js"
import CategoriesModel from "../model/Categories.js";
import CourseInfoModel from "../model/CourseInfo.js"
import NotificationModel from "../model/Notification.js";

//convert category name into slug
function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "");
}

//create a function to check if each item in the categories (must be an array of strings) passed already exist in CategoryModel otherwise create it. then return the category passed this time in this format [{ name: 'name of category' , _id: 'id from the category created in category model' }]
export async function ensureCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  const normalized = [];

  for (let rawName of categories) {
    const cleanName = rawName.trim();
    const slug = toSlug(cleanName);

    // check if already exists by slug
    let category = await CategoriesModel.findOne({ slug });

    // create if not found
    if (!category) {
      category = await CategoriesModel.create({
        name: cleanName,
        slug,
      });
    }

    normalized.push({ name: category.name, _id: category._id });
  }

  return normalized;
}

//new course (instructor)
export async function newCourse(req, res) {
    const { userId, name } = req.user
    const { title, image, about, description, price, categories } = req.body
    if(!title) return sendResponse(res, 400, false, null, 'Provide a course title')
    if(!description) return sendResponse(res, 400, false, null, 'Provide a course description')
    if(!price) return sendResponse(res, 400, false, null, 'Provide a course price')
    if(!Array.isArray(categories)) return sendResponse(res, 400, false, null, 'Categories must be an array')
    if(categories.length < 1) return sendResponse(res, 400, false, null, 'Provide at least one categories')
    const newCategories = await ensureCategories(categories);

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
            price,
            categories: newCategories
        })

        await NotificationModel.create({
            userId,
            notification: `YOu have created a new course. Your course is active`
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
    const { courseId, title, image, about, description, price, categories } = req.body
    if(!courseId) return sendResponse(res, 400, false, null, 'Provide a course Id')
    let newCategories
    if(categories) {
        if(!Array.isArray(categories)) return sendResponse(res, 400, false, null, 'Categories must be an array')
        if(categories.length < 1) return sendResponse(res, 400, false, null, 'Provide at least one categories')
        newCategories = await ensureCategories(categories);
        if(categories) getCourse.categories = newCategories
    }

    try {
        const getCourse = await CourseInfoModel.findOne({ courseId })
        if(userId !== getCourse.userId) return sendResponse(res, 403, false, null, 'Not Allowed')

        if(title) getCourse.title = title 
        if(image) getCourse.image = image 
        if(about) getCourse.about = about
        if(description) getCourse.description = description 
        if(price) getCourse.price = price
        if(categories) getCourse.categories = newCategories

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
    if(!courseId) return sendResponse(res, 400, false, null, 'Course Id is required')
    
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
  let { limit = 10, page = 1, search } = req.query;
  const query = { active: true };

  // Add search support (case-insensitive)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { userId: { $regex: search, $options: "i" } },
      { courseId: { $regex: search, $options: "i" } },
      { "categories.name": { $regex: search, $options: "i" } }, // ✅ search inside category name
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
    if(!courseId) return sendResponse(res, 400, false, null, 'Course Id')

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

//new category
export async function newCategory(req, res) {
    const { category } = req.body
    const cleanName = category.trim();
    const slug = toSlug(cleanName);
    try {
        // check if already exists by slug
        let category = await CategoriesModel.findOne({ slug });

        // create if not found
        if (!category) {
          category = await CategoriesModel.create({
            name: cleanName,
            slug,
          });
        }

        sendResponse(res, 201, true, null, 'Successfull')
    } catch (error) {
        console.log('UNABLE TO CREATE CATEGORY',error)
        sendResponse(res, 500, false, null, 'Unable to create ategory')
    }

}

//get category
export async function getCategory(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const categories = await CategoriesModel.find()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await CategoriesModel.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        categories,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      message: 'Categories fetched successful'
    });
  } catch (error) {
    console.error("GET CATEGORY ERROR:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Unable to fetch categories",
    });
  }
}

//delete category
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await CategoriesModel.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Also remove this category from all courses
    await CourseInfoModel.updateMany(
      {},
      { $pull: { categories: { _id: category._id } } }
    );

    res.status(200).json({
      success: true,
      data: null,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Unable to delete category",
    });
  }
}

//update category
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Name is required",
      });
    }

    const slug = toSlug(name);

    // Update the category
    const category = await CategoriesModel.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Category not found",
      });
    }

    // Cascade update in courses
    await CourseInfoModel.updateMany(
      { "categories._id": category._id },
      {
        $set: {
          "categories.$.name": category.name,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Unable to update category",
    });
  }
}