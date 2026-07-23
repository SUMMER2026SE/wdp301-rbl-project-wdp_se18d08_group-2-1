const { google } = require("googleapis");


const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);


oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});


const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
});


async function sendGmail({
    to,
    subject,
    text,
    html,
}) {

    const message = [
        `From: PHOTOHUB <${process.env.GMAIL_USER}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        html,
    ].join("\r\n");


    const encoded = Buffer
        .from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");


    await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encoded
        }
    });


    console.log(`[GMAIL API] Sent ${to}`);
}


module.exports = {
    sendGmail
};