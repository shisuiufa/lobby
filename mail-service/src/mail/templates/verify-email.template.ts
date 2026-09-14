import { MailTemplate, VerifyEmailTemplateInput } from './mail-template.type';

export function verifyEmailTemplate(
  input: VerifyEmailTemplateInput,
): MailTemplate {
  return {
    subject: 'Verify your email',

    text: `
Verify your email address

Please confirm your email address by opening the link below:

${input.verificationUrl}

If you did not create this account, you can ignore this email.
    `.trim(),

    html: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Verify your email</title>
        </head>

        <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="background:#f5f5f5;padding:40px 16px;"
          >
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="max-width:560px;background:#ffffff;border-radius:12px;padding:40px;"
                >
                  <tr>
                    <td>
                      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">
                        Verify your email
                      </h1>

                      <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#555;">
                        Please confirm your email address by clicking the button below.
                      </p>

                      <a
                        href="${input.verificationUrl}"
                        style="
                          display:inline-block;
                          padding:14px 22px;
                          background:#111;
                          color:#fff;
                          text-decoration:none;
                          border-radius:8px;
                          font-size:16px;
                          font-weight:600;
                        "
                      >
                        Verify email
                      </a>

                      <p style="margin:32px 0 8px;font-size:14px;line-height:1.6;color:#777;">
                        If the button does not work, copy and paste this link into your browser:
                      </p>

                      <p style="margin:0;font-size:14px;line-height:1.6;word-break:break-all;">
                        <a
                          href="${input.verificationUrl}"
                          style="color:#111;"
                        >
                          ${input.verificationUrl}
                        </a>
                      </p>

                      <p style="margin:32px 0 0;font-size:14px;line-height:1.6;color:#999;">
                        If you did not create this account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim(),
  };
}
