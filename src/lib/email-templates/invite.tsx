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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>You have been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>You have been invited</Heading>
        <Text style={text}>
          You have been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Accept the invitation below to create your account.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Accept invitation
        </Button>
        <Text style={notice}>
          Security notice: this invitation link expires after a short time and
          can only be used once. If you were not expecting it, you can safely
          ignore this email.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
