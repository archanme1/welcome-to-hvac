import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

import {
  BrandFooter,
  BrandHeader,
  button,
  container,
  darkModeCss,
  h1,
  link,
  main,
  notice,
  text,
} from './brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for creating an account on{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Confirm {recipient} to activate your account and start learning.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirm my email
        </Button>
        <Text style={notice}>
          Security notice: this confirmation link expires after a short time and
          can only be used once. If you did not create an account, you can
          safely ignore this email.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
