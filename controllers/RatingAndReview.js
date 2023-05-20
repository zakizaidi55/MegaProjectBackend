const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

// createRating
exports.createRating = async(req, res) => {
    try{
        // get user id
        const userId = req.user.id;

        // fetch from req body
        const {rating, review, courseId} = req.body;

        // check if user is enrolled or not
        const courseDetails = await Course.findOne(
                                        {_id:courseId,
                                        studentsEnrolled:{$elementMatch:{$eq : userId}}
                                    });
        if(!courseDetails) {
            return res.status(400).json( {
                success:false,
                message:"User is not enrolled is not"
            })
        }

        // check student is already rated a course or not
        const alreadyReviewed = await RatingAndReview.find(
                                                {user:userId,
                                                course:courseId,}
        );

        if(!alreadyReviewed) {
            return res.status(400).json( {
                success:false,
                message:"course is already reviewd by the user",
            })
        }
        // create rating
        const ratingReview = await RatingAndReview.create({
                                                rating:rating,
                                                course:courseId,
                                                user:userId,
        });

        // update course with this rating and review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
                                {
                                $push:{
                                    ratingAndReview:ratingReview._id,
                                }
        },
        {new:true});
        console.log(updatedCourseDetails);
        // return response
        return res.status(200).json({
            success:true,
            message:'rating is '
        })
    } catch(error) {
        return res.status(400).json( {
            success:false,
            message:"course is already reviewd by the user",
        })
    }
};


// getAverageRating
exports.getAverageRating = async(req, res) => {
    try{    
        // get course Id
        const courseId = req.body.courseId;

        // calculate average rating
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId),
                },
            }, 
            {
                $group:{
                    _id:null,
                    averageRating:{$avg:"$rating"},
                },
            }

        ])
        // return rating
        if(result.length > 0) {
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating,
            })
        }

        // if no review and rating exists
        return res.status(200).json({
            success:true,
            message:'Average rating is 0, no rating given till now',
            averageRating:0,
        })
    } catch(error) {
        return res.status(400).json( {
            success:false,
            message:"Error while fetching the result",
        })
    }
};


// getAllRating
exports.getAllRating = async(req, res) => {
    try{
        const allReviews = await ratingAndReview.find({}
                                            .sort({rating:"desc"})
                                            .populate
                                            )
    } catch(error) {

    }
}