const https = require('https')

module.exports.isRecaptchaResponseValid = async function (g_recaptcha_response) {
    const recaptchaVerifyData = `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${g_recaptcha_response}`
    try {
        let verificationResponse = await new Promise((resolve, reject) => {
            const recaptchaReq = https.request({
                hostname: 'www.google.com',
                port: 443,
                path: '/recaptcha/api/siteverify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': recaptchaVerifyData.length
                }
            }, res => {
                res.on('data', rawBuffer => {
                    let data = JSON.parse(rawBuffer.toString())
                    if (!data.success) return reject(data)
                    resolve(data)
                })
            })
            recaptchaReq.on('error', error => {
                reject(error)
            })
            recaptchaReq.write(recaptchaVerifyData)
            recaptchaReq.end()
        })
        return true
    }
    catch (error) {
        return false
    }
    
}

