const Profile = require("../models/Profile");
const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

exports.updateProfile = async(req, res) => {
    try {   
        // get data
        const {dateOfBirth="", about="", contactNumber, gender} = req.body;
        // user ID
        const id = req.user.id;
        // validations
        if(!contactNumber || !gender || !id) {
            return res.status(400).json( {
                success:false,
                message:"All fields are required",
            });

        }   
        // find the profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        // update the profile
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;
        await profileDetails.save();
        // return response
        return res.status(200).json( {
            success:true,
            message:"Profile Updated Successfully",
            profileDetails,
        })


    } catch (error) {
        return res.status(500).josn( {
            success:false,
            message:"Error while updating the profile of user",
            error:error.message,
        })
    }
};

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

// delete account
// explore how can we scheduled this delete handler
exports.deleteAccount = async (req, res) => {
    try{
        // get id
        const id = req.body;
        // validation
        const userDetails = await User.findById(id);
        if(!userDetails) {
            return res.status(404).json( {
                success:false,
                message:'User not found',

            });
        }
        // delete profile
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});
        // delete user
        // todo :HW: unenroll user from all enrolled course
        await Profile.findByIdAndDelete({_id:id});
        
        // return res
        return res.status(200).json( {
            success:true,
            message:'User details delete successfully',
        })
    } catch(error) {
        return res.status(500).json( {
            success:false,
            message:"Error while deleting the User Profile",
            error:error.message,
        })
    }
};

exports.getAllUserDetails = async(req, res) => {
    try {
        // get id
        const id = req.user.id; 
        // validations
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        // return response
        return res.status(200).json( {
            success:true,
            userDetails,
        })
    } catch(error) {
        return res.status(404).json( {
            success:false,
            error:error.message,
        })
    }
};

exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};