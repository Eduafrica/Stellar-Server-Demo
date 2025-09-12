import sendEmail from "./emailService.js";

const logourl = "https://i.ibb.co/HtNmMC5/Group-625936.png";
const twUrl = ""; // Add Twitter URL
const fbUrl = ""; // Add Facebook URL
const igUrl = ""; // Add Instagram URL

const twImg = 'https://i.ibb.co/TrkW705/Vector.png'; //
const fbImg = 'https://i.ibb.co/Qd51cS7/Vector.png'; //
const igImg = 'https://i.ibb.co/BwXQBCr/Social-icon.png'; //

const currentYear = new Date().getFullYear();

export function emailFooter(email) {
  return `
    <br />
    <p style="color: #000; font-size: 16px; font-weight: 400;">
        Need Help? Our support team is available 24/7 to assist you with any questions or issues. Just reply to this email or visit our Help Center within the website.
    </p>
    <p style="color: #004225; font-size: 14px; font-weight: 400;">
        Accessible and borderless education for africa
    </p>
    <p style="color: #000; font-size: 16px; font-weight: 400;">
        <b>Best regards</b>,<br />Eduafrica Team
    </p>
    <footer style="margin-top: 20px; font-size: 12px; color: #000;">
        <p>This email was sent to <span style="color: #004225;">${email}</span>. 
           If you prefer not to receive similar notifications, you can 
           <a href="#" style="color: 004225;">unsubscribe</a> or 
           <a href="#" style="color: #004225;">manage your email preferences</a>.
        </p>
        <p style="text-align: center;">© ${currentYear} Eduafrica</p>
        <br />
        <div style="display: flex; gap: 40px; align-items: center; justify-content: space-between;">
          <img src="${logourl}" alt="Logo" style="width: 80px; height: auto; margin-right: 20px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="${twUrl}" style="text-decoration: none; color: inherit;">
              <img src=${twImg} style="width: 20px; height: auto; margin-left: 5px; margin-right: 5px;" />
            </a>
            <a href="${fbUrl}" style="text-decoration: none; color: inherit;">
              <img src=${fbImg} style="width: 20px; height: auto; margin-left: 5px; margin-right: 5px;" />
            </a>
            <a href="${igUrl}" style="text-decoration: none; color: inherit;">
              <img src=${igImg} style="width: 20px; height: auto; margin-left: 5px; margin-right: 5px;" />
            </a>
          </div>
        </div>
    </footer>
  `;
}

