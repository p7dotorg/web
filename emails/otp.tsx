import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components"

interface OtpEmailProps {
  code: string
  isNewUser?: boolean
}

export default function OtpEmail({ code = "123456", isNewUser = false }: OtpEmailProps) {
  const headline = isNewUser ? "Welcome to paper7." : "Here's your sign-in code."
  const sub = isNewUser
    ? "You're joining a community of readers who annotate what matters in research."
    : "Use this code to continue. It expires in 10 minutes."

  return (
    <Html lang="en">
      <Head />
      <Preview>{code} — your paper7 code</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={logo}>paper7</Text>

          <Text style={headline_}>{headline}</Text>
          <Text style={subtext}>{sub}</Text>

          <Section style={codeBox}>
            <Text style={codeText}>{code}</Text>
          </Section>

          <Text style={expiry}>Expires in 10 minutes · Do not share this code</Text>

          <Hr style={divider} />

          <Text style={footer}>
            You received this because someone tried to sign in to{" "}
            <Link href="https://paper7.org" style={footerLink}>paper7.org</Link>{" "}
            with this email. If this wasn't you, ignore it.
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: "#f6f6f4",
  fontFamily: "Georgia, serif",
  margin: 0,
  padding: "48px 0",
}

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  maxWidth: "520px",
  margin: "0 auto",
  padding: "48px 40px",
  borderRadius: "8px",
}

const logo: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: "20px",
  fontWeight: 400,
  color: "#0a0a0c",
  letterSpacing: "-0.5px",
  margin: "0 0 40px 0",
}

const headline_: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: "26px",
  fontWeight: 400,
  color: "#0a0a0c",
  lineHeight: "1.25",
  letterSpacing: "-0.3px",
  margin: "0 0 8px 0",
}

const subtext: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "14px",
  color: "#666666",
  lineHeight: "1.6",
  margin: "0 0 36px 0",
}

const codeBox: React.CSSProperties = {
  backgroundColor: "#f6f6f4",
  border: "1px solid #e5e5e3",
  borderRadius: "10px",
  padding: "28px 16px",
  textAlign: "center",
}

const codeText: React.CSSProperties = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: "42px",
  fontWeight: 700,
  color: "#0a0a0c",
  letterSpacing: "14px",
  textIndent: "14px",
  lineHeight: "1",
  margin: 0,
  textAlign: "center",
}

const expiry: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  color: "#aaaaaa",
  textAlign: "center",
  margin: "14px 0 0 0",
}

const divider: React.CSSProperties = {
  borderColor: "#e5e5e3",
  margin: "36px 0 28px 0",
}

const footer: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  color: "#aaaaaa",
  lineHeight: "1.6",
  margin: 0,
}

const footerLink: React.CSSProperties = {
  color: "#666666",
  textDecoration: "none",
}
