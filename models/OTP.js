const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OPTSchema = mongoose.Schema( {
    email:{
        type:String,
        required:true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires:5*60,
    }
});

// OTP sender using PRE middleware
async function sendVerificationEmail(email, otp) {
    try{        
        const mailResponse = await mailSender(email,"Verification email from study notion",otp);
        console.log("Email send successfully", mailResponse);

    } catch(error) {
        console.log("error occured while sending mail", error);
        throw error;
    }
}
OPTSchema.pre("save", async function(next){
   await sendVerificationEmail(this.email, this.otp);
    next();
})

module.exports = mongoose.model("OTP",OPTSchema); 