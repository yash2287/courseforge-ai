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

interface DeadlineReminderEmailProps {
  userName: string;
  courseTitle: string;
  orgName: string;
  daysLeft: number;
  dueDate: string;
  courseUrl: string;
}

export default function DeadlineReminderEmail({
  userName = "Team Member",
  courseTitle = "Course Title",
  orgName = "Your Organization",
  daysLeft = 3,
  dueDate = "Jan 1",
  courseUrl = "#",
}: DeadlineReminderEmailProps) {
  const urgencyColor = daysLeft <= 1 ? "#dc2626" : daysLeft <= 3 ? "#d97706" : "#b8860b";
  const urgencyLabel = daysLeft <= 0 ? "OVERDUE" : daysLeft === 1 ? "Due tomorrow" : `Due in ${daysLeft} days`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>CourseForge</Text>
          </Section>
          <Section style={content}>
            <Section style={{ ...urgencyBanner, backgroundColor: urgencyColor + "10", borderColor: urgencyColor + "30" }}>
              <Text style={{ ...urgencyText, color: urgencyColor }}>{urgencyLabel}</Text>
            </Section>
            <Text style={heading}>Deadline Reminder</Text>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              This is a reminder that your assigned course is {daysLeft <= 0 ? "overdue" : `due on ${dueDate}`}:
            </Text>
            <Section style={courseCard}>
              <Text style={courseTitle_}>{courseTitle}</Text>
              <Text style={{ ...dueDateStyle, color: urgencyColor }}>Due: {dueDate}</Text>
            </Section>
            <Section style={buttonContainer}>
              <Button style={button} href={courseUrl}>
                Continue Learning
              </Button>
            </Section>
            <Text style={paragraph}>
              {daysLeft <= 0
                ? "Please complete this course as soon as possible to maintain compliance."
                : "Complete this course before the deadline to stay on track."}
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Sent by CourseForge AI on behalf of {orgName}
            </Text>
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

const urgencyBanner = {
  borderRadius: "8px",
  padding: "8px 16px",
  marginBottom: "20px",
  textAlign: "center" as const,
  border: "1px solid",
};

const urgencyText = {
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0",
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

const courseCard = {
  backgroundColor: "#faf9f6",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
  border: "1px solid #e8e4de",
};

const courseTitle_ = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  marginBottom: "4px",
};

const dueDateStyle = {
  fontSize: "13px",
  fontWeight: "500",
  margin: "0",
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
