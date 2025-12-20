import { Redirect } from 'expo-router';

export default function ReportsIndex() {
  // Redirect to my-reports as the default reports screen
  return <Redirect href="/reports/my-reports" />;
}
