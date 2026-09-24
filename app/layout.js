import "./globals.css";

export const metadata = {
  title: "LinkedIn Message Personalizer",
  description:
    "Your words, personalized by first name. Generate messages and send them manually.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}