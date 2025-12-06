import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        // Use SendGrid to send email
        try {
          await sgMail.send({
            to: email,
            from: process.env.EMAIL_FROM || 'noreply@example.com',
            subject: 'Sign in to Xeno Shopify Insights',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #718096; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🚀 Xeno Shopify Insights</h1>
                    </div>
                    <div class="content">
                      <h2>Sign in to your account</h2>
                      <p>Click the button below to sign in to your Xeno Shopify Insights account:</p>
                      <a href="${url}" class="button">Sign In</a>
                      <p>Or copy and paste this link into your browser:</p>
                      <p style="word-break: break-all; color: #667eea;">${url}</p>
                      <p style="margin-top: 30px; color: #718096;">This link will expire in 24 hours.</p>
                    </div>
                    <div class="footer">
                      <p>If you didn't request this email, you can safely ignore it.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            text: `Sign in to Xeno Shopify Insights\n\nClick this link to sign in: ${url}\n\nThis link will expire in 24 hours.`,
          });
          console.log('✅ Email sent successfully via SendGrid to:', email);
        } catch (error) {
          console.error('❌ SendGrid error:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};
