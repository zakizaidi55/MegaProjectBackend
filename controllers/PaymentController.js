const {instance} = require("../config/razorPay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
// const {courrseEnrollmentEmail} = requestAnimationFrame

// cature the payment and initiate the razorpay order
exports.capturePayment = async(req, res) => {
    // get user id and course id
    const {course_id} = req.body;
    const userId = req.user.id;
    // validations
    if(!course_id) {
        return res.json( {
            success:false,
            message:'Please provide Valid course ID',
        })
    };

    // valid course
    let course;
    try {
        course = await Course.findById(course_id);
        if(!course) {
            return res.json( {
                success:false,
                message:'could not find the course',
            });
        }
        // user already pay for the same course
        const uid = new mongoose.Types.objectId(userId); //convert the string type into object id
        if(course.studentsEnrolled.includes(uid)) {
            return res.status(200).json( {
                success:false,
                message:'Student is already enrolled',
            });
        }

    } catch(error) {
        console.error(error);
        return res.status(500).json( {
            success:false,
            message:error.message,
            
        })
    }
    
    
    // order create
    const amount = course.price;
    const curreny = "INR";
    const options = {
        amount:amount*100,
        curreny,
        receipt:Math.random(Date.now()).toString(),
        notes:{
            courseId:course_id,
            userId,
        }
    };

    try{
        // initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        return res.status(200).json({
            success:true,
            courseName:course.courseName,
            courseDescription:course.courseDescription,
            thumbnail:course.thumbnail,
            orderId:paymentResponse.id,
            currency:paymentResponse.currency,
            amount:paymentResponse.amount,

        })
    } catch(error) {
        console.log(error);
        return res.json( {
            success:false,
            message:"course buy unsuccessful",
        })
    }
       
};

// verify the signature of razor pay and server
exports.verifySignature = async(req, res) => {
    const webHookSecret = "12345678";
    const signature = req.headers("x-razorpay-signature");

    const shasum = crypto.createHmac("sha256",webHookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hexa");


    if(signature === digest) {
        console.log("Payment is Authorised");

        const{courseId, userId} = req.body.payload.payment.entity.notes;
        try {
            // fulfill the action
            // find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                                                    {_id:courseId},
                                                    {$push:{studentsEnrolled:userId}},
                                                    {new:true},
            );

            if(!enrolledCourse) {
                return res.status(500).json( {
                    success:false,
                    message:'Course not found',

                });
            }
            
            console.log(enrolledCourse);
            // find the student and add the course to their list enrolled courses 
            const enrolledStudent = await User.findOneAndUpdate(
                                                            {_id:userId},
                                                            {$push:{courses:courseId}},
                                                            {new:true},
            );
            console.log(enrolledStudent);
            // mail send to the student who enrolled 
            const emailResponse = await mailSender(
                                    enrolledStudent.email,
                                    "Coongratulations from code help",
                                    "Congratulations you are enrolled to the course",

            )
            console.log(emailResponse);
            return res.status(200).json( {
                success:true,
                message:'signature verified and course added',
            })
        } catch(error) {
            console.log(error);
            return res.status(401).json( {
                success:false,
                message:error.message,

            })
        }
    }

    else {
        res.status(400).json( {
            success:false,
            message:error.message,
        })
    }
};