export async function sendWelcomeEmail({
  email,
  name = "",
  buttonLink = `${process.env.GET_STARTED_URL}`,
  buttonText = "Increase in Knowledge Here",
  title = "Happy to have you on Educafrica!!!",
}) {
  if (!email) {
    throw new Error("Email is required to send a welcome email.");
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="display: flex; align-items: left; margin-bottom: 20px;">
            <img src="${logourl}" alt="Logo" style="width: 100px; height: auto; margin-right: 20px;">
        </div>
        <br />
        <br />
        <p style="color: #000; font-size: 16px; font-weight: 400;">Hello 👋 ${name},</p>
        <p style="color: #004225; font-size: 16px; font-weight: 400;">
            Welcome to Eduafrica
        </p>
        <p style="color: #000; font-size: 16px; font-weight: 400;">
            Start your Education teaching journey here Eduafrica is here for you

        <p style="color: #000; font-size: 21px; font-weight: 400;">
            <b>
                Explore Opportunities with Eduafrica
            </b>
        </p>

        <br />
        <br />
        <div style="text-align: center; margin: 20px 0; background: #007BFF; padding: 10px 20px; border-radius: 8px;">
            <a href="${buttonLink}" style="display: inline-block; background-color: #007BFF; color: white; text-decoration: none;">${buttonText}</a>
        </div>

        ${emailFooter(email)}
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: title,
      html: emailContent,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendAccountActivationEmail({
  email,
  name = "",
  buttonLink = `${process.env.GET_STARTED_URL}`,
  buttonText = "Get Started",
  title = "EDUAFRICA ACCOUNT ACTIVATED!",
}) {
  if (!email) {
    throw new Error("Email is required to send a welcome email.");
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="display: flex; align-items: left; margin-bottom: 20px;">
            <img src="${logourl}" alt="Logo" style="width: 100px; height: auto; margin-right: 20px;">
        </div>
        <br />
        <br />
        <p style="color: #000; font-size: 16px; font-weight: 400;">Hello 👋 ${name},</p>
        <p style="color: #004225; font-size: 16px; font-weight: 400;">
            Your Eduafrica account has been activated login now to Explore Opportunities endless quest
        </p>
        <p style="color: #000; font-size: 16px; font-weight: 400;">
            Start your journey with Eduafrica and discover new opportunities to grow, connect, and thrive.
        </p>

        <br />
        <br />
        <div style="text-align: center; margin: 20px 0; background: #007BFF; padding: 10px 20px; border-radius: 8px;">
            <a href="${buttonLink}" style="display: inline-block; background-color: #007BFF; color: white; text-decoration: none;">${buttonText}</a>
        </div>

        ${emailFooter(email)}
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: title,
      html: emailContent,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send account activation email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendOtpEmail({
    email,
    name = "",
    code = [],
    buttonLink = "#",
    buttonText = "Verify Email",
    title = "Eduafrica Verification OTP code",
  }) {
    if (!email) {
      throw new Error("Email is required to send OTP email.");
    }
  
    const otpCodeHtml = code
    .map(
      (i) =>
        `<div style="height: 64px; weight: 64px; display: flex; align-items: center; justify-content: center; border: 2px solid #004225; border-radius: 8px; padding: 2px 8px; font-weight: 500px; font-size: 48px; color: #004225; text-align: center; margin-left: 4px; margin-right: 4px;">
        ${i}
        </div>`
    )
    .join("");
  
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <div style="display: flex; align-items: left; margin-bottom: 20px;">
              <img src="${logourl}" alt="Logo" style="width: 100px; height: auto; margin-right: 20px;">
          </div>
          <br />
          <br />
          <p style="color: #000; font-size: 16px; font-weight: 400;">Welcome ${name},</p>
          <p style="color: #000; font-size: 16px; font-weight: 400;">
             Happy 🥳 to have on Eduafrica platform. In order to get started, verify your account with the OTP below:
          </p>
  
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;" >
          ${otpCodeHtml}
          </div>
  
          <br />
            <p style="color: #000; font-size: 16px; font-weight: 400;">
                <b>
                    Please verify OTP on the device that was used to register email address
                </b>
          </p>
          <p style="color: #000; font-size: 16px; font-weight: 400;">
              This code will only be valid for the next 15 minutes
          </p>

            ${emailFooter(email)}
      </div>
    `;
  
    try {
      await sendEmail({
        to: email,
        subject: title,
        html: emailContent,
      });
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send OTP email to ${email}:`, error.message);
      throw error;
    }
  }

  export async function sendNewLoginEmail({
    email,
    name = "",
    time = Date.now(),
    device = {},
    title = "Login Notification | Eduafrica`",
  }) {
    if (!email) {
      throw new Error("Email is required to send login notification email.");
    }
  
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <div style="display: flex; align-items: left; margin-bottom: 20px;">
              <img src="${logourl}" alt="Logo" style="width: 100px; height: auto; margin-right: 20px;">
          </div>
          <br />
          <br />
          <p style="color: #000; font-size: 16px; font-weight: 400;">Hello 👋 <span style="color: #004225;">${name}</span>,</p>
          <p style="color: #000; font-size: 16px; font-weight: 400;">
              A successful login attempt on your account.
          </p>
          <br />
          <strong>Details:</strong>
          <p style="color: #004225; font-size: 16px; font-weight: 400;">
              <strong>- Time</strong>: ${time}
          </p>
          <p style="color: #004225; font-size: 16px; font-weight: 400;">
              <strong>- Device</strong>: ${device?.device} <br> ${device?.location}
          </p>
          <p style="color: #004225; font-size: 16px; font-weight: 400;">
              <strong>- Operating System</strong>: ${device?.deviceType} <br> ${device?.location}
          </p>
          <p style="color: #004225; font-size: 16px; font-weight: 400;">
              <strong>- Location</strong>: ${device?.location}
          </p>
  
          <br />
          ${emailFooter(email)}
      </div>
    `;
  
    try {
      await sendEmail({
        to: email,
        subject: title,
        html: emailContent,
      });
      console.log(`Login attempt email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send login notification email to ${email}:`, error.message);
      throw error;
    }
  }

  export async function sendForgotPasswordEmail({
  email,
  name = "",
  buttonLink = `#`,
  buttonText = "Reset Password",
  title = "Password reset request | Eduafrica",
}) {
  if (!email) {
    throw new Error("Email is required to send a welcome email.");
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="display: flex; align-items: left; margin-bottom: 20px;">
            <img src="${logourl}" alt="Logo" style="width: 100px; height: auto; margin-right: 20px;">
        </div>
        <br />
        <br />
        <p style="color: #000; font-size: 16px; font-weight: 400;">Hi 👋 ${name},</p>
        <p style="color: #004225; font-size: 16px; font-weight: 400;">
            Your password reset link here click on the button to reset password. link is valid for 15min
        </p>

        <br />
        <br />
        <div style="text-align: center; margin: 20px 0; background: #007BFF; padding: 10px 20px; border-radius: 8px;">
            <a href="${buttonLink}" style="display: inline-block; background-color: #007BFF; color: white; text-decoration: none;">${buttonText}</a>
        </div>
        <br />
            <p style="color: #000; font-size: 16px; font-weight: 400;">
                <b>
                    Please verify OTP on the device that was used to request reset link
                </b>
            </p>
        <br />
        <small style="color: #000; font-size: 15px; font-weight: 400;">
            Unbale to click link? Copy link below<br />
            <small style="color: #000; font-size: 15px; font-weight: 400;">
                ${buttonLink}
            </small>
        </small>

        <br />
        <small style="color: #000; font-size: 15px; font-weight: 400;">
            Did not initiate this request? disregard email
        </small>

        ${emailFooter(email)}
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: title,
      html: emailContent,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send forgot password email to ${email}:`, error.message);
    throw error;
  }
}