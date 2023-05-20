const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req,res) => {

    try{
        // data fetch
        const{sectionName, courseId} = req.body; 
        // data validation
        if(!sectionName || courseId) {
            return res.status(400).json( {
                success:false,
                message:"Missing properties",
            });
        }
        // create section
        const newSection = await sectionName.create({sectionName});
        // update the course with section object ID
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                            courseId,
                                            {
                                                $push:{
                                                    courseContent:newSection._id,
                                                }
                                            },
                                            {new:true}
                                        )
                                        .populate({
                                            path: "courseContent",
                                            populate: {
                                                path: "subSection",
                                            },
                                        })
                                        .exec();

        // return responce
        return res.status(200).josn({
            success:true,
            message:"Section created successfully",
            updatedCourseDetails,
        })


    } catch(error) {
        return res.status(500).json({
            success:false,
            message:"Error while creating section",
            error:error.message,
        })
    }

}

exports.updateSecton = async (req, res) => {
    try {

        // data input
        const {sectionName, sectionId} = req.body;
        // data validation
        if(!sectionName || !sectionId) {
            return res.status(400).json( {
                success:false,
                message:"Missing properties",
            });
        }
        // update the data
        const section = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});
        // return response
        return res.status(200).json( {
            success:true,
            message:"Update the section successfully",

        })

    } catch(error) {
        return res.status(500).json({
            success:false,
            message:"Error while updating section",
            error:error.message,
        })
    }
}

exports.deleteSection = async (req, res) => {
    try {
        // get id-assuming that we are sending ID in params
        const {sectionId} = req.params;
         

        // use findBYIdAndDelete
        await Section.findByIdAndDelete(sectionId);
        // Todo : do we need to delete the entry from the course schema??
        // return the response
        return res.status(200).json( {
            success:true,
            message:"section Deleted successfully",
        });
         

    } catch(error) {
        return res.status(500).json({
            success:false,
            message:"Error while Deleting section",
            error:error.message,
        })
    }

}