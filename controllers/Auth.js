const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// send OTP
exports.sendOTP = async (req,res) => {
    try {
    const {email} = req.body;
     

    // check if user already exist
    const checkUserPresent = await User.findOne({email});

    // if existing user found
    if(checkUserPresent) {
        return res.status(401).json( {
            success:false,
            message:"User already exist",
        })
    }

    // generate OTP
    var otp = otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    })

    console.log("OTP generated->", otp);

    // check unique OTP or not
    let result = await OTP.findOne({ otp :otp});

    while(result) {
        otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        result = await OTP.findOne({ otp :otp});
    }

    const otpPayload = {email,otp};

    // create an entry in DB for DB

    const optBody = await OTP.create(otpPayload);
    console.log(optBody);

    // return response

    res.status(200).json({
        success:true,
        message:"OTP send successfully",
        otp,
    })
    
    } catch (error) {

        console.log(error);
        res.status(500).json({
            success:false,
            message:error.message,
        })
    } 

}


// sign Up

exports.signUp = async (req, res) => {
    
       
    try{    
        // data fetch from req body
      const {
        firstName,
        lastName, 
        email,
        password,
        confirmPassword,
        accountType,
        contactNumber,
        OTP
      } = req.body;
        // validate karlo
        if(!firstName || !lastName || !email || !password || !confirmPassword 
            || !OTP ) {
                return res.status(403).json( {
                    success:false,
                    message:"All fields are required",
                })
            }

        // 2 password-> password and confirm password
        if(password !== confirmPassword) {
            return res.status(400).json( {
                success:false,
                message:"Password and confirm password is not natched",

            });

        }

        // check user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({
                success:false,
                message:"user is already exist",
            });
        }

        // find most recent otp for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log("recent Otp:-", recentOtp);
        // validate otp
        if(recentOtp.lenght == 0) {
            // OTP not found
            return res.status(400).json( {
                success:false,
                message:"OTP not found",
            })
        } else if(otp !== recentOtp) {
            // invalid otp
            return res.status(400).json( {
                success:false,
                message:"Invalid OTP",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // entry create in DB
        
        const profileDetails = await Profile.create( {
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });
        
        const user = await User.create( {
            firstName,
            lastName,
            email,
            password:hashedPassword,
            accountType,
            additionalDetails:profileDetails._id,  
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastname}`,
        })

        // return res
        return res.status(200).json( {
            success:true,
            message:"User is registered successfully",
        })

    } catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"user cannot be registered succeddfully, please try again",
        })
    }
}

// login

exports.login = async (req, res) => {
    try{
        // get data from req body
        const{email, password} = req.body;
        // validata the data
        if(!email || !password) {
            return res.status(403).json({
                success:false,
                message:"All fields are mandatory",

            });

        }
        
        // user check exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user) {
            return res.status(401).json({
                success:false,
                message:"User is not registered, please signup first",  
            })
        }
        // generate JWT after password matching
        if(await bcrypt.compare(password,user.password)) {
            const payload = {
                email:user.email,
                id:user._id,
                accountType :user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn:"2h",
            });
            user.token = token;

            const options = {
                expires:new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }
            // create cookies and send response
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user,
                message:"Logged in successfully",
            })

        }
       
        else {
            return res.status(401).json( {
                success:false,
                message:"Password is Incorrect",
            })
        }


    } catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login failure please try again",
        })
    }
}

// change password

exports.changePassword=async(req,res)=>{
    try{
        //fetch data
        const {email,oldpassword,newPassword,confirmPassword,}=req.body;

        //validation
        if(!email || !oldpassword || !newPassword || !confirmPassword){
            res.status(401).json({
                sucess:false,
                message:"Please Fill All The Detail",
            })
        }

        const passwordCheckDB = await User.find({password:oldpassword});

        if(!passwordCheckDB){
            res.status(500).json({
                success:false,
                message:"Please fill Correct Password "
            })
        }

        const updatePassword = await User.findOneAndUpdate({email},{
            password:newPassword,
        })

        res.status(200).json({
            success:true,
            message:"password changed SuccessFully",
        })
    } catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:'CouldnT Change Password Please Try Again letter With Correct Email and Password',
        });
    }


}

