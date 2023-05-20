const Razorpay = requrie("razorPay");

exports.instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.SECRET_KRY,
});