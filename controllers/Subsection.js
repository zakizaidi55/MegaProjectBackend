const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");


exports.createSubSection = async (req, res) => {
    try{    
        
        // fetch data from req body
        const {sectionId, title, timeDuration, description} = req.body;

        // extract file/video
        const video = req.files.videoFile;

        // validations
        if(!sectionId || !title || !timeDuration || ! description || !video) {
           return res.status(400).json( {
            success:false,
            message:"All files are required",
           });
        }
        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);
        // create a sub section
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })
        // update section with this sub section information
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                        {$push:{
                                                            subSection:subSectionDetails._id,
                                                        }},
                                                        {new:true},
                                                        ).populate("subSection");
        
        // return response

        return res.status(200).json( {
            success:true,
            message:"Sub section created successfully",
            updatedSection,
        })


    } catch(error) {
        return res.status(500).json( {
            message:false,
            message:"Error while created the sub section",
        })
    }
}

// update sub section
exports.updateSubSection = async (req, res) => {
	try {
		const {sectionId, title, timeDuration, description} = req.body;
		const section = await SubSection.findByIdAndUpdate(
			sectionId,
			{ title },
            {timeDuration},
            {description},
			{ new: true }
		);
		res.status(200).json({
			success: true,
			message: section,
		});
	} catch (error) {
		console.error("Error updating section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};



// Delete sub section
exports.deleteSubSection = async (req, res) => {
	try {
		const { sectionId } = req.params;
		await SubSection.findByIdAndDelete(sectionId);
		res.status(200).json({
			success: true,
			message: "Section deleted",
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};