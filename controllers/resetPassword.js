const User = require("../models/User");
const mailSender = require("../utils/mailSender");
// resetpasswordToken->reset the password, sending the mail

exports.resetPasswordToken = async (req, res) => {
   try{
    // get email from req body
    const email = req.body.email;

    // check user for this email
    const user = await User.findOne({email:email});
    if(!user) {
        return res.status(400).json( {
            success:false,
            message:'Your Email is not registered with us',
        })
    }
    // generate token
    const token = crypto.randomUUID();
    // update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate( 
                                    {email:email},
                                    {
                                        token:token,
                                        resetPasswordExpires:Date.now() + 5*60*1000,
                                    },
                                    {new:true});
                                    
    // create url
    const url = `https://localhost:3000/update-password/${token}`;

    // send mail containing OTP
    await mailSender(email,"Password reset Link", 
                                    `Password reset Link: ${url}`
    );
    // return response
    
    return res.status(200).json({
        success:true,
        message:"Password Link send successfully",
    })
   
    } catch(error) {
    console.log(error);
    return res.status(500).json({
        success:false,
        message:"Something went wrong in sending reset link",
    })
   }


   
}
// resetPassword->update in DB

exports.resetPassword = async(req,res) => {
    try {
        // data fetch
        const {password, confirmPassword, token} = req.body;

        // validations
        if(password !== confirmPassword) {
            return res.json({
                success:false,
                message:'Password is not matching',

            });
        }
        // get user details from DB
        const userDetails = User.findOne({token : token});

        // if no entry-invalid token
        if(!userDetails) {
            return res.json( {
                success:false,
                message:'token is invalid',
            })
        }
        // token time check
        if(userDetails.resetPasswordExpires < Date.now()) {
            return res.json( {
                success:false,
                message:'Token is expired, please regenerate your token',
            })
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password,10);
        // password update
        await User.findByIdAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        );
        // return res
        return res.status(200).json({
            success:true,
            message:"Password reset is Successfully",
        })
    } catch(error) {
        console.log(error);
        return res.status(401).json({
            success:false,
            message:"Something is wrong while changing the password",
        })
    }
}