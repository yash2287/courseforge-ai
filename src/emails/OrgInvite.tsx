import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface OrgInviteEmailProps {
  inviteeName: string;
  inviterName: string;
  orgName: string;
  role: string;
  acceptUrl: string;
}

export default function OrgInviteEmail({
  inviteeName = "there",
  inviterName = "Someone",
  orgName = "Organization",
  role = "learner",
  acceptUrl = "#",
}: OrgInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>CourseForge</Text>
          </Section>
          <Section style={content}>
            <Text style={heading}>You&apos;re Invited!</Text>
            <Text style={paragraph}>Hi {inviteeName},</Text>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join <strong>{orgName}</strong> on
              CourseForge as a <strong>{role}</strong>.
            </Text>
            <Section style={infoCard}>
              <Text style={infoLabel}>Organization</Text>
              <Text style={infoValue}>{orgName}</Text>
              <Text style={infoLabel}>Your Role</Text>
              <Text style={infoValue}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
            </Section>
            <Text style={paragraph}>
              CourseForge is an AI-powered training platform. Your organization uses it
              for corporate training, compliance courses, and skill development.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={acceptUrl}>
                Accept Invitation
              </Button>
            </Section>
            <Text style={smallText}>
              This invitation will expire in 7 days. If you didn&apos;t expect this,
              you can safely ignore this email.
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>Sent by CourseForge AI</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#faf9f6",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a1a",
};

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "32px",
  border: "1px solid #e8e4de",
};

const heading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a1a",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#4a4a4a",
  marginBottom: "12px",
};

const infoCard = {
  backgroundColor: "#faf9f6",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
  border: "1px solid #e8e4de",
};

const infoLabel = {
  fontSize: "11px",
  color: "#6a6a6a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 2px",
};

const infoValue = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#1a1a1a",
  marginBottom: "12px",
};

const smallText = {
  fontSize: "12px",
  color: "#9a9a9a",
  lineHeight: "20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#1a1a1a",
  color: "#d4a843",
  padding: "12px 32px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
};

const hr = {
  borderColor: "#e8e4de",
  marginTop: "24px",
};

const footer = {
  textAlign: "center" as const,
  paddingTop: "16px",
};

const footerText = {
  fontSize: "11px",
  color: "#9a9a9a",
  lineHeight: "18px",
  margin: "4px 0",
};